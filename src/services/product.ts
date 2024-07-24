import prisma from "@/utils/db";
import { uploadImageCloudinary } from "@/utils/image";
import { Prisma } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import { Media } from "./blog";

const productSelectDefault: Prisma.ProductSelect = {
  id: true,
  images: true,
  productName: true,
  slug: true,
  code: true,
  description: true,
  category: true,
  benefits: true,
  ingredients: true,
  createdBy: {
    select: {
      id: true,
      email: true,
      username: true,
      picture: true,
    },
  },
  contentJson: true,
  contentHTML: true,
  contentText: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

export async function getProductById(id: string) {
  return await prisma.product.findUnique({ where: { id } });
}

export async function getProductBySlug(slug: string) {
  return await prisma.product.findUnique({ where: { slug } });
}

export async function getProductByCode(code: string) {
  return await prisma.product.findUnique({ where: { code } });
}

type CreateProductDateType = {
  productName: string;
  slug: string;
  code?: string | undefined;
  images: Media[];
  video?: string | undefined;
  description: string;
  categoryId: string;
  benefits: string[];
  ingredients: string[];
  createdById: string;
  contentJson: string;
  contentHTML: string;
  contentText: string;
  isActive?: boolean;
};

export async function insertProduct(
  data: CreateProductDateType,
  select?: Prisma.ProductSelect
) {
  const { images, video, ...props } = data;
  const newImage: string[] = [];

  for (let img of images) {
    if (img.type == "base64") {
      const { asset_id, height, public_id, secure_url, tags, width } =
        await uploadImageCloudinary(img.data, {
          tags: ["prpduct", uuidv4()],
        });
      newImage.push(secure_url);
    } else {
      newImage.push(img.data);
    }
  }

  return await prisma.product.create({
    data: {
      ...props,
      images: newImage,
    },
    select: Prisma.validator<Prisma.ProductSelect>()({
      ...productSelectDefault,
      ...select,
    }),
  });
}

export async function editProductById(
  id: string,
  data: Partial<CreateProductDateType>,
  select?: Prisma.ProductSelect
) {
  const { images, video, ...props } = data;
  const newImage: string[] = [];

  if (images) {
    for (let img of images) {
      if (img.type == "base64") {
        const { asset_id, height, public_id, secure_url, tags, width } =
          await uploadImageCloudinary(img.data, {
            tags: ["prpduct", uuidv4()],
          });
        newImage.push(secure_url);
      } else {
        newImage.push(img.data);
      }
    }
  }

  return await prisma.product.update({
    where: { id },
    data: {
      ...props,
      images: newImage,
    },
    select: Prisma.validator<Prisma.ProductSelect>()({
      ...productSelectDefault,
      ...select,
    }),
  });
}

type QueryProductWhereType = {
  id?: string[] | undefined;
  productName?: string | undefined;
  code?: string[] | undefined;
  description?: string | undefined;
  categoryId?: string[] | undefined;
  benefits?: string[] | undefined;
  ingredients?: string[] | undefined;
  createdById?: string[] | undefined;
  content?: string | undefined;
  isActive?: boolean | undefined;
};

type QueryProductOrderByType = {
  productName?: "asc" | "desc";
  code?: "asc" | "desc";
  category_name?: "asc" | "desc";
  created_by_username?: "asc" | "desc";
  isActive?: "asc" | "desc";
  createdAt?: "asc" | "desc";
  updatedAt?: "asc" | "desc";
};

type QueryProductType = {
  where?: QueryProductWhereType;
  limit?: number;
  page?: number;
  order_by?: QueryProductOrderByType[];
  select?: Prisma.ProductSelect;
};
export async function queryProduct(
  data?: QueryProductType,
  select?: Prisma.ProductSelect
) {
  const take = data?.limit || 10;
  const page = (!data?.page || data.page <= 0 ? 1 : data.page) - 1;
  const skip = page * take;

  let args: Prisma.ProductFindManyArgs = {
    select: Prisma.validator<Prisma.ProductSelect>()({
      ...productSelectDefault,
    }),
    take,
    skip,
  };
  await prisma.product.findMany({
    where: {
      benefits: {
        hasSome: [""],
      },
    },
  });

  if (data?.select) {
    args.select = Prisma.validator<Prisma.ProductSelect>()({
      ...productSelectDefault,
      ...data.select,
    });
  }
  if (data?.order_by) {
    args.orderBy = data.order_by
      .filter(
        (d) =>
          Object.keys(d).length == 1 &&
          [
            "productName",
            "code",
            "category_name",
            "created_by_username",
            "isActive",
            "createdAt",
            "updatedAt",
          ].includes(Object.keys(d)[0])
      )
      .map((d) =>
        d.category_name
          ? { category: { name: d.category_name } }
          : d.created_by_username
          ? { createdBy: { username: d.created_by_username } }
          : d
      ) as Prisma.ProductOrderByWithRelationInput[];
  }

  const [products, total] = await prisma.$transaction([
    prisma.product.findMany(args),
    prisma.product.count({ where: args.where }),
  ]);
  return {
    products,
    metadata: {
      hasNextPage: skip + take < total,
      totalPage: Math.ceil(total / take),
      totalItem: total,
    },
  };
}
