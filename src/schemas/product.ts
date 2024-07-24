import { z } from "zod";
import { base64Regex } from "./blog";

const mediaSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("url"),
    data: z
      .string({
        required_error: "data field is required",
        invalid_type_error: "data must be string",
      })
      .url("data must be url"),
  }),
  z.object({
    type: z.literal("base64"),
    data: z.string({
      required_error: "data field is required",
      invalid_type_error: "data must be string",
    }),
  }),
]);

const createProductBody = z.object({
  images: z.array(mediaSchema).min(1, "images can't be empty"),
  video: z.string().url("Video must be url").optional(),
  productName: z.string().min(1, "Product name can't be empty"),
  slug: z.string().min(1, "Slug can't be empty"),
  code: z.string().optional(),
  description: z.string({
    required_error: "description field is required",
    invalid_type_error: "description field must be string",
  }),
  categoryId: z.string({
    required_error: "categoryId field is required",
    invalid_type_error: "categoryId field must be string",
  }),
  benefits: z
    .array(
      z.string({
        invalid_type_error: "Benefits item must be string",
      }),
      {
        invalid_type_error: "Benefits must be array",
      }
    )
    .min(1, "Benefits can't be empty"),
  ingredients: z
    .array(
      z.string({
        invalid_type_error: "Ingredients item must be string",
      }),
      {
        invalid_type_error: "Ingredients must be array",
      }
    )
    .min(1, "Ingredients can't be empty"),
  contentJson: z.string({
    required_error: "contentJson field is required",
    invalid_type_error: "contentJson field must be string",
  }),
  contentHTML: z.string({
    required_error: "contentHTML field is required",
    invalid_type_error: "contentHTML field must be string",
  }),
  contentText: z.string({
    required_error: "contentText field is required",
    invalid_type_error: "contentText field must be string",
  }),
  isActive: z
    .boolean({
      invalid_type_error: "isActive field must be boolean",
    })
    .optional(),
});

export const createProductSchema = z.object({
  body: createProductBody.strict(),
});

export const editProductSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: createProductBody.strip().partial(),
});

export const searchProductSchema = z.object({
  body: z
    .object({
      id: z.array(z.string()),
      name: z.string(),
      code: z.array(z.string()),
      description: z.string(),
      categoryId: z.array(z.string()),
      benefits: z.array(z.string()),
      ingredients: z.array(z.string()),
      createdById: z.array(z.string()),
      content: z.string(),
      isActive: z.boolean(),
      orderBy: z.array(
        z
          .object(
            {
              title: z.enum(["asc", "desc"], {
                message: "orderBy title  must be enum 'asc'|'desc'",
              }),
              isActive: z.enum(["asc", "desc"], {
                message: "orderBy isActive  must be enum 'asc'|'desc'",
              }),
              tag: z.enum(["asc", "desc"], {
                message: "orderBy tag  must be enum 'asc'|'desc'",
              }),
              author: z.enum(["asc", "desc"], {
                message: "orderBy author  must be enum 'asc'|'desc'",
              }),
              publishAt: z.enum(["asc", "desc"], {
                message: "orderBy publishAt  must be enum 'asc'|'desc'",
              }),
            },
            { invalid_type_error: "orderBy must be array object" }
          )
          .strip()
          .partial()
          .refine(
            (data) => {
              const keys = Object.keys(data);
              return keys.length === 1;
            },
            {
              message:
                "Each object must have exactly one key, either 'title'|'isActive'|'tag'|'author'|'publishAt'",
            }
          ),
        {
          invalid_type_error: "orderBy must be array",
        }
      ),
      limit: z
        .number({
          invalid_type_error: "Limit field must be number",
        })
        .gte(1, "Limit field should be >= 1"),
      page: z
        .number({
          invalid_type_error: "Page field must be number",
        })
        .gte(1, "Page field should be >= 1"),
    })
    .strip()
    .partial(),
});

export type SearchProductReq = z.infer<typeof searchProductSchema>;

export type CreateProductReq = z.infer<typeof createProductSchema>;
export type EditProductReq = z.infer<typeof editProductSchema>;
