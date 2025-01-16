import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const databaseUrl = process.env.POSTGRES_PRISMA_URL;
console.log("Database URL being used:", databaseUrl?.split("@")[1]); // Logs the URL safely without credentials

export const serverSchema = z.object({
  POSTGRES_PRISMA_URL: z.string(),
  NODE_ENV: z.enum(["development", "test", "production"]),
  VERCEL_ENV: z.string().optional(),
  NEXTAUTH_SECRET: z.string(),
  NEXTAUTH_URL: z.string(),
  DOMAINS_CLOUDFLARE: z.string(),
  CLOUDFLARE_SECRET: z.string(),
  ALLOW_PREVIEW_MUTATIONS: z.boolean().optional().default(false),
  IGNORE_HANDLE_IS_TAKEN: z.string().optional(),
});

export const clientSchema = z.object({
  // NEXT_PUBLIC_ prefix
});

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    POSTGRES_PRISMA_URL: z.string().url(),
    NODE_ENV: z.enum(["development", "production", "test"]),
    VERCEL_ENV: z.enum(["production", "preview", "development"]).optional(),
    NEXTAUTH_SECRET:
      process.env.NODE_ENV === "production"
        ? z.string().min(1)
        : z.string().min(1).optional(),
    NEXTAUTH_URL: z.preprocess(
      (str) => process.env.VERCEL_URL ?? str,
      process.env.VERCEL ? z.string().min(1) : z.string().url()
    ),
    DOMAINS_CLOUDFLARE: z.string(),
    CLOUDFLARE_SECRET: z.string(),
    ALLOW_PREVIEW_MUTATIONS: z.boolean().optional().default(false),
    IGNORE_HANDLE_IS_TAKEN: z.string().optional(),
    TEST_MODE: z.string().optional(),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_TEST_MODE: z.string().optional(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL,
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    DOMAINS_CLOUDFLARE: process.env.DOMAINS_CLOUDFLARE,
    CLOUDFLARE_SECRET: process.env.CLOUDFLARE_SECRET,
    ALLOW_PREVIEW_MUTATIONS: process.env.ALLOW_PREVIEW_MUTATIONS === "true",
    IGNORE_HANDLE_IS_TAKEN: process.env.IGNORE_HANDLE_IS_TAKEN,
    TEST_MODE: process.env.TEST_MODE,
    NEXT_PUBLIC_TEST_MODE: process.env.NEXT_PUBLIC_TEST_MODE,
  },
  /**
   * Run `build` or `dev` command to see all environment variables.
   */
});