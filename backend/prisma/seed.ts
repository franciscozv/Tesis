import { PrismaClient, Prisma } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

const TOTAL_USERS = 10;
const TOTAL_PEOPLE = 50;
const TOTAL_GROUPS = 15;
const TOTAL_EVENT_TYPES = 12;
const TOTAL_RESPONSIBILITIES = 20;
const TOTAL_EVENTS = 40;

async function main() {
  console.log(`🧹 Limpiando la base de datos...`);
  // El orden es importante para evitar errores de restricción de clave externa
  await prisma.event.deleteMany({});
  await prisma.eventType.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.people.deleteMany({});
  await prisma.group.deleteMany({});
  await prisma.responsibility.deleteMany({});

  console.log(`🌱 Iniciando la siembra...`);

  // --- Creación de Usuarios ---
  console.log(`Creando ${TOTAL_USERS} usuarios...`);
  const users: Prisma.UserCreateInput[] = [];
  for (let i = 0; i < TOTAL_USERS; i++) {
    users.push({
      name: faker.person.fullName(),
      email: faker.internet.email({ provider: 'test.local' }), // Usar un dominio falso
      password: faker.internet.password(), // En un proyecto real, esto debería ser hasheado
    });
  }
  await prisma.user.createMany({ data: users });

  // --- Creación de Personas ---
  console.log(`Creando ${TOTAL_PEOPLE} personas...`);
  const people: Prisma.PeopleCreateInput[] = [];
  for (let i = 0; i < TOTAL_PEOPLE; i++) {
    people.push({
      firstname: faker.person.firstName(),
      lastname: faker.person.lastName(),
      address: faker.location.streetAddress(),
      phone: faker.phone.number(),
      baptismDate: faker.date.past({ years: 10 }),
      convertionDate: faker.date.past({ years: 15 }),
      birthdate: faker.date.birthdate({ min: 18, max: 70, mode: 'age' }),
      gender: faker.person.gender(),
    });
  }
  await prisma.people.createMany({ data: people });

  // --- Creación de Grupos ---
  console.log(`Creando ${TOTAL_GROUPS} grupos...`);
  const groups: Prisma.GroupCreateInput[] = [];
  for (let i = 0; i < TOTAL_GROUPS; i++) {
    groups.push({
      name: `${faker.word.adjective()} ${faker.word.noun()}`,
      description: faker.lorem.sentence(),
    });
  }
  await prisma.group.createMany({ data: groups });

  // --- Creación de Tipos de Evento ---
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

  // --- Creación de Responsabilidades ---
  console.log(`Creando ${TOTAL_RESPONSIBILITIES} responsabilidades...`);
  const responsibilities: Prisma.ResponsibilityCreateInput[] = [];
  for (let i = 0; i < TOTAL_RESPONSIBILITIES; i++) {
    responsibilities.push({
      name: faker.person.jobTitle(),
      description: faker.lorem.words(4),
    });
  }
  await prisma.responsibility.createMany({ data: responsibilities });

  // --- Creación de Eventos (depende de Tipos de Evento) ---
  console.log(`Creando ${TOTAL_EVENTS} eventos...`);
  const createdEventTypes = await prisma.eventType.findMany(); // Obtener los IDs recién creados
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
  // Usamos un bucle para crear eventos uno por uno debido a la relación
  for (const event of events) {
    await prisma.event.create({ data: event });
  }

  console.log(`✅ Siembra completada.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
