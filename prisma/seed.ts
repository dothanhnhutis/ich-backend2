import prisma from "../src/utils/db";
import { hashData } from "../src/utils/helper";
import { faker } from "@faker-js/faker";
async function seed() {
  await prisma.linkProvider.deleteMany();
  await prisma.user.deleteMany();
  await prisma.user.deleteMany();

  const user = await prisma.user.createManyAndReturn({
    data: [
      {
        email: "gaconght002@gmail.com",
        emailVerified: true,
        password: hashData("@Abc123123"),
        username: "gaconght002",
      },
      {
        email: "gaconght003@gmail.com",
        emailVerified: true,
        password: hashData("@Abc123123"),
        username: "gaconght003",
      },
    ],
  });

  const tags = await prisma.tag.createManyAndReturn({
    data: Array.from({ length: 30 }, (_, index) => ({
      name: `Gia Cong ${index}`,
      slug: `gia-cong-${index}`,
    })),
  });

  await prisma.blog.createMany({
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
}

seed();
