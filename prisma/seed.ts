import prisma from "../src/utils/db";
import { hashData } from "../src/utils/helper";

async function seed() {
  await prisma.linkProvider.deleteMany();
  await prisma.user.deleteMany();
  await prisma.user.create({
    data: {
      email: "gaconght001@gmail.com",
      emailVerified: true,
      emailVerificationToken: "",
      password: hashData("@Abc123123"),
      username: "gaconght001",
    },
  });
}

seed();
