import { BadRequestError, PermissionError } from "@/error-handler";
import tag from "@/routes/tag";
import { CreateBlogReq, EditBlogReq } from "@/schemas/blog";
import { Role } from "@/schemas/user";
import {
  createNewBlog,
  getBlogById,
  getBlogBySlug,
  queryBlog,
  updateBlogById,
} from "@/services/blog";
import { getTagById } from "@/services/tag";
import { getUserById } from "@/services/user";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

export async function create(
  req: Request<{}, {}, CreateBlogReq["body"]>,
  res: Response
) {
  const { slug, tagId, authorId } = req.body;

  const slugExist = await getBlogBySlug(slug);
  if (slugExist) throw new BadRequestError("slug already exist");

  const tagExist = await getTagById(tagId);
  if (!tagExist) throw new BadRequestError("invalid tagid");

  const authorExist = await getUserById(authorId);
  if (!authorExist) throw new BadRequestError("invalid author");

  await createNewBlog(req.body);

  return res
    .status(StatusCodes.CREATED)
    .send({ message: "create blog success" });
}

export async function update(
  req: Request<EditBlogReq["params"], {}, EditBlogReq["body"]>,
  res: Response
) {
  const { id: userId, role } = req.user!;
  const { id } = req.params;
  const { slug, tagId, authorId } = req.body;

  const existBlog = await getBlogById(id);
  if (!existBlog) throw new BadRequestError("Blog not exist");

  if (
    role == "BLOGER" &&
    (existBlog.authorId != userId || (authorId && authorId != userId))
  )
    throw new PermissionError();

  if (tagId) {
    const tagExist = await getTagById(tagId);
    if (!tagExist) throw new BadRequestError("tag not exist");
  }

  if (slug) {
    const slugExist = await getBlogBySlug(slug);
    if (slugExist?.id != id) throw new BadRequestError("invalid Slug");
  }

  if (authorId) {
    const roles: Role[] = ["ADMIN", "MANAGER", "BLOGER"];
    const newAuthor = await getUserById(authorId);
    if (!newAuthor || !roles.includes(newAuthor.role))
      throw new BadRequestError("invalid author");
    if (role == "MANAGER" && newAuthor.role == "ADMIN")
      throw new PermissionError();
  }

  if (
    req.body.publishAt &&
    existBlog.isActive &&
    existBlog.publishAt.getTime() < Date.now()
  ) {
    throw new BadRequestError("cannot change publishAt after publish");
  }

  await updateBlogById(id, req.body);

  return res.send({ message: "update blog success" });
}

export async function read(req: Request<{ slug: string }>, res: Response) {
  return res.status(StatusCodes.OK).json(await getBlogBySlug(req.params.slug));
}

export async function searchBlog(req: Request, res: Response) {
  console.log(req.body);
  console.log(req.query);

  return res.status(StatusCodes.OK).json(await queryBlog());
}
