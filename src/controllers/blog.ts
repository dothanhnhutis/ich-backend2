import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

export async function create(req: Request, res: Response) {
  const { slug, tagId, authorId, image } = req.body;

  const slugExist = await prisma.post.findUnique({ where: { slug } });
  if (slugExist) throw new BadRequestError("Slug đã được sử dụng");

  const tagExist = await prisma.tag.findUnique({ where: { id: tagId } });
  if (!tagExist) throw new BadRequestError("Tag không tồn tại");

  const authorExist = await prisma.user.findUnique({
    where: { id: authorId },
  });

  if (isBase64DataURL(image)) {
    const { secure_url } = await uploadImageCloudinary(image);
    req.body.image = secure_url;
  }

  if (!authorExist) throw new BadRequestError("Author không tồn tại");

  await prisma.post.create({ data: req.body });

  return res
    .status(StatusCodes.CREATED)
    .send({ message: "create blog success" });
}
