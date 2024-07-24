import { BadRequestError, NotFoundError } from "@/error-handler";
import { CreateTagReq, EditTagReq, SearchTagReq } from "@/schemas/tag";
import {
  insertTag,
  removeTagById,
  getAllTag,
  getTagById,
  getTagBySlug,
  queryTag,
  editTagById,
} from "@/services/tag";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

export async function searchTag(
  req: Request<{}, {}, SearchTagReq["body"], SearchTagReq["query"]>,
  res: Response
) {
  const { page, limit, order_by, ...where } = req.body || req.query || {};
  return res.status(StatusCodes.OK).send(
    await queryTag({
      where,
      order_by,
      limit,
      page,
    })
  );
}

export async function readAllTag(req: Request, res: Response) {
  const tags = await getAllTag();
  return res.status(StatusCodes.OK).send(tags);
}

export async function readTag(req: Request<{ id: string }>, res: Response) {
  const tag = await getTagById(req.params.id);
  if (!tag) throw new NotFoundError();
  return res.status(StatusCodes.OK).json(tag);
}

export async function createTag(
  req: Request<{}, {}, CreateTagReq["body"]>,
  res: Response
) {
  const { name, slug } = req.body;
  const tag = await getTagBySlug(slug);
  if (tag) throw new BadRequestError("invalid slug");
  const newTag = await insertTag(req.body);
  return res
    .status(StatusCodes.CREATED)
    .json({ message: "create tag success", tag: newTag });
}

export async function updateTag(
  req: Request<EditTagReq["params"], {}, EditTagReq["body"]>,
  res: Response
) {
  const { id } = req.params;
  const { slug } = req.body;

  const tagExist = await getTagById(id);
  if (!tagExist) throw new BadRequestError("invalid tag id");

  if (slug && slug !== tagExist.slug) {
    const slugExist = await getTagBySlug(slug);
    if (slugExist) throw new BadRequestError("slug already exists");
  }

  await editTagById(id, req.body);

  return res.status(StatusCodes.OK).json({ message: "update tag success" });
}

export async function deleteTag(req: Request<{ id: string }>, res: Response) {
  const { id } = req.params;
  const tag = await getTagById(id, { blog: true });
  if (!tag) throw new BadRequestError("invalid tag id");
  if (tag.blog.length > 0) throw new BadRequestError("slug using");
  await removeTagById(id);
  return res.status(StatusCodes.OK).json({ message: "delete tag success" });
}
