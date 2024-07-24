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
const tagOrderByRegex =
  /^((name|createdAt|updatedAt)\.(asc|desc)\,)*?(name|createdAt|updatedAt)\.(asc|desc)$/;
export const searchTagSchema = z.object({
  query: z
    .object({
      id: z
        .string()
        .or(z.array(z.string()))
        .transform((val) =>
          Array.isArray(val) ? val.join(",").split(",") : val.split(",")
        ),
      name: z
        .string()
        .or(z.array(z.string()))
        .transform((val) => (Array.isArray(val) ? val.reverse()[0] : val)),
      order_by: z
        .string()
        .or(z.array(z.string()))
        .transform((val) => {
          if (Array.isArray(val)) {
            const tmp = val.filter((val) => tagOrderByRegex.test(val));
            return tmp.length == 0
              ? undefined
              : tmp
                  .join(",")
                  .split(",")
                  .filter((val, index, arr) => arr.indexOf(val) === index)
                  .map((or) => or.split(".").slice(0, 3))
                  .map(([key, value]) => ({ [key]: value as "asc" | "desc" }));
          } else {
            return tagOrderByRegex.test(val)
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
      name: z.string({
        invalid_type_error: "name must be array string",
      }),
      order_by: z.array(
        z
          .object(
            {
              name: z.enum(["asc", "desc"], {
                message: "orderBy name  must be enum 'asc'|'desc'",
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
                "Each object must have exactly one key, either 'name'|'createdAt'|'updatedAt'",
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

export type CreateTagReq = z.infer<typeof createTagSchema>;
export type EditTagReq = z.infer<typeof editTagSchema>;
export type SearchTagReq = z.infer<typeof searchTagSchema>;
