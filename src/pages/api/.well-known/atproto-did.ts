import { type NextApiRequest, type NextApiResponse } from "next";
import { prisma } from "../../../server/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Get the hostname from the request
    const hostname = req.headers.host;
    if (!hostname) {
      return res.status(400).json({ error: "No hostname provided" });
    }

    // Split the hostname to get handle and domain
    const [handle, ...domainParts] = hostname.split('.');
    const domain = domainParts.join('.');

    // Find the handle in the database
    const handleRecord = await prisma.handle.findFirst({
      where: {
        AND: [
          { handle: { equals: handle, mode: "insensitive" } },
          { subdomain: { equals: domain, mode: "insensitive" } },
        ],
      },
    });

    if (!handleRecord) {
      return res.status(404).json({ error: "Handle not found" });
    }

    // Return the DID in the correct format
    return res.status(200).json({ did: handleRecord.subdomainValue });
  } catch (error) {
    console.error("Error in atproto-did endpoint:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
} 