import prisma from "@/utils/db";
import { uploadImageCloudinary } from "@/utils/image";
import { Prisma } from "@prisma/client";
import { nanoid } from "nanoid";

const productSelectDefault: Prisma.ProductSelect = {};

export async function getProductById(id: string) {
  return await prisma.product.findUnique({ where: { id } });
}

export async function getProductBySlug(slug: string) {
  return await prisma.product.findUnique({ where: { slug } });
}

export async function getProductByCode(code: string) {
  return await prisma.product.findUnique({ where: { code } });
}

type Media = {
  type: "base64" | "url";
  data: string;
};

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

export async function createNewProduct(
  data: CreateProductDateType,
  select?: Prisma.ProductSelect
) {
  const { images, video, ...props } = data;
  const newImage: string[] = [];

  for (let img of images) {
    if (img.type == "base64") {
      const { asset_id, height, public_id, secure_url, tags, width } =
        await uploadImageCloudinary(img.data, {
          tags: ["prpduct", nanoid()],
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

export async function updateProductById(
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
            tags: ["prpduct", nanoid()],
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

export async function queryProduct(data?: any, select?: Prisma.ProductSelect) {
  const take = data?.limit || 10;
  const page = (!data?.page || data.page <= 0 ? 1 : data.page) - 1;
  const skip = page * take;

  let args: Prisma.BlogFindManyArgs = {
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

  const [blogs, total] = await prisma.$transaction([
    prisma.blog.findMany(args),
    prisma.blog.count({ where: args.where }),
  ]);
  return {
    blogs,
    metadata: {
      hasNextPage: skip + take < total,
      totalPage: Math.ceil(total / take),
      totalItem: total,
    },
  };
}
