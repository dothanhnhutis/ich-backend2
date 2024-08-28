import prisma from "../src/utils/db";
import { hashData } from "../src/utils/helper";
import { faker } from "@faker-js/faker";

async function seed() {
  await prisma.oauthProvider.deleteMany();
  await prisma.post.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  const user = await prisma.user.createManyAndReturn({
    data: [
      {
        email: "gaconght001@gmail.com",
        emailVerified: true,
        password: hashData("@Abc123123"),
        firstName: "gaconght001",
        lastName: "",
        hasPassword: true,
      },
      {
        email: "gaconght002@gmail.com",
        emailVerified: true,
        password: hashData("@Abc123123"),
        firstName: "gaconght002",
        lastName: "",
        hasPassword: true,
      },
      {
        email: "gaconght003@gmail.com",
        emailVerified: true,
        password: hashData("@Abc123123"),
        firstName: "gaconght003",
        lastName: "",
        hasPassword: true,
      },
      {
        email: "gaconght004@gmail.com",
        emailVerified: true,
        password: hashData("@Abc123123"),
        firstName: "gaconght004",
        lastName: "",
        hasPassword: true,
      },
      {
        email: "gaconght005@gmail.com",
        emailVerified: true,
        password: hashData("@Abc123123"),
        firstName: "gaconght005",
        lastName: "",
        hasPassword: true,
      },
      {
        email: "gaconght006@gmail.com",
        emailVerified: true,
        password: hashData("@Abc123123"),
        firstName: "gaconght006",
        lastName: "",
        hasPassword: true,
      },
    ],
  });

  const tags = await prisma.tag.createManyAndReturn({
    data: Array.from({ length: 30 }, (_, index) => ({
      name: `Gia Cong ${index}`,
      slug: `gia-cong-${index}`,
    })),
  });

  await prisma.post.createMany({
    data: Array.from({ length: 30 }, (_, index) => ({
      contentText: "",
      contentHTML: "<p></p>",
      contentJson: "",
      image: "",
      title: `Nha May Gia Cong So 1 Mien Tay ${index}`,
      authorId: user[0].id,
      tagId: tags[0].id,
      publishAt: faker.date.past(),
      slug: `Nha-May-Gia-Cong-So-1-Mien-Tay-${index}`,
    })),
  });

  const categories = await prisma.category.createManyAndReturn({
    data: Array.from({ length: 10 }, (_, index) => ({
      name: `Lam dep ${index}`,
      slug: `lam-dep-${index}`,
    })),
  });

  await prisma.product.createMany({
    data: Array.from({ length: 15 }, (_, index) => ({
      categoryId: categories[0].id,
      description: "asdasd",
      productName: "Kem rau ma",
      createdById: user[0].id,
      contentText: "",
      contentHTML: "<p></p>",
      contentJson: "",
      slug: `Kem-rau-ma-${index}`,
    })),
  });
}

seed();
