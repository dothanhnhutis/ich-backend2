import { BadRequestError, NotFoundError } from "@/error-handler";
import {
  CreateProductReq,
  EditProductReq,
  SearchProductReq,
} from "@/schemas/product";
import { getCategoryById } from "@/services/category";
import {
  createNewProduct,
  getProductByCode,
  getProductById,
  getProductBySlug,
  queryProduct,
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

export async function readProduct(req: Request<{ id: string }>, res: Response) {
  const product = await getProductById(req.params.id);
  if (!product) throw new NotFoundError();
  return res.status(StatusCodes.OK).json(product);
}

export async function searchProduct(
  req: Request<{}, {}, SearchProductReq["body"], SearchProductReq["query"]>,
  res: Response
) {
  const { page, limit, order_by, ...where } = req.body || req.query || {};
  return res.status(StatusCodes.OK).json(
    await queryProduct({
      where,
      page,
      limit,
      order_by,
    })
  );
}
