import { PrismaClient } from '@prisma/client'

export const db = new PrismaClient({
  datasources: {
    db: { url: 'file:/home/z/my-project/db/custom.db' }
  }
})
