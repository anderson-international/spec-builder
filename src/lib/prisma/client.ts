import { PrismaClient } from '@prisma/client'

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices

// Prevent multiple instances of Prisma Client in development
declare global {
  var prisma: PrismaClient | undefined
}

// Initialize the prisma client
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: ['error', 'warn'],
  })
}

// Use a singleton pattern to avoid multiple client instances
const prisma = global.prisma ?? prismaClientSingleton()

// Set global reference in development
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}

export default prisma
