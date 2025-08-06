import { PrismaClient, Prisma } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

const TOTAL_USERS = 10;
const TOTAL_PEOPLE = 50;
const TOTAL_EVENT_TYPES = 12;
const TOTAL_RESPONSIBILITIES = 20;
const TOTAL_EVENTS = 40;
const TOTAL_GROUPS = 5; // New requirement

async function main() {
  console.log(`🧹 Limpiando la base de datos...`);
  // The order is important to avoid foreign key constraint errors
  await prisma.peopleOnGroups.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.eventType.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.people.deleteMany({});
  await prisma.group.deleteMany({});
  await prisma.responsibility.deleteMany({});

  console.log(`🌱 Iniciando la siembra...`);

  // --- User Creation ---
  console.log(`Creando ${TOTAL_USERS} usuarios...`);
  const users: Prisma.UserCreateInput[] = [];
  for (let i = 0; i < TOTAL_USERS; i++) {
    users.push({
      name: faker.person.fullName(),
      email: faker.internet.email({ provider: 'test.local' }),
      password: faker.internet.password(),
    });
  }
  await prisma.user.createMany({ data: users });

  // --- People Creation ---
  console.log(`Creando ${TOTAL_PEOPLE} personas...`);
  const peopleData: Prisma.PeopleCreateInput[] = [];
  for (let i = 0; i < TOTAL_PEOPLE; i++) {
    peopleData.push({
      firstname: faker.person.firstName(),
      lastname: faker.person.lastName(),
      address: faker.location.streetAddress(),
      phone: '9' + faker.string.numeric(8),
      baptismDate: faker.date.past({ years: 10 }),
      convertionDate: faker.date.past({ years: 15 }),
      birthdate: faker.date.birthdate({ min: 18, max: 70, mode: 'age' }),
      gender: faker.helpers.arrayElement(['MASCULINO', 'FEMENINO']),
    });
  }
  await prisma.people.createMany({ data: peopleData });
  const allPeople = await prisma.people.findMany();

  // --- Group Creation (New Logic) ---
  console.log(`Creando ${TOTAL_GROUPS} grupos con todos los campos...`);
  const createdGroups = [];
  for (let i = 0; i < TOTAL_GROUPS; i++) {
    const group = await prisma.group.create({
      data: {
        name: `${faker.commerce.productAdjective()} ${faker.animal.type()} Team ${i + 1}`,
        description: faker.lorem.sentence(),
        mision: faker.company.catchPhrase(),
        vision: faker.company.catchPhrase(),
        color: faker.color.rgb(),
      },
    });
    createdGroups.push(group);
  }
  console.log(`${createdGroups.length} grupos creados.`);

  // --- Assigning People to Groups (New Logic) ---
  console.log('Asignando miembros a los grupos...');
  for (const group of createdGroups) {
    // Assign a random number of members to each group (e.g., 2 to 10)
    const membersToAssignCount = faker.number.int({ min: 2, max: 10 });
    const shuffledPeople = faker.helpers.shuffle(allPeople);
    const membersToAssign = shuffledPeople.slice(0, membersToAssignCount);

    for (const person of membersToAssign) {
      await prisma.peopleOnGroups.create({
        data: {
          groupId: group.id,
          personId: person.id,
        },
      });
    }
    console.log(`Asignados ${membersToAssignCount} miembros al grupo "${group.name}".`);
  }

  // --- EventType Creation ---
  console.log(`Creando ${TOTAL_EVENT_TYPES} tipos de evento...`);
  const eventTypes: Prisma.EventTypeCreateInput[] = [];
  for (let i = 0; i < TOTAL_EVENT_TYPES; i++) {
    eventTypes.push({
      name: faker.company.catchPhrase(),
      description: faker.lorem.words(5),
      color: faker.color.rgb(),
    });
  }
  await prisma.eventType.createMany({ data: eventTypes });

  // --- Responsibility Creation ---
  console.log(`Creando ${TOTAL_RESPONSIBILITIES} responsabilidades...`);
  const responsibilities: Prisma.ResponsibilityCreateInput[] = [];
  for (let i = 0; i < TOTAL_RESPONSIBILITIES; i++) {
    responsibilities.push({
      name: faker.person.jobTitle(),
      description: faker.lorem.words(4),
    });
  }
  await prisma.responsibility.createMany({ data: responsibilities });

  // --- Event Creation ---
  console.log(`Creando ${TOTAL_EVENTS} eventos...`);
  const createdEventTypes = await prisma.eventType.findMany();
  const events: Prisma.EventCreateInput[] = [];
  for (let i = 0; i < TOTAL_EVENTS; i++) {
    const randomEventType = faker.helpers.arrayElement(createdEventTypes);
    events.push({
      title: faker.company.buzzPhrase(),
      description: faker.lorem.paragraph(),
      startDateTime: faker.date.soon({ days: 30 }),
      endDateTime: faker.date.soon({ days: 30, refDate: new Date() }),
      location: faker.location.city(),
      state: faker.helpers.arrayElement(['PENDING', 'APPROVED', 'REJECTED']),
      reviewComment: faker.datatype.boolean() ? faker.lorem.sentence() : null,
      eventType: {
        connect: { id: randomEventType.id },
      },
    });
  }
  for (const event of events) {
    await prisma.event.create({ data: event });
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });