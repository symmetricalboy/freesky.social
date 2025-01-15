import { createNextApiHandler } from "@trpc/server/adapters/next";
import { env } from "~/env.mjs";
import { appRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";
import type { NextApiRequest, NextApiResponse } from "next";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  // Configure CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, x-trpc"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // Add an await expression
  await new Promise((resolve) => setTimeout(resolve, 0));
  return createNextApiHandler({
    router: appRouter,
    createContext: createTRPCContext,
    onError:
      env.NODE_ENV === "development"
        ? ({ path, error }) => {
            console.error(
              `❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`
            );
          }
        : undefined,
  })(req, res);
};

export default handler;
