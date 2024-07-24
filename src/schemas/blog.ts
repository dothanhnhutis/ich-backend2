import { z } from "zod";
const MAX_FILE_SIZE = 5000000;

export const base64Regex =
  /^data:image\/(?:png|gif|png|jpg|jpeg|bmp|webp)(?:;charset=utf-8)?;base64,(?:[A-Za-z0-9]|[+/])+={0,2}/g;
const trueFalseRegex = /^(0|1|true|false)$/;
const blogOrderByRegex =
  /^((title|isActive|tag|author|publishAt|createdAt|updatedAt)\.(asc|desc)\,)*?(title|isActive|tag|author|publishAt|createdAt|updatedAt)\.(asc|desc)$/;
const dateRegex =
  /^(([1-9]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[1-2]\d{1}|3[0-1]))T([0-5]\d:[0-5]\d:[0-5]\d).\d{3}Z),(([1-9]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[1-2]\d{1}|3[0-1]))T([0-5]\d:[0-5]\d:[0-5]\d).\d{3}Z)$/;

const blogBody = z.object({
  title: z
    .string({
      required_error: "title field is required",
      invalid_type_error: "title field must be string",
    })
    .min(1, "title field cann't empty"),
  image: z.discriminatedUnion("type", [
    z.object({ type: z.literal("url"), data: z.string().url() }),
    z.object({
      type: z.literal("base64"),
      data: z.string().regex(base64Regex),
    }),
  ]),
  slug: z
    .string({
      required_error: "slug field is required",
      invalid_type_error: "slug field must be string",
    })
    .min(1, "slug field cann't empty")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "invalid slug"),
  contentJson: z.string({
    required_error: "contentJson field is required",
    invalid_type_error: "contentJson field must be string",
  }),
  contentText: z.string({
    required_error: "contentText field is required",
    invalid_type_error: "contentText field must be string",
  }),
  contentHTML: z.string({
    required_error: "contentHTML field is required",
    invalid_type_error: "contentHTML field must be string",
  }),
  tagId: z.string({
    required_error: "tagId field is required",
    invalid_type_error: "tagId field must be string",
  }),
  authorId: z.string({
    required_error: "authorId field is required",
    invalid_type_error: "authorId field must be string",
  }),
  isActive: z.boolean({
    required_error: "isActive field is required",
    invalid_type_error: "isActive field must be boolean",
  }),
  publishAt: z.coerce.date({ message: "invalid date" }),
});

export const createBlogSchema = z.object({
  body: blogBody.strict(),
});

export const editBlogSchema = z.object({
  params: z
    .object({
      id: z.string(),
    })
    .strict(),
  body: blogBody.strip().partial(),
});

export const queryblogSchema = z.object({
  query: z
    .object({
      id: z
        .string()
        .or(z.array(z.string()))
        .transform((val) =>
          Array.isArray(val) ? val.join(",").split(",") : val.split(",")
        ),
      title: z
        .string()
        .or(z.array(z.string()))
        .transform((val, _ctx) =>
          Array.isArray(val) ? val.reverse()[0] : val
        ),
      publishAt: z
        .string()
        .or(z.array(z.string()))
        .transform((val, _ctx) => {
          if (Array.isArray(val)) {
            if (
              val.length != 2 ||
              val.some((v) => !z.coerce.date().safeParse(v).success) ||
              new Date(val[0]) > new Date(val[1])
            )
              return undefined;
            return val.map((val) => new Date(val));
          } else {
            if (dateRegex.test(val)) {
              const result = val.split(",").map((val) => new Date(val));
              if (
                result.some((v) => !z.coerce.date().safeParse(v).success) ||
                result[0] > result[1]
              )
                return undefined;
              return result;
            } else {
              return undefined;
            }
          }
        }),
      content: z
        .string()
        .or(z.array(z.string()))
        .transform((val, _ctx) =>
          Array.isArray(val) ? val.reverse()[0] : val
        ),
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
      tagId: z
        .string()
        .or(z.array(z.string()))
        .transform((val) => (Array.isArray(val) ? val : val.split(","))),
      authorId: z
        .string()
        .or(z.array(z.string()))
        .transform((val) => (Array.isArray(val) ? val : val.split(","))),
      order_by: z
        .string()
        .or(z.array(z.string()))
        .transform((val) => {
          if (Array.isArray(val)) {
            const tmp = val.filter((val) => blogOrderByRegex.test(val));
            return tmp.length == 0
              ? undefined
              : tmp
                  .join(",")
                  .split(",")
                  .filter((val, index, arr) => arr.indexOf(val) === index)
                  .map((or) => or.split(".").slice(0, 3))
                  .map(([key, value]) => ({ [key]: value as "asc" | "desc" }));
          } else {
            return blogOrderByRegex.test(val)
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
      title: z.string({ invalid_type_error: "title must be string" }),
      content: z.string({ invalid_type_error: "content must be string" }),
      tag: z.array(z.string({ invalid_type_error: "tag must be string" }), {
        invalid_type_error: "tag must be array",
      }),
      author: z.array(
        z.string({ invalid_type_error: "author must be string" }),
        {
          invalid_type_error: "author must be array",
        }
      ),
      isActive: z.boolean({ invalid_type_error: "isActive must be boolean" }),
      publishAt: z
        .array(
          z.coerce.date({
            errorMap: (issue, { defaultError }) => ({
              message:
                issue.code === "invalid_date"
                  ? "publishAt item must be date"
                  : defaultError,
            }),
          }),
          {
            invalid_type_error: "publishAt must be array",
          }
        )
        .length(2, { message: "publishAt must be two item" })
        .refine((val) => val[0] <= val[1], {
          message: "publishAt[0] <= publishAt[1] ",
        }),
      order_by: z.array(
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
                "Each object must have exactly one key, either 'title'|'isActive'|'tag'|'author'|'publishAt'|'createdAt'|'updatedAt'",
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

export type QueryBlogReq = z.infer<typeof queryblogSchema>;
export type CreateBlogReq = z.infer<typeof createBlogSchema>;
export type EditBlogReq = z.infer<typeof editBlogSchema>;
