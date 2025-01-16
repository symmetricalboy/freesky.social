import { type NextApiRequest, type NextApiResponse } from "next";
import { prisma } from "~/server/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Test basic connectivity
    const connectionTest = await prisma.$queryRaw`SELECT 1 as connection_test`;
    
    // Get database info
    const dbInfo = await prisma.$queryRaw`SELECT current_database(), current_user, version()`;
    
    // Test table access
    const tableTest = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'Handle'
      ) as table_exists
    `;

    return res.status(200).json({ 
      success: true,
      connectionTest,
      dbInfo,
      tableTest,
      env: {
        has_db_url: !!process.env.DATABASE_URL_UNPOOLED,
        has_prisma_url: !!process.env.POSTGRES_PRISMA_URL
      }
    });
  } catch (error) {
    console.error("Database test error:", error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error",
      env: {
        has_db_url: !!process.env.DATABASE_URL_UNPOOLED,
        has_prisma_url: !!process.env.POSTGRES_PRISMA_URL
      }
    });
  }
} 