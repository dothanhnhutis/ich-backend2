import prisma from "@/utils/db";
import { uploadImageCloudinary } from "@/utils/image";
import { Prisma } from "@prisma/client";

export const blogSelectDefault: Prisma.PostSelect = {
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
      email: true,
      firstName: true,
      lastName: true,
      picture: true,
    },
  },
  createdAt: true,
  updatedAt: true,
};
export type Media = {
  type: "base64" | "url";
  data: string;
};
type CreateNewBlogType = {
  title: string;
  image: Media;
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
export async function insertBlog(
  data: CreateNewBlogType,
  select?: Prisma.PostSelect
) {
  const { image, ...props } = data;
  let url;
  if (image.type == "base64") {
    const { secure_url } = await uploadImageCloudinary(image.data);
    url = secure_url;
  } else {
    url = image.data;
  }
  return await prisma.post.create({
    data: {
      ...props,
      image: url,
    },
    select: Prisma.validator<Prisma.PostSelect>()({
      ...blogSelectDefault,
      ...select,
    }),
  });
}

// Read
export async function getBlogById(id: string, select?: Prisma.PostSelect) {
  return await prisma.post.findUnique({
    where: { id },
    select: Prisma.validator<Prisma.PostSelect>()({
      ...blogSelectDefault,
      ...select,
    }),
  });
}

export async function getBlogBySlug(slug: string, select?: Prisma.PostSelect) {
  return await prisma.post.findUnique({
    where: { slug },
    select: Prisma.validator<Prisma.PostSelect>()({
      ...blogSelectDefault,
      ...select,
    }),
  });
}

type QueryBlogWhereType = {
  id?: string[] | undefined;
  title?: string | undefined;
  content?: string | undefined;
  tagId?: string[] | undefined;
  authorId?: string[] | undefined;
  isActive?: boolean | undefined;
  publishAt?: Date[] | undefined;
};

type QueryBlogOrderByType = {
  title?: "asc" | "desc";
  tag_name?: "asc" | "desc";
  author_username?: "asc" | "desc";
  isActive?: "asc" | "desc";
  publishAt?: "asc" | "desc";
  createdAt?: "asc" | "desc";
  updatedAt?: "asc" | "desc";
};

type QueryBlogType = {
  where?: QueryBlogWhereType;
  limit?: number;
  page?: number;
  order_by?: QueryBlogOrderByType[];
  select?: Prisma.PostSelect;
};

export async function queryBlog(data?: QueryBlogType) {
  const take = data?.limit || 10;
  const page = (!data?.page || data.page <= 0 ? 1 : data.page) - 1;
  const skip = page * take;

  if (data && data.where?.publishAt && data.where.publishAt.length != 2) {
    delete data.where.publishAt;
  }
  let args: Prisma.PostFindManyArgs = {
    select: Prisma.validator<Prisma.PostSelect>()({
      ...blogSelectDefault,
    }),
    take,
    skip,
  };

  if (data?.where) {
    args.where = {
      id: {
        in: data.where.id,
      },
      title: {
        contains: data.where.title,
      },
      publishAt:
        data.where.publishAt && data.where.publishAt.length == 2
          ? {
              gte: data.where.publishAt[0],
              lte: data.where.publishAt[1],
            }
          : undefined,
      isActive: data.where.isActive,
      contentText: {
        search: data.where.content?.split(" ").join(" | "),
      },
      tagId: {
        in: data.where.tagId,
      },
      authorId: {
        in: data.where.authorId,
      },
    };
  }
  if (data?.select) {
    args.select = Prisma.validator<Prisma.PostSelect>()({
      ...blogSelectDefault,
      ...data.select,
    });
  }
  if (data?.order_by) {
    args.orderBy = data.order_by
      .filter(
        (d) =>
          Object.keys(d).length == 1 &&
          ["title", "isActive", "tag_name", "author_username"].includes(
            Object.keys(d)[0]
          )
      )
      .map((d) =>
        d.tag_name
          ? { tag: { name: d.tag_name } }
          : d.author_username
          ? { author: { username: d.author_username } }
          : d
      ) as Prisma.PostOrderByWithRelationInput[];
  }

  const [blogs, total] = await prisma.$transaction([
    prisma.post.findMany(args),
    prisma.post.count({ where: args.where }),
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

// Update
export async function editBlogById(
  id: string,
  data: Partial<CreateNewBlogType>,
  select?: Prisma.PostSelect
) {
  const { image, ...props } = data;

  const newData: Prisma.PostUpdateInput = {
    ...props,
  };
  if (image) {
    if (image.type == "base64") {
      const { secure_url } = await uploadImageCloudinary(image.data, {
        tags: ["blog", id],
      });
      newData.image = secure_url;
    } else {
      newData.image = image.data;
    }
  }

  return await prisma.post.update({
    where: {
      id,
    },
    data: newData,
    select: Prisma.validator<Prisma.PostSelect>()({
      ...blogSelectDefault,
      ...select,
    }),
  });
}
