import prisma from "@/utils/db";
import { Prisma } from "@prisma/client";

export const tagSelectDefault: Prisma.TagSelect = {
  id: true,
  name: true,
  slug: true,
  createdAt: true,
  updatedAt: true,
};

// Create
export async function createNewTag(
  data: { name: string; slug: string },
  select?: Prisma.TagSelect
) {
  return await prisma.tag.create({
    data,
    select: Prisma.validator<Prisma.TagSelect>()({
      ...tagSelectDefault,
      ...select,
    }),
  });
}

// Read
export async function getTagById(id: string, select?: Prisma.TagSelect) {
  return await prisma.tag.findUnique({
    where: { id },
    select: Prisma.validator<Prisma.TagSelect>()({
      ...tagSelectDefault,
      ...select,
    }),
  });
}

export async function getTagBySlug(slug: string, select?: Prisma.TagSelect) {
  return await prisma.tag.findUnique({
    where: { slug },
    select: Prisma.validator<Prisma.TagSelect>()({
      ...tagSelectDefault,
      ...select,
    }),
  });
}

type QueryTagWhereType = {
  name?: string[] | undefined;
  slug?: string[] | undefined;
};

type QueryTagOrderByType = {
  name?: "asc" | "desc";
  slug?: "asc" | "desc";
};

type QueryTagType = {
  where: QueryTagWhereType;
  limit?: number;
  page?: number;
  orderBy?: QueryTagOrderByType[];
  select?: Prisma.TagSelect;
};

export async function queryTag(data?: QueryTagType) {
  const take = data?.limit || 10;
  const page = (!data?.page || data.page <= 0 ? 1 : data.page) - 1;
  const skip = page * take;

  const where: Prisma.TagWhereInput = data?.where
    ? {
        name: {
          in: data.where.name,
        },
        slug: {
          in: data.where.slug,
          notIn: ["ADMIN"],
        },
      }
    : {};

  const [tags, total] = await prisma.$transaction([
    prisma.tag.findMany({
      where: where,
      select: Prisma.validator<Prisma.TagSelect>()({
        ...tagSelectDefault,
        ...data?.select,
      }),
      orderBy: data?.orderBy,
      take,
      skip,
    }),
    prisma.tag.count({ where: where }),
  ]);

  return {
    tags,
    metadata: {
      hasNextPage: skip + take < total,
      totalPage: Math.ceil(total / take),
      totalItem: total,
    },
  };
}

// Update
export async function updateTagById(
  id: string,
  data: { name?: string; slug?: string },
  select?: Prisma.TagSelect
) {
  return await prisma.tag.update({
    where: {
      id,
    },
    data,
  });
}

// Delete

export async function deleteTagById(id: string) {
  await prisma.tag.delete({
    where: {
      id,
    },
  });
}
