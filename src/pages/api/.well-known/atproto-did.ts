import { type NextApiRequest, type NextApiResponse } from "next";
import { prisma } from "../../../server/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { handle, domain } = req.query;

    if (!handle || !domain || typeof handle !== 'string' || typeof domain !== 'string') {
      return res.status(400).json({ error: "Invalid request parameters" });
    }

    // Find the handle in the database
    const handleRecord = await prisma.handle.findFirst({
      where: {
        AND: [
          { handle: { equals: handle, mode: "insensitive" } },
          { domain: { name: { equals: domain, mode: "insensitive" } } },
        ],
      },
    });

    if (!handleRecord) {
      return res.status(404).json({ error: "Handle not found" });
    }

    // Return the DID in the correct format
    return res.status(200).json({ did: handleRecord.did });
  } catch (error) {
    console.error("Error in atproto-did endpoint:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
} 