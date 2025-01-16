import { createNextApiHandler } from "@trpc/server/adapters/next";
import { appRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";
import type { NextApiRequest, NextApiResponse } from "next";

// Export config to prevent body parsing since tRPC handles that
export const config = {
  api: {
    bodyParser: false,
  },
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  // Log request details
  console.log('tRPC request:', {
    method: req.method,
    url: req.url,
    query: req.query,
    path: req.query.trpc,
  });

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-trpc-source"
    );
    res.status(200).end();
    return;
  }

  try {
    // Create and execute the tRPC handler
    const apiHandler = createNextApiHandler({
      router: appRouter,
      createContext: createTRPCContext,
      onError: ({ path, error }) => {
        console.error(`❌ tRPC failed on ${path ?? "<no-path>"}:`, {
          name: error.name,
          message: error.message,
          code: error.code,
          stack: error.stack,
        });
      },
    });

    // Execute the handler
    return await apiHandler(req, res);
  } catch (error) {
    console.error('Unhandled tRPC error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export default handler;
