import { PrismaClient, UserRole, Language, IncidentType, IncidentStatus, VerificationStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding GuzoMate development database...');

  // 1. Seed deterministic development users
  const travelerUser = await prisma.user.upsert({
    where: { email: 'traveler@example.com' },
    update: {},
    create: {
      email: 'traveler@example.com',
      passwordHash: '$2b$10$deterministicDevPasswordHashExampleForTestingOnly',
      preferredLanguage: Language.EN,
      role: UserRole.USER,
    },
  });

  const moderatorUser = await prisma.user.upsert({
    where: { email: 'moderator@example.com' },
    update: {},
    create: {
      email: 'moderator@example.com',
      passwordHash: '$2b$10$deterministicDevPasswordHashExampleForTestingOnly',
      preferredLanguage: Language.EN,
      role: UserRole.MODERATOR,
    },
  });

  console.log(`Users seeded: ${travelerUser.email}, ${moderatorUser.email}`);

  // 2. Seed sample Addis Ababa places (OSM-style)
  const place1 = await prisma.place.upsert({
    where: {
      osmType_osmId: {
        osmType: 'node',
        osmId: '1000000001',
      },
    },
    update: {},
    create: {
      osmType: 'node',
      osmId: '1000000001',
      name: 'Black Lion Specialized Hospital (Tikur Anbessa)',
      category: 'hospital',
      address: 'Zambia St, Addis Ababa, Ethiopia',
      latitude: 9.0195,
      longitude: 38.7495,
      tags: {
        amenity: 'hospital',
        healthcare: 'hospital',
        emergency: 'yes',
        'name:am': 'ጥቁር አንበሳ ሆስፒታል',
      },
    },
  });

  const place2 = await prisma.place.upsert({
    where: {
      osmType_osmId: {
        osmType: 'node',
        osmId: '1000000002',
      },
    },
    update: {},
    create: {
      osmType: 'node',
      osmId: '1000000002',
      name: 'Tomoca Coffee (Piazza)',
      category: 'cafe',
      address: 'Wavel St, Piazza, Addis Ababa',
      latitude: 9.0347,
      longitude: 38.7519,
      tags: {
        amenity: 'cafe',
        cuisine: 'coffee_shop',
        'name:am': 'ቶሞካ ቡና',
      },
    },
  });

  const place3 = await prisma.place.upsert({
    where: {
      osmType_osmId: {
        osmType: 'node',
        osmId: '1000000003',
      },
    },
    update: {},
    create: {
      osmType: 'node',
      osmId: '1000000003',
      name: 'Skylight Hotel',
      category: 'hotel',
      address: 'Bole Airport Area, Addis Ababa',
      latitude: 8.9897,
      longitude: 38.7891,
      tags: {
        tourism: 'hotel',
        stars: '5',
      },
    },
  });

  console.log(`Places seeded: ${place1.name}, ${place2.name}, ${place3.name}`);

  // 3. Seed sample Road Incident
  const incident = await prisma.incident.create({
    data: {
      reporterId: travelerUser.id,
      type: IncidentType.CONSTRUCTION,
      description: 'Road work and temporary lane closure near Mexico Square.',
      latitude: 9.0108,
      longitude: 38.7441,
      status: IncidentStatus.ACTIVE,
      verification: VerificationStatus.COMMUNITY_CONFIRMED,
      occurredAt: new Date(),
    },
  });

  console.log(`Sample incident seeded: [${incident.type}] ${incident.description}`);

  // 4. Seed sample RAG document
  const ragDoc = await prisma.ragDocument.create({
    data: {
      sourceType: 'guide',
      sourceId: 'addis-transit-overview',
      language: 'en',
      title: 'Getting Around Addis Ababa',
      content:
        'Addis Ababa public transport includes the Light Rail Transit (LRT) operating east-west and north-south lines, public Anbessa buses, Sheger buses, and minibus taxis.',
      metadata: {
        topic: 'transportation',
        city: 'Addis Ababa',
      },
    },
  });

  console.log(`Sample RAG document seeded: ${ragDoc.title}`);
  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
