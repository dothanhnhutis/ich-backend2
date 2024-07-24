import { BadRequestError, NotFoundError } from "@/error-handler";
import {
  CreateCategoryReq,
  EditCategoryReq,
  SearchCategoryReq,
} from "@/schemas/category";
import {
  insertCategory,
  removeCategoryById,
  getAllCategory,
  getCategoryById,
  getCategoryBySlug,
  queryCategories,
  editCategoryById,
} from "@/services/category";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

export async function readCategory(
  req: Request<{ id: string }>,
  res: Response
) {
  const category = await getCategoryById(req.params.id);
  if (!category) throw new NotFoundError();
  return res.status(StatusCodes.OK).json(category);
}

export async function readAllCategory(req: Request, res: Response) {
  return res.status(StatusCodes.OK).json(await getAllCategory());
}

export async function searchCategory(
  req: Request<{}, {}, SearchCategoryReq["body"], SearchCategoryReq["query"]>,
  res: Response
) {
  const { page, limit, order_by, ...where } = req.body || req.query || {};
  return res.status(StatusCodes.OK).json(
    await queryCategories({
      where,
      order_by,
      limit,
      page,
    })
  );
}

export async function createCategory(
  req: Request<{}, {}, CreateCategoryReq["body"]>,
  res: Response
) {
  const { name, slug } = req.body;
  const category = await getCategoryBySlug(slug);
  if (category) throw new BadRequestError("slug already exists");
  const newCategory = await insertCategory({ name, slug });
  return res.status(StatusCodes.CREATED).json({
    message: "create category success",
    category: newCategory,
  });
}

export async function editCategory(
  req: Request<EditCategoryReq["params"], {}, EditCategoryReq["body"]>,
  res: Response
) {
  const { id } = req.params;
  const { slug } = req.body;

  const categoryExist = await getCategoryById(id);
  if (!categoryExist) throw new NotFoundError();

  if (slug && slug !== categoryExist.slug) {
    const slugExist = await getCategoryById(slug);
    if (slugExist) throw new BadRequestError("slug already exists");
  }
  const newCategory = await editCategoryById(id, req.body);
  return res.status(StatusCodes.OK).json({
    message: "update category success",
    category: newCategory,
  });
}

export async function deleteCategory(req: Request, res: Response) {
  const { id } = req.params;
  const category = await getCategoryById(id, {
    _count: {
      select: { product: true },
    },
  });
  if (!category) throw new NotFoundError();
  if (category._count.product > 0)
    throw new BadRequestError("category is being used by product");
  const deleteCategory = await removeCategoryById(id);
  return res.status(StatusCodes.OK).json({
    message: "delete category success",
    category: deleteCategory,
  });
}
