import z from "zod";
import { mediaSchema } from "./product";

export const changePasswordSchema = z.object({
  body: z
    .object({
      oldPassword: z.string(),
      newPassword: z
        .string({
          required_error: "Password is required",
          invalid_type_error: "Password must be string",
        })
        .min(8, "Password is too short")
        .max(40, "Password can not be longer than 40 characters")
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]*$/,
          "Password must include: letters, numbers and special characters"
        ),
      confirmNewPassword: z.string(),
    })
    .strict()
    .refine((data) => data.newPassword === data.confirmNewPassword, {
      message: "Confirm new password don't match",
      path: ["confirmNewPassword"],
    })
    .refine((data) => data.oldPassword !== data.newPassword, {
      message: "The new password and old password must not be the same",
      path: ["confirmNewPassword"],
    }),
});

export const createPasswordSchema = z.object({
  body: z
    .object({
      newPassword: z
        .string({
          required_error: "Password is required",
          invalid_type_error: "Password must be string",
        })
        .min(8, "Password is too short")
        .max(40, "Password can not be longer than 40 characters")
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]*$/,
          "Password must include: letters, numbers and special characters"
        ),
      confirmNewPassword: z.string(),
    })
    .strict()
    .refine((data) => data.newPassword === data.confirmNewPassword, {
      message: "Confirm new password don't match",
      path: ["confirmNewPassword"],
    }),
});

export const changeAvatarSchema = z.object({
  body: mediaSchema,
});

export const editProfileSchema = z.object({
  body: z
    .object({
      firstName: z
        .string({
          required_error: "First name is required",
          invalid_type_error: "First name must be string",
        })
        .min(1, "First name can't be empty"),
      lastName: z
        .string({
          required_error: "Last name is required",
          invalid_type_error: "Last name must be string",
        })
        .min(1, "Last name can't be empty"),
      phone: z.string({
        required_error: "phone is required",
        invalid_type_error: "phone must be string",
      }),
      address: z.string({
        required_error: "address is required",
        invalid_type_error: "address must be string",
      }),
    })
    .partial()
    .strip(),
});

export type ChangePasswordReq = z.infer<typeof changePasswordSchema>;
export type CreatePasswordReq = z.infer<typeof createPasswordSchema>;
export type ChangeAvatarReq = z.infer<typeof changeAvatarSchema>;
export type editProfileReq = z.infer<typeof editProfileSchema>;
