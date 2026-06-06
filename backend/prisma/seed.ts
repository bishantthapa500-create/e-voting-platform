import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { PrismaClient, Role } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient();

const ADMIN_EMAIL_DEFAULT = 'admin@secure-evoting.local';
const ADMIN_PASSWORD_DEFAULT = 'admin12345';

async function main() {
  const adminEmail = (process.env.ADMIN_EMAIL || ADMIN_EMAIL_DEFAULT).trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || ADMIN_PASSWORD_DEFAULT;

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (existing) {
    if (existing.role !== Role.ADMIN) {
      await prisma.user.update({
        where: { email: adminEmail },
        data: { role: Role.ADMIN },
      });
      console.log(`Updated ${adminEmail} to ADMIN.`);
    } else {
      console.log(`Admin user already exists: ${adminEmail}`);
    }

    return;
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  await prisma.user.create({
    data: {
      email: adminEmail,
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });

  console.log(`Created admin user: ${adminEmail}`);

  if (!process.env.ADMIN_PASSWORD) {
    console.log('ADMIN_PASSWORD was not set; default password was used. Change it and re-seed or update via the DB.');
  }
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
