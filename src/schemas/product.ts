import { z } from "zod";

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
const productOrderByRegex =
  /^((productName|code|category_name|created_by_username|isActive|createdAt|updatedAt)\.(asc|desc)\,)*?(productName|code|category_name|created_by_username|isActive|createdAt|updatedAt)\.(asc|desc)$/;
const trueFalseRegex = /^(0|1|true|false)$/;

export const searchProductSchema = z.object({
  query: z
    .object({
      id: z
        .string()
        .or(z.array(z.string()))
        .transform((val) =>
          Array.isArray(val) ? val.join(",").split(",") : val.split(",")
        ),
      productName: z
        .string()
        .or(z.array(z.string()))
        .transform((val) => (Array.isArray(val) ? val.reverse()[0] : val)),
      code: z
        .string()
        .or(z.array(z.string()))
        .transform((val) =>
          Array.isArray(val) ? val.join(",").split(",") : val.split(",")
        ),
      description: z
        .string()
        .or(z.array(z.string()))
        .transform((val) => (Array.isArray(val) ? val.reverse()[0] : val)),
      categoryId: z
        .string()
        .or(z.array(z.string()))
        .transform((val) =>
          Array.isArray(val) ? val.join(",").split(",") : val.split(",")
        ),
      benefits: z
        .string()
        .or(z.array(z.string()))
        .transform((val) =>
          Array.isArray(val) ? val.join(",").split(",") : val.split(",")
        ),
      ingredients: z
        .string()
        .or(z.array(z.string()))
        .transform((val) =>
          Array.isArray(val) ? val.join(",").split(",") : val.split(",")
        ),
      createdById: z
        .string()
        .or(z.array(z.string()))
        .transform((val) =>
          Array.isArray(val) ? val.join(",").split(",") : val.split(",")
        ),
      content: z
        .string()
        .or(z.array(z.string()))
        .transform((val) => (Array.isArray(val) ? val.reverse()[0] : val)),
      isActive: z
        .string()
        .or(z.array(z.string()))
        .transform((isActive) => {
          if (Array.isArray(isActive)) {
            const hasSuspended = isActive
              .filter((val) => trueFalseRegex.test(val))
              .filter((val, index, arr) => arr.indexOf(val) === index)
              .reverse()[0];
            return hasSuspended
              ? hasSuspended == "1" || hasSuspended == "true"
              : undefined;
          } else {
            return trueFalseRegex.test(isActive)
              ? isActive == "1" || isActive == "true"
              : undefined;
          }
        }),
      order_by: z
        .string()
        .or(z.array(z.string()))
        .transform((val) => {
          if (Array.isArray(val)) {
            const tmp = val.filter((val) => productOrderByRegex.test(val));
            return tmp.length == 0
              ? undefined
              : tmp
                  .join(",")
                  .split(",")
                  .filter((val, index, arr) => arr.indexOf(val) === index)
                  .map((or) => or.split(".").slice(0, 3))
                  .map(([key, value]) => ({ [key]: value as "asc" | "desc" }));
          } else {
            return productOrderByRegex.test(val)
              ? val
                  .split(",")
                  .map((or) => or.split(".").slice(0, 3))
                  .map(([key, value]) => ({ [key]: value as "asc" | "desc" }))
              : undefined;
          }
        }),
      page: z
        .string()
        .or(z.array(z.string()))
        .transform((val) => {
          if (Array.isArray(val)) {
            const hasPage = val
              .filter((val) => /^[1-9][0-9]*?$/.test(val))
              .filter((val, index, arr) => arr.indexOf(val) === index)
              .reverse()[0];
            return parseInt(hasPage);
          } else {
            return /^[1-9][0-9]*?$/.test(val) ? parseInt(val) : undefined;
          }
        }),
      limit: z
        .string()
        .or(z.array(z.string()))
        .transform((limit) => {
          if (Array.isArray(limit)) {
            const hasLimit = limit
              .filter((val) => /^[1-9][0-9]*?$/.test(val))
              .filter((val, index, arr) => arr.indexOf(val) === index)
              .reverse()[0];
            return parseInt(hasLimit);
          } else {
            return /^[1-9][0-9]*?$/.test(limit) ? parseInt(limit) : undefined;
          }
        }),
    })
    .strip()
    .partial()
    .transform((val) => {
      for (let key of Object.keys(val)) {
        if (val[key as keyof typeof val] == undefined)
          delete val[key as keyof typeof val];
      }
      return Object.keys(val).length == 0 ? undefined : val;
    }),
  body: z
    .object({
      id: z
        .array(
          z.string({
            invalid_type_error: "id must be array string",
          }),
          {
            invalid_type_error: "id must be array string",
          }
        )
        .min(1, "id can not empty"),
      productName: z.string({
        invalid_type_error: "productName must be array string",
      }),
      code: z.array(
        z.string({
          invalid_type_error: "code item must be string",
        }),
        {
          invalid_type_error: "code must be array array",
        }
      ),
      description: z.string({
        invalid_type_error: "description item must be string",
      }),
      categoryId: z.array(
        z.string({
          invalid_type_error: "categoryId item must be string",
        }),
        {
          invalid_type_error: "categoryId must be array array",
        }
      ),
      benefits: z.array(
        z.string({
          invalid_type_error: "benefits item must be string",
        }),
        {
          invalid_type_error: "benefits must be array array",
        }
      ),
      ingredients: z.array(
        z.string({
          invalid_type_error: "ingredients item must be string",
        }),
        {
          invalid_type_error: "ingredients must be array array",
        }
      ),
      createdById: z.array(
        z.string({
          invalid_type_error: "createdById item must be string",
        }),
        {
          invalid_type_error: "createdById must be array array",
        }
      ),
      content: z.string({
        invalid_type_error: "content must be string",
      }),
      isActive: z.boolean({
        invalid_type_error: "isActive must be boolean",
      }),
      order_by: z.array(
        z
          .object(
            {
              productName: z.enum(["asc", "desc"], {
                message: "orderBy productName  must be enum 'asc'|'desc'",
              }),
              code: z.enum(["asc", "desc"], {
                message: "orderBy code  must be enum 'asc'|'desc'",
              }),
              category_name: z.enum(["asc", "desc"], {
                message: "orderBy category_name  must be enum 'asc'|'desc'",
              }),
              created_by_username: z.enum(["asc", "desc"], {
                message:
                  "orderBy created_by_username  must be enum 'asc'|'desc'",
              }),
              isActive: z.enum(["asc", "desc"], {
                message: "orderBy isActive  must be enum 'asc'|'desc'",
              }),
              createdAt: z.enum(["asc", "desc"], {
                message: "orderBy createdAt  must be enum 'asc'|'desc'",
              }),
              updatedAt: z.enum(["asc", "desc"], {
                message: "orderBy updatedAt  must be enum 'asc'|'desc'",
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
                "Each object must have exactly one key, either 'productName'|'code'|'category_name'|'created_by_username'|'isActive'|'createdAt'|'updatedAt'",
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
    .partial()
    .transform((val) => (Object.keys(val).length == 0 ? undefined : val)),
});

export type SearchProductReq = z.infer<typeof searchProductSchema>;
export type CreateProductReq = z.infer<typeof createProductSchema>;
export type EditProductReq = z.infer<typeof editProductSchema>;
