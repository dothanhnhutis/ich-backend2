import prisma from "@/utils/db";
import { Prisma } from "@prisma/client";

const categorySelectDefault: Prisma.CategorySelect = {
  id: true,
  name: true,
  slug: true,
  createdAt: true,
  updatedAt: true,
};

export async function getCategoryById(
  id: string,
  select?: Prisma.CategorySelect
) {
  return await prisma.category.findUnique({
    where: { id },
    select: Prisma.validator<Prisma.CategorySelect>()({
      ...categorySelectDefault,
      ...select,
    }),
  });
}

export async function getAllCategory(select?: Prisma.CategorySelect) {
  return await prisma.category.findMany({
    select: Prisma.validator<Prisma.CategorySelect>()({
      ...categorySelectDefault,
      ...select,
    }),
  });
}

type QueryCategoryWhereType = {
  name?: string[] | undefined;
  slug?: string[] | undefined;
};

type QueryCategoryOrderByType = {
  name?: "asc" | "desc";
  slug?: "asc" | "desc";
};

type QueryCategoryType = {
  where: QueryCategoryWhereType;
  limit?: number;
  page?: number;
  orderBy?: QueryCategoryOrderByType[];
  select?: Prisma.CategorySelect;
};

export async function queryCategories(data?: QueryCategoryType) {
  const take = data?.limit || 10;
  const page = (!data?.page || data.page <= 0 ? 1 : data.page) - 1;
  const skip = page * take;

  let args: Prisma.CategoryFindManyArgs = {
    where: {},
    select: Prisma.validator<Prisma.CategorySelect>()({
      ...categorySelectDefault,
    }),
    take,
    skip,
  };
  if (data?.where) {
    args.where = {
      name: { in: data.where.name },
      slug: {
        in: data.where.slug,
      },
    };
  }
  if (data?.select) {
    args.select = Prisma.validator<Prisma.CategorySelect>()({
      ...categorySelectDefault,
      ...data.select,
    });
  }
  if (data?.orderBy) {
    args.orderBy = data.orderBy;
  }

  const [categories, total] = await prisma.$transaction([
    prisma.category.findMany(args),
    prisma.category.count({ where: args.where }),
  ]);
  return {
    categories,
    metadata: {
      hasNextPage: skip + take < total,
      totalPage: Math.ceil(total / take),
      totalItem: total,
    },
  };
}

export async function getCategoryBySlug(
  slug: string,
  select?: Prisma.CategorySelect
) {
  return await prisma.category.findUnique({
    where: { slug },
    select: Prisma.validator<Prisma.CategorySelect>()({
      ...categorySelectDefault,
      ...select,
    }),
  });
}

export async function createCategory(
  data: { name: string; slug: string },
  select?: Prisma.CategorySelect
) {
  return await prisma.category.create({
    data,
    select: Prisma.validator<Prisma.CategorySelect>()({
      ...categorySelectDefault,
      ...select,
    }),
  });
}

export async function updateCategoryById(
  id: string,
  data: { name?: string; slug?: string },
  select?: Prisma.CategorySelect
) {
  return await prisma.category.update({
    where: { id },
    data,
    select: Prisma.validator<Prisma.CategorySelect>()({
      ...categorySelectDefault,
      ...select,
    }),
  });
}

export async function deleteCategoryById(
  id: string,
  select?: Prisma.CategorySelect
) {
  return await prisma.category.delete({
    where: { id },
    select: Prisma.validator<Prisma.CategorySelect>()({
      ...categorySelectDefault,
      ...select,
    }),
  });
}