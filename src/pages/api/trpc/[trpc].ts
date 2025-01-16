import { createNextApiHandler } from "@trpc/server/adapters/next";
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

  // Log request details
  await Promise.resolve(console.log('tRPC request:', {
    method: req.method,
    url: req.url,
    query: req.query,
    headers: req.headers,
  }));

  try {
    const apiHandler = createNextApiHandler({
      router: appRouter,
      createContext: createTRPCContext,
      onError: ({ path, error }) => {
        console.error(`❌ tRPC failed on ${path ?? "<no-path>"}:`, {
          name: error.name,
          message: error.message,
          code: error.code,
          stack: error.stack,
          cause: error.cause,
        });
      },
    });
    
    return await apiHandler(req, res);
  } catch (error) {
    console.error('Unhandled tRPC error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export default handler;
