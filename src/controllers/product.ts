import { BadRequestError } from "@/error-handler";
import { CreateProductReq } from "@/schemas/product";
import { getCategoryById } from "@/services/category";
import {
  createNewProduct,
  getProductByCode,
  getProductBySlug,
} from "@/services/product";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

export async function createProduct(
  req: Request<{}, {}, CreateProductReq["body"]>,
  res: Response
) {
  const { id } = req.user!;
  const { slug, code, categoryId } = req.body;
  const checkSlug = await getProductBySlug(slug);
  if (checkSlug) throw new BadRequestError("slug is exist");
  if (code && (await getProductByCode(code))) {
    throw new BadRequestError("code is exist");
  }
  const checkCategory = await getCategoryById(categoryId);
  if (!checkCategory) throw new BadRequestError("invalid category");

  const newProduct = await createNewProduct({
    ...req.body,
    createdById: id,
  });
  return res
    .status(StatusCodes.CREATED)
    .json({ message: "create product success", product: newProduct });
}

export async function editProduct(request: Request, res: Response) {
  return res.status(StatusCodes.OK).send("Server health check oker");
}

export async function searchProduct(request: Request, res: Response) {
  return res.status(StatusCodes.OK).send("Server health check oker");
}

export async function readOneProduct(request: Request, res: Response) {
  return res.status(StatusCodes.OK).send("Server health check oker");
}

export async function readAllProduct(request: Request, res: Response) {
  return res.status(StatusCodes.OK).send("Server health check oker");
}
