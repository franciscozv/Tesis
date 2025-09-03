
import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

async function main() {
  // Clean up existing data in a specific order to avoid constraint violations
  await prisma.groupRoleAssignment.deleteMany({});
  await prisma.peopleOnGroups.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.people.deleteMany({});
  await prisma.peopleRole.deleteMany({});
  await prisma.group.deleteMany({});
  await prisma.eventType.deleteMany({});
  await prisma.place.deleteMany({});
  await prisma.responsibility.deleteMany({});

  // Create Users
  const users = [];
  for (let i = 0; i < 100; i++) {
    const user = await prisma.user.create({
      data: {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: faker.internet.password(),
      },
    });
    users.push(user);
  }

  // Create People
  const people = [];
  for (let i = 0; i < 100; i++) {
    const person = await prisma.people.create({
      data: {
        firstname: faker.person.firstName().replace(/[^a-zA-Z\s]/g, '').substring(0, 50) || 'DefaultFirstName',
        lastname: faker.person.lastName().replace(/[^a-zA-Z\s]/g, '').substring(0, 50) || 'DefaultLastName',
        address: faker.location.streetAddress(),
        phone: '9' + faker.string.numeric(8),
        baptismDate: faker.date.past(),
        convertionDate: faker.date.past(),
        birthdate: faker.date.birthdate(),
        gender: faker.helpers.arrayElement(["MASCULINO", "FEMENINO"]),
      },
    });
    people.push(person);
  }

  // Create PeopleRoles
  const peopleRoles = [];
  const roleNames = ["Líder de Grupo", "Miembro Activo", "Tesorero", "Secretario", "Líder de Alabanza", "Maestro de Jóvenes", "Diácono"];
  for (const name of roleNames) {
    const role = await prisma.peopleRole.create({
      data: {
        name,
        description: faker.lorem.sentence(),
      },
    });
    peopleRoles.push(role);
  }

  // Create Groups
  const groups = [];
  const groupNames = [
    "Jovenes en Accion",
    "Mujeres de Fe",
    "Hombres de Valor",
    "Alabanza y Adoracion",
    "Escuela Dominical",
    "Misiones Globales",
    "Ayuda Comunitaria",
    "Estudio Biblico",
    "Grupo de Oracion",
    "Matrimonios",
  ];

  for (const name of groupNames) {
    const group = await prisma.group.create({
      data: {
        name,
        description: faker.lorem.sentence({ min: 5, max: 10 }).substring(0, 50),
        mision: faker.lorem.paragraph(),
        vision: faker.lorem.paragraph(),
        color: faker.color.rgb(),
      },
    });
    groups.push(group);
  }

  // Create EventTypes
  const eventTypes = [];
  const eventTypeNames = [
    "Reunion General",
    "Ensayo de Coro",
    "Servicio Dominical",
    "Evento Especial de Jovenes",
    "Celula de Oracion",
  ];
  for (const name of eventTypeNames) {
    const eventType = await prisma.eventType.create({
      data: {
        name,
        description: faker.lorem.sentence({ min: 3, max: 7 }).replace(/[^a-zA-Z\s,]/g, ''),
        color: faker.color.rgb(),
      },
    });
    eventTypes.push(eventType);
  }

  // Create Places
  const places = [];
  for (let i = 0; i < 5; i++) {
    const place = await prisma.place.create({
      data: {
        name: `Salon ${faker.word.noun()} ${i}`,
        description: faker.lorem.sentence(),
        address: faker.location.streetAddress(),
        phones: faker.phone.number(),
        email: faker.internet.email(),
        photoUrl: faker.image.url(),
        rooms: faker.lorem.words(5),
      },
    });
    places.push(place);
  }

  // Create Responsibilities
  const responsibilities = [];
  const responsibilityNames = [
    "Direccion de Alabanza",
    "Ensenanza Biblica",
    "Logistica y Organizacion",
    "Intercesion y Oracion",
    "Bienvenida",
  ];
  for (const name of responsibilityNames) {
    const responsibility = await prisma.responsibility.create({
      data: {
        name,
        description: faker.lorem.sentence({ min: 10, max: 20 }).replace(/[^a-zA-Z\s,]/g, ''),
      },
    });
    responsibilities.push(responsibility);
  }

  // Create Events
  const events = [];
  for (let i = 0; i < 125; i++) {
    const startDateTime = faker.date.future();
    const endDateTime = new Date(startDateTime.getTime() + faker.number.int({ min: 1, max: 3 }) * 60 * 60 * 1000); // 1-3 hours later
    const state = faker.helpers.arrayElement(["PENDING", "APPROVED", "REJECTED"]);
    const reviewComment = state === "PENDING" ? null : faker.lorem.sentence();
    const event = await prisma.event.create({
      data: {
        title: faker.lorem.sentence(4),
        description: faker.lorem.paragraph(),
        startDateTime,
        endDateTime,
        state,
        reviewComment,
        eventTypeId: faker.helpers.arrayElement(eventTypes).id,
        placeId: faker.helpers.arrayElement(places).id,
      },
    });
    events.push(event);
  }

  // Create PeopleOnGroups
  for (const person of people) {
    const numberOfGroups = faker.number.int({ min: 1, max: 3 }); // Assign person to 1-3 groups
    const shuffledGroups = faker.helpers.shuffle(groups);
    for (let i = 0; i < numberOfGroups; i++) {
        if (shuffledGroups[i]) {
            const role = faker.helpers.arrayElement(peopleRoles);
            await prisma.peopleOnGroups.create({
                data: {
                    personId: person.id,
                    groupId: shuffledGroups[i].id,
                    personRoleId: role.id,
                    status: "ACTIVE",
                },
            });
        }
    }
  }

  // Create GroupRoleAssignments
  for (const group of groups) {
    const numberOfRoles = faker.number.int({ min: 2, max: 5 }); // Assign 2-5 roles per group
    const shuffledRoles = faker.helpers.shuffle(peopleRoles);
    for (let i = 0; i < numberOfRoles; i++) {
        if (shuffledRoles[i]) {
            await prisma.groupRoleAssignment.create({
                data: {
                    groupId: group.id,
                    roleId: shuffledRoles[i].id,
                },
            });
        }
    }
  }

  console.log("Database has been successfully seeded!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
