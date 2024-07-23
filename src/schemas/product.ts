import { z } from "zod";
import { base64Regex } from "./blog";

const createProductBody = z.object({
  images: z
    .array(
      z.object(
        {
          type: z.enum(["url", "base64"], {
            required_error: "images item type is required",
            invalid_type_error: "images item type must be url or base64",
          }),
          data: z.string({
            required_error: "images field is required",
            invalid_type_error: "images field must be string",
          }),
        },
        {
          invalid_type_error: "images item must be object",
        }
      )
    )
    .min(1, "images can't be empty"),
  //   images: z
  //     .array(
  //       z.object(
  //         {
  //           type: z.enum(["url", "base64"], {
  //             invalid_type_error: "images item type must be url or base64",
  //           }),
  //           data: z.string({
  //             required_error: "images field is required",
  //             invalid_type_error: "images field must be string",
  //           }),
  //         },
  //         {
  //           invalid_type_error: "images item must be object",
  //         }
  //       )
  //     )
  //     .nonempty("images can't be empty"),
  // .superRefine((value, ctx) => {
  //   for (let idx in value) {
  //     if (value[idx].type == "base64" && !base64Regex.test(value[idx].data)) {
  //       ctx.addIssue({
  //         code: z.ZodIssueCode.custom,
  //         path: ["images", idx],
  //         message: "invalid image data base64",
  //       });
  //     }
  //     if (
  //       value[idx].type == "url" &&
  //       !z.string().url().safeParse(value[idx]).success
  //     ) {
  //       ctx.addIssue({
  //         code: z.ZodIssueCode.custom,
  //         path: ["images", idx],
  //         message: "invalid image data url",
  //       });
  //     }
  //   }
  // }),
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
    .nonempty("Benefits can't be empty"),
  ingredients: z
    .array(
      z.string({
        invalid_type_error: "Ingredients item must be string",
      }),
      {
        invalid_type_error: "Ingredients must be array",
      }
    )
    .nonempty("Ingredients can't be empty"),
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
  isActive: z.boolean().optional(),
});

export const createProductSchema = z.object({
  body: createProductBody.strict(),
});

export const editProductSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: createProductBody.partial().strict(),
});

export const queryProductSchema = z.object({
  query: z
    .object({
      limit: z.string(),
      category: z.string(),
      page: z.string(),
    })
    .strip()
    .partial(),
});

export type QueryProductReq = z.infer<typeof queryProductSchema>;

export type CreateProductReq = z.infer<typeof createProductSchema>;
export type EditProductReq = z.infer<typeof editProductSchema>;
