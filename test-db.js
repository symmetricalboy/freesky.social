const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  try {
    const result = await prisma.$queryRaw`SELECT 1+1 AS result`
    console.log('Database connection successful:', result)
  } catch (e) {
    console.error('Database connection failed:', e)
  } finally {
    await prisma.$disconnect()
  }
}

main() 