import { z } from "zod";

const bodyTag = z.object({
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
export const createTagSchema = z.object({
  body: bodyTag.strict(),
});
export const editTagSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: bodyTag.strip().partial(),
});

export type CreateTagReq = z.infer<typeof createTagSchema>;
export type EditTagReq = z.infer<typeof editTagSchema>;
