import * as readline from 'readline';

import { PrismaClient } from '@prisma/client';
import { hash } from 'argon2';

import { generateSecurePassword } from './gen-password';

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      resolve(answer);
    });
  });
};

const seedAdmin = async (): Promise<void> => {
  console.log('=== Create Admin Account ===');

  // Get email input
  let email = process.env.ADMIN_EMAIL;
  if (!email) {
    email = await question('Enter admin email (default: admin@tokkatok.com): ');
    email = email || 'admin@tokkatok.com';
  }

  // Get name input
  let name = process.env.ADMIN_NAME;
  if (!name) {
    name = await question('Enter admin name (default: Admin): ');
    name = name || 'Admin';
  }

  // Ask if user wants a custom password or auto-generated
  let password: string;
  const useCustomPassword = await question('Use custom password? (y/n, default: n): ');

  if (useCustomPassword.toLowerCase() === 'y') {
    password = await question('Enter password: ');
    if (!password) {
      console.log('Empty password not allowed, generating a random one instead.');
      password = generateSecurePassword(15);
    }
  } else {
    password = generateSecurePassword(15);
  }

  const hashedPassword = await hash(password);

  try {
    // Check if admin with this email already exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { email },
    });

    if (existingAdmin) {
      console.log(`Admin with email ${email} already exists with ID: ${existingAdmin.id}`);
      rl.close();
      return;
    }

    // Create new admin
    const admin = await prisma.admin.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    console.log('\n=== Admin Created Successfully ===');
    console.log(`ID: ${admin.id}`);
    console.log(`Email: ${admin.email}`);
    console.log(`Name: ${admin.name}`);
    console.log(`Password: ${password}`);
    console.log('\nPlease save these credentials securely.');
  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
};

seedAdmin();
