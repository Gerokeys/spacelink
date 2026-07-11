import { PrismaClient } from "@prisma/client"
import { AMENITIES_SEED } from "../src/lib/amenities"

const db = new PrismaClient()

async function main() {
  console.log("Seeding amenities...")

  for (const amenity of AMENITIES_SEED) {
    await db.amenity.upsert({
      where: { name: amenity.name },
      create: amenity,
      update: amenity,
    })
  }

  console.log(`✓ Seeded ${AMENITIES_SEED.length} amenities`)

  // Create a test admin user
  const admin = await db.user.upsert({
    where: { email: "admin@locale.co.ke" },
    create: {
      email: "admin@locale.co.ke",
      name: "Locale Admin",
      role: "ADMIN",
      emailVerified: new Date(),
    },
    update: {},
  })
  console.log(`✓ Admin user: ${admin.email}`)
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
