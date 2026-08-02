import * as crypto from "crypto";
import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import * as bcrypt from "bcrypt";
import { AppModule } from "../app/app.module";
import { PrismaService } from "../modules/prisma/prisma.service";

const logger = new Logger("ResetAdminPassword");

function generateSecurePassword(): string {
  const length = 16;
  const uppercaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercaseChars = "abcdefghijklmnopqrstuvwxyz";
  const numberChars = "0123456789";
  const specialChars = "!@#$%^&*()_+-=[]{}|;:,.<>?";

  // Ensure at least one of each type
  let password = "";
  password += uppercaseChars[crypto.randomInt(uppercaseChars.length)]; // One uppercase
  password += lowercaseChars[crypto.randomInt(lowercaseChars.length)]; // One lowercase
  password += numberChars[crypto.randomInt(numberChars.length)]; // One number
  password += specialChars[crypto.randomInt(specialChars.length)]; // One special

  // Fill the rest randomly
  const allChars = uppercaseChars + lowercaseChars + numberChars + specialChars;
  for (let i = password.length; i < length; i++) {
    password += allChars[crypto.randomInt(allChars.length)];
  }

  // Shuffle the password
  return password
    .split("")
    .sort(() => crypto.randomInt(3) - 1)
    .join("");
}

async function resetAdminPassword(): Promise<void> {
  try {
    // Create NestJS application
    const app = await NestFactory.createApplicationContext(AppModule);
    const prisma = app.get(PrismaService);

    // Find admin user
    const adminUser = await prisma.users.findFirst({
      where: { username: "admin" },
    });

    if (!adminUser) {
      logger.error("Admin user not found");
      await app.close();
      process.exit(1);
    }

    // Generate and hash new password
    const newPassword = generateSecurePassword();
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update admin password
    await prisma.users.update({
      where: { id: adminUser.id },
      data: { password: hashedPassword },
    });

    logger.warn("==================================================");
    logger.warn("IMPORTANT: Admin password has been reset");
    logger.warn("Please save these credentials");
    logger.warn("Username: admin");
    logger.warn(`Password: ${newPassword}`);
    logger.warn("==================================================");

    await app.close();
    process.exit(0);
  } catch (error) {
    logger.error("Error resetting admin password:", error);
    process.exit(1);
  }
}

void resetAdminPassword();
