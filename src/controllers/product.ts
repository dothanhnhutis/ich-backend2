import { BadRequestError, NotFoundError } from "@/error-handler";
import { CreateProductReq, EditProductReq } from "@/schemas/product";
import { getCategoryById } from "@/services/category";
import {
  createNewProduct,
  getProductByCode,
  getProductById,
  getProductBySlug,
  updateProductById,
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

export async function editProduct(
  req: Request<EditProductReq["params"], {}, EditProductReq["body"]>,
  res: Response
) {
  const { id } = req.params;
  const data = req.body;
  const productExist = await getProductById(id);
  if (!productExist) throw new NotFoundError();

  if (data.slug && (await getProductBySlug(data.slug))?.id != id) {
    throw new BadRequestError("Slug already exist");
  }

  if (data.code && (await getProductBySlug(data.code))?.id != id) {
    throw new BadRequestError("Code already exist");
  }

  if (data.categoryId && !(await getCategoryById(data.categoryId))) {
    throw new BadRequestError("Category không tồn tại");
  }

  const newProduct = await updateProductById(id, data);
  return res
    .status(StatusCodes.OK)
    .json({ message: "update product success", product: newProduct });
}

export async function searchProduct(req: Request, res: Response) {
  return res.status(StatusCodes.OK).send("Server health check oker");
}

export async function readOneProduct(
  req: Request<{ id: string }>,
  res: Response
) {
  const product = await getProductById(req.params.id);
  if (!product) throw new NotFoundError();
  return res.status(StatusCodes.OK).json(product);
}
