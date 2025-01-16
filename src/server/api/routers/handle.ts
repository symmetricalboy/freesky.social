import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "~/server/api/trpc";
import { prisma } from "~/server/db";
import regex from "~/utils/regex";
import { getUserProfile } from "~/utils/bsky";
import { TRPCError } from "@trpc/server";
import { env } from "~/env.mjs";
import { BskyAgent } from '@atproto/api';

async function checkIfHandleIsAvailable(handleValue: string, domainName: string) {
  const handle = await prisma.handle.findFirst({
    where: {
      AND: [
        { handle: { equals: handleValue, mode: "insensitive" } },
        { domain: { name: { equals: domainName, mode: "insensitive" } } },
      ],
    },
  });
  return !handle;
}

const validateHandleFormat = (handle: string): boolean => {
  // Handle should be 3-30 characters
  if (handle.length < 3 || handle.length > 30) {
    return false;
  }

  // Only allow letters, numbers, underscores, and hyphens
  const validHandleRegex = /^[a-zA-Z0-9_-]+$/;
  return validHandleRegex.test(handle);
};

export const handleRouter = createTRPCRouter({
  createNew: publicProcedure
    .input(
      z.object({
        handleValue: z.string().regex(regex.handleValueRegex),
        domainValue: z.string().regex(regex.fileDidValue),
        domainName: z.string().regex(regex.getDomainNameRegex()),
        identifier: z.string(),
        password: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      // Prevent mutations in preview unless explicitly allowed
      if (env.VERCEL_ENV === "preview" && !env.ALLOW_PREVIEW_MUTATIONS) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Mutations are not allowed in preview deployments",
        });
      }
      
      // First delete any existing handle for this DID
      await prisma.handle.deleteMany({
        where: {
          did: input.domainValue,
        },
      });

      // Verify credentials and DID ownership
      const agent = new BskyAgent({
        service: 'https://bsky.social'
      });

      try {
        await agent.login({
          identifier: input.identifier,
          password: input.password
        });

        // Verify the DID matches - let's add some debug logging
        console.log({
          sessionDid: agent.session?.did,
          inputDid: input.domainValue,
          match: agent.session?.did === input.domainValue
        });

        if (!agent.session?.did || agent.session.did !== input.domainValue) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "The provided credentials do not match the DID"
          });
        }

        // Get or create domain
        const domain = await prisma.domain.upsert({
          where: { name: input.domainName },
          update: {},
          create: {
            name: input.domainName,
            type: 'file', // Default to file type
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        // Step 1: Check if the handle is already taken in the database
        try {
          const existingHandle = await prisma.handle.findFirst({
            where: {
              AND: [
                { handle: { equals: input.handleValue, mode: "insensitive" } },
                { domain: { name: { equals: input.domainName, mode: "insensitive" } } },
              ],
            },
          });

          if (existingHandle) {
            throw new Error("This handle is already taken!");
          }
        } catch (e) {
          console.error(e);
          throw new Error("Could not connect to the database");
        }

        // Step 2: Check if handle exists and verify ownership
        let handle = null;
        try {
          handle = await prisma.handle.findFirst({
            where: {
              AND: [
                { handle: { equals: input.handleValue, mode: "insensitive" } },
                { domain: { name: { equals: input.domainName, mode: "insensitive" } } },
              ],
            },
          });
        } catch (e) {
          console.error(e);
          throw Error("Could not connect to the database");
        }

        if (handle) {
          // check the handle owner if it was checked here more than 3 days ago
          if (handle.lastVerifiedAt.getTime() + 1000 * 60 * 60 * 24 * 3 < Date.now()) {
            const bskyUser = await getUserProfile(
              `${input.handleValue}.${input.domainName}`
            ) as {
              status: number;
              json: { message: string; did?: string };
            };

            if (
              bskyUser.status === 400 &&
              bskyUser.json.message === "Profile not found"
            ) {
              await prisma.handle.delete({
                where: {
                  id: handle.id,
                },
              });
            } else {
              await prisma.handle.update({
                where: {
                  id: handle.id,
                },
                data: {
                  lastVerifiedAt: new Date(),
                },
              });

              if (bskyUser.json?.did === input.domainValue) {
                throw Error("You already use this handle!");
              } else {
                throw Error("This handle is already taken!");
              }
            }
          } else {
            throw Error("This handle is already taken!");
          }
        }

        // Create new handle record
        await prisma.handle.create({
          data: {
            handle: input.handleValue,
            did: input.domainValue,
            domain: {
              connect: {
                id: domain.id
              }
            },
          },
        });

      } catch (error) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: error instanceof Error ? error.message : "Authentication failed"
        });
      }
    }),

  getHandleCount: publicProcedure
    .query(async () => {
      try {
        // Try with unpooled connection first
        const count = await prisma.$queryRaw<[{ count: bigint }]>`
          SELECT COUNT(*) as count 
          FROM "Handle"
        `;
        return { count: Number(count[0].count) };
      } catch (e) {
        console.error('Database connection error:', e);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database connection failed',
          cause: e,
        });
      }
    }),

  checkAvailability: publicProcedure
    .input(z.object({
      handleValue: z.string(),
      domainName: z.string()
    }))
    .query(async ({ input }) => {
      console.log(`Checking availability for ${input.handleValue}.${input.domainName}`);
      
      // First validate handle format
      if (!validateHandleFormat(input.handleValue)) {
        return { available: false, error: "Invalid handle format" };
      }

      try {
        // Check database with timeout
        const dbPromise = prisma.handle.findFirst({
          where: {
            AND: [
              { handle: input.handleValue },
              { domain: { name: input.domainName } },
            ],
          },
        });
        
        const dbRecord = await Promise.race([
          dbPromise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Database timeout')), 5000)
          )
        ]);

        if (dbRecord) {
          return { available: false, error: "Handle already registered" };
        }

        // Check if handle exists on Bluesky
        const bskyUser = await getUserProfile(
          `${input.handleValue}.${input.domainName}`
        ) as {
          status: number;
          json: { message: string; did?: string };
        };

        // If we get a 400 with "Profile not found", the handle is available
        if (bskyUser.status === 400 && bskyUser.json.message === "Profile not found") {
          return { available: true };
        }

        return { available: false, error: "Handle already exists on Bluesky" };

      } catch (e) {
        console.error('Error checking handle availability:', e);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to check handle availability',
          cause: e,
        });
      }
    }),

  checkExistingHandle: publicProcedure
    .input(z.object({
      domainValue: z.string(),
    }))
    .query(async ({ input }): Promise<{ exists: true; handle: string; domain: string; } | { exists: false }> => {
      const existingHandle = await prisma.handle.findFirst({
        where: {
          did: input.domainValue,
        },
        include: {
          domain: true,
        },
      });
      
      return existingHandle ? {
        exists: true,
        handle: existingHandle.handle ?? '',
        domain: existingHandle.domain.name ?? '',
      } : {
        exists: false,
      };
    }),

  test: publicProcedure
    .query(async () => {
      try {
        // Test database connection
        await prisma.$queryRaw`SELECT 1 as connection_test`;
        
        // Get database connection info
        const dbInfo = await prisma.$queryRaw`SELECT current_database(), current_user, version()`;
        
        return { 
          status: "ok", 
          message: "tRPC endpoint and database connection working",
          database_info: dbInfo
        };
      } catch (error) {
        console.error('Database test failed:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Database connection failed',
          cause: error
        });
      }
    }),
});
