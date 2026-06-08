import { PrismaClient, Role } from "@prisma/client";
import { hashPassword } from "@/lib/password";

const prisma = new PrismaClient();

function requiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}

async function main() {
  const username = requiredEnv("SEED_ADMIN_USERNAME").toLowerCase();
  const email = requiredEnv("SEED_ADMIN_EMAIL").toLowerCase();
  const password = requiredEnv("SEED_ADMIN_PASSWORD");
  const mustChangePassword =
    process.env.SEED_ADMIN_MUST_CHANGE_PASSWORD === "true";
  const passwordHash = await hashPassword(password);

  const existingAdmin = await prisma.user.findFirst({
    where: {
      OR: [{ username }, { email }]
    }
  });

  if (existingAdmin) {
    const updated = await prisma.user.update({
      where: {
        id: existingAdmin.id
      },
      data: {
        username,
        email,
        passwordHash,
        role: Role.ADMIN,
        isActive: true,
        mustChangePassword
      }
    });

    console.log(`Updated admin user: ${updated.username}`);
    return;
  }

  const admin = await prisma.user.create({
    data: {
      username,
      email,
      passwordHash,
      role: Role.ADMIN,
      isActive: true,
      mustChangePassword
    }
  });

  console.log(`Created admin user: ${admin.username}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
