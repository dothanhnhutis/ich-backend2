import { z } from "zod";
const MAX_FILE_SIZE = 5000000;

export const base64Regex =
  /^data:image\/(?:png|gif|png|jpg|jpeg|bmp|webp)(?:;charset=utf-8)?;base64,(?:[A-Za-z0-9]|[+/])+={0,2}/g;

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

// export const getBlogSchema = z.object({
//   query: z
//     .object({
//       title: z.string().optional(),
//       tagName: z.string().optional(),
//       authorName: z.string().optional(),
//     })
//     .optional(),
// });

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
  body: z
    .object({
      title: z.string({ invalid_type_error: "title must be string" }),
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
      content: z.string({ invalid_type_error: "content must be string" }),
      isActive: z.boolean({ invalid_type_error: "isActive must be boolean" }),
      tag: z.array(z.string({ invalid_type_error: "tag must be string" }), {
        invalid_type_error: "tag must be array",
      }),
      author: z.array(
        z.string({ invalid_type_error: "author must be string" }),
        {
          invalid_type_error: "author must be array",
        }
      ),
      orderBy: z.array(
        z
          .object({
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
          })
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
          )
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

export type QueryBlogReq = z.infer<typeof queryblogSchema>;
export type CreateBlogReq = z.infer<typeof createBlogSchema>;
export type EditBlogReq = z.infer<typeof editBlogSchema>;
