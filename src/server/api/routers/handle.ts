import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "~/server/api/trpc";
import { prisma } from "~/server/db";
import regex from "~/utils/regex";
import { getUserProfile } from "~/utils/bsky";
import { TRPCError } from "@trpc/server";
import { env } from "~/env.mjs";

async function checkIfHandleIsAvailable(handleValue: string, domainName: string) {
  const handle = await prisma.handle.findFirst({
    where: {
      AND: [
        { handle: { equals: handleValue, mode: "insensitive" } },
        { subdomain: { equals: domainName, mode: "insensitive" } },
      ],
    },
  });
  return !handle;
}

export const handleRouter = createTRPCRouter({
  createNew: protectedProcedure
    .input(
      z.object({
        handleValue: z.string().regex(regex.handleValueRegex),
        domainValue: z.string().regex(regex.fileDidValue),
        domainName: z.string().regex(regex.getDomainNameRegex()),
      })
    )
    .mutation(async ({ input, ctx }) => {
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
          subdomainValue: input.domainValue,
        },
      });

      // Step 1: Check if the handle is already taken in the database
      try {
        const existingHandle = await prisma.handle.findFirst({
          where: {
            AND: [
              { handle: { equals: input.handleValue, mode: "insensitive" } },
              { subdomain: { equals: input.domainName, mode: "insensitive" } },
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
              { subdomain: { equals: input.domainName, mode: "insensitive" } },
            ],
          },
        });
      } catch (e) {
        console.error(e);
        throw Error("Could not connect to the database");
      }

      if (handle) {
        // check the handle owner if it was checked here more than 3 days ago
        if (handle.updatedAt.getTime() + 1000 * 60 * 60 * 24 * 3 < Date.now()) {
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
                updatedAt: new Date(),
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
          subdomain: input.domainName,
          subdomainValue: input.domainValue,
        },
      });
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
    .query(async ({ input, ctx }) => {
      console.log(`Checking availability for ${input.handleValue}@${input.domainName}`);
      
      // Check database
      const dbRecord = await prisma.handle.findFirst({
        where: {
          handle: input.handleValue,
          subdomain: input.domainName,
        },
      });
      console.log('Database record:', dbRecord);

      const isAvailable = await checkIfHandleIsAvailable(input.handleValue, input.domainName);
      return { available: isAvailable };
    }),

  checkExistingHandle: publicProcedure
    .input(z.object({
      domainValue: z.string(),
    }))
    .query(async ({ input }): Promise<{ exists: true; handle: string; domain: string; } | { exists: false }> => {
      const existingHandle = await prisma.handle.findFirst({
        where: {
          subdomainValue: input.domainValue,
        },
      });
      
      return existingHandle ? {
        exists: true,
        handle: existingHandle.handle ?? '',
        domain: existingHandle.subdomain ?? '',
      } : {
        exists: false,
      };
    }),
});
