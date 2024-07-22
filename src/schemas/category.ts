import { z } from "zod";
const bodyCategory = z.object({
  name: z
    .string({
      required_error: "name field is required",
      invalid_type_error: "name field must be string",
    })
    .min(1, "name field must be at least 1 character"),
  slug: z
    .string({
      required_error: "slug field is required",
      invalid_type_error: "slug field must be string",
    })
    .min(1, "slug field must be at least 1 character")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "invalid slug"),
});

export const createCategorySchema = z.object({
  body: bodyCategory.strict(),
});
export const editCategorySchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: bodyCategory.partial(),
});

export const searchCategorySchema = z.object({
  body: bodyCategory
    .strip()
    .partial()
    .transform((val) => (Object.keys(val).length == 0 ? undefined : val)),
});

export type CreateCategoryReq = z.infer<typeof createCategorySchema>;
export type EditCategoryReq = z.infer<typeof editCategorySchema>;
