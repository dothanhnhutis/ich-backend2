import { BadRequestError } from "@/error-handler";
import { CreateTagReq, EditTagReq } from "@/schemas/tag";
import {
  createNewTag,
  deleteTagById,
  getTagById,
  getTagBySlug,
  queryTag,
  updateTagById,
} from "@/services/tag";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

export async function getAllTag(req: Request, res: Response) {
  const tags = await queryTag();
  return res.status(StatusCodes.OK).send(tags);
}

export async function read(req: Request<{ id: string }>, res: Response) {
  const tag = await getTagById(req.params.id);
  return res.status(StatusCodes.OK).json(tag);
}

export async function create(
  req: Request<{}, {}, CreateTagReq["body"]>,
  res: Response
) {
  const { name, slug } = req.body;
  const tag = await getTagBySlug(slug);
  if (tag) throw new BadRequestError("invalid slug");
  const newTag = await createNewTag(req.body);
  return res
    .status(StatusCodes.CREATED)
    .json({ message: "create tag success", tag: newTag });
}

export async function editTag(
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

  await updateTagById(id, req.body);

  return res.status(StatusCodes.OK).json({ message: "update tag success" });
}

export async function deleteTag(req: Request<{ id: string }>, res: Response) {
  const { id } = req.params;
  const tag = await getTagById(id, { blog: true });
  if (!tag) throw new BadRequestError("invalid tag id");
  if (tag.blog.length > 0) throw new BadRequestError("slug using");
  await deleteTagById(id);
  return res.status(StatusCodes.OK).json({ message: "delete tag success" });
}
