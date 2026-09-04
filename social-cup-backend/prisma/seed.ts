import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { DALLAS_CAFES } from '../src/data/dallasCafes.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding cafes and drinks...');
  for (const cafe of DALLAS_CAFES) {
    await prisma.cafe.upsert({
      where: { id: cafe.id },
      create: {
        id: cafe.id,
        name: cafe.name,
        neighborhood: cafe.neighborhood,
        address: cafe.address,
        hours: cafe.hours,
        isOpen: cafe.open,
        priceTier: cafe.price,
        payoutRate: cafe.payoutRate,
        pinCode: cafe.pinCode,
        isFeatured: cafe.isFeatured,
        vibeTags: cafe.tags,
        image: cafe.image ?? null,
        gallery: cafe.gallery ?? [],
        drinks: {
          create: cafe.drinks.map((d) => ({
            id: d.id,
            name: d.name,
            description: d.desc,
            creditsCost: d.credits,
            retailPrice: d.retail,
            isSignature: d.signature,
            category: d.type,
            image: d.image ?? null,
          })),
        },
      },
      update: {},
    });
  }

  console.log('Seeding admin and demo accounts...');
  const adminPasswordHash = await bcrypt.hash('SocialCupAdmin123!', 10);
  await prisma.user.upsert({
    where: { email: 'admin@socialcup.app' },
    create: {
      email: 'admin@socialcup.app',
      passwordHash: adminPasswordHash,
      name: 'Admin HQ',
      role: 'ADMIN',
      accountStatus: 'MEMBER',
      credits: 0,
    },
    update: {},
  });

  const demoPasswordHash = await bcrypt.hash('SocialCupDemo123!', 10);
  await prisma.user.upsert({
    where: { email: 'jordan@socialcup.app' },
    create: {
      email: 'jordan@socialcup.app',
      passwordHash: demoPasswordHash,
      name: 'Jordan Avery',
      role: 'CUSTOMER',
      accountStatus: 'MEMBER',
      credits: 22,
      neighborhood: 'Bishop Arts',
      preferences: ['Specialty brew', 'Cold brew'],
    },
    update: {},
  });

  console.log('Done.');
  console.log('  Admin login:  admin@socialcup.app / SocialCupAdmin123!');
  console.log('  Demo member:  jordan@socialcup.app / SocialCupDemo123!');
  console.log('  Every seeded cafe PIN: 4821');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
