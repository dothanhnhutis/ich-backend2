import prisma from "@/utils/db";
import { uploadImageCloudinary } from "@/utils/image";
import { Prisma } from "@prisma/client";

export const blogSelectDefault: Prisma.BlogSelect = {
  id: true,
  title: true,
  slug: true,
  contentHTML: true,
  contentJson: true,
  contentText: true,
  publishAt: true,
  isActive: true,
  tag: true,
  author: {
    select: {
      id: true,
      username: true,
      picture: true,
    },
  },
  createdAt: true,
  updatedAt: true,
};

type createNewBlogType = {
  title: string;
  image:
    | {
        type: "url";
        data: string;
      }
    | {
        type: "base64";
        data: string;
      };
  slug: string;
  contentJson: string;
  contentText: string;
  contentHTML: string;
  tagId: string;
  authorId: string;
  isActive: boolean;
  publishAt: Date;
};

// Create
export async function createNewBlog(
  data: createNewBlogType,
  select?: Prisma.BlogSelect
) {
  const { image, ...props } = data;
  let url;
  if (image.type == "base64") {
    const { secure_url } = await uploadImageCloudinary(image.data);
    url = secure_url;
  } else {
    url = image.data;
  }
  return await prisma.blog.create({
    data: {
      ...props,
      image: url,
    },
    select: Prisma.validator<Prisma.BlogSelect>()({
      ...blogSelectDefault,
      ...select,
    }),
  });
}

// Read
export async function getBlogById(id: string, select?: Prisma.BlogSelect) {
  return await prisma.blog.findUnique({
    where: { id },
    select: Prisma.validator<Prisma.BlogSelect>()({
      ...blogSelectDefault,
      ...select,
    }),
  });
}

export async function getBlogBySlug(slug: string, select?: Prisma.BlogSelect) {
  return await prisma.blog.findUnique({
    where: { slug },
    select: Prisma.validator<Prisma.BlogSelect>()({
      ...blogSelectDefault,
      ...select,
    }),
  });
}

type QueryBlogWhereType = {
  title?: string[] | undefined;
  slug?: string[] | undefined;
};

type QueryBlogOrderByType = {
  title?: "asc" | "desc";
  slug?: "asc" | "desc";
};

type QueryBlogType = {
  where: QueryBlogWhereType;
  limit?: number;
  page?: number;
  orderBy?: QueryBlogOrderByType[];
  select?: Prisma.BlogSelect;
};

export async function queryBlog(data?: QueryBlogType) {
  const take = data?.limit || 10;
  const page = (!data?.page || data.page <= 0 ? 1 : data.page) - 1;
  const skip = page * take;

  const blogs = await prisma.blog.findMany({
    where: {
      tag: {
        slug: {},
      },
    },
    orderBy: [
      {
        tag: {
          slug: "asc",
        },
      },
    ],
  });

  return blogs;

  // const where: Prisma.TagWhereInput = data?.where
  //   ? {
  //       name: {
  //         in: data.where.name,
  //       },
  //       slug: {
  //         in: data.where.slug,
  //         notIn: ["ADMIN"],
  //       },
  //     }
  //   : {};
  // const [tags, total] = await prisma.$transaction([
  //   prisma.tag.findMany({
  //     where: where,
  //     select: Prisma.validator<Prisma.TagSelect>()({
  //       ...tagSelectDefault,
  //       ...data?.select,
  //     }),
  //     orderBy: data?.orderBy,
  //   }),
  //   prisma.tag.count({ where: where }),
  // ]);

  // return {
  //   tags,
  //   metadata: {
  //     hasNextPage: skip + take < total,
  //     totalPage: Math.ceil(total / take),
  //     totalItem: total,
  //   },
  // };
}

// Update
export async function updateBlogById(
  id: string,
  data: Partial<createNewBlogType>,
  select?: Prisma.BlogSelect
) {
  const { image, ...props } = data;

  const newData: Prisma.BlogUpdateInput = {
    ...props,
  };
  if (image) {
    if (image.type == "base64") {
      const { secure_url } = await uploadImageCloudinary(image.data);
      newData.image = secure_url;
    } else {
      newData.image = image.data;
    }
  }

  return await prisma.blog.update({
    where: {
      id,
    },
    data: newData,
    select: Prisma.validator<Prisma.BlogSelect>()({
      ...blogSelectDefault,
      ...select,
    }),
  });
}
