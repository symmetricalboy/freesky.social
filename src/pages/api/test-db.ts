import { type NextApiRequest, type NextApiResponse } from "next";
import { prisma } from "~/server/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Try to query the database
    const count = await prisma.user.count();
    return res.status(200).json({ 
      success: true, 
      message: "Database connection successful",
      count 
    });
  } catch (error) {
    console.error("Database connection error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Database connection failed",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
} 