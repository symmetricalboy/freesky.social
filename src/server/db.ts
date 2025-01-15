import { PrismaClient } from "@prisma/client";
import { env } from "~/env.mjs";

const getDatabaseUrl = () => {
  const url = new URL(env.DATABASE_URL);
  
  // Add environment suffix to database name for non-production environments
  if (env.VERCEL_ENV !== "production") {
    url.pathname = `${url.pathname}_${env.VERCEL_ENV ?? 'preview'}`;
  }
  
  return url.toString();
};

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: getDatabaseUrl(),
    },
  },
});
