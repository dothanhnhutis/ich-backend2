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

export const setupMFASchema = z.object({
  body: z
    .object({
      deviceName: z
        .string({
          invalid_type_error: "deviceName must be string",
          required_error: "deviceName is required",
        })
        .max(128, "deviceName maximin 128 characters.")
        .regex(/^[\d\w+=,.@\-_][\d\w\s+=,.@\-_]*$/, "deviceName "),
    })
    .strict(),
});

export const enableMFASchema = z.object({
  body: z
    .object({
      mfa_code1: z
        .string({
          required_error:
            "Multi-factor authentication (MFA) code 1 is required",
          invalid_type_error:
            "Multi-factor authentication (MFA) code 1 must be string",
        })
        .length(6, "Invalid Multi-factor authentication (MFA) code 1"),
      mfa_code2: z
        .string({
          required_error:
            "Multi-factor authentication (MFA) code 2 is required",
          invalid_type_error:
            "Multi-factor authentication (MFA) code 2 must be string",
        })
        .length(6, "Invalid Multi-factor authentication (MFA) code 2"),
    })
    .strict(),
});

export type ChangePasswordReq = z.infer<typeof changePasswordSchema>;
export type CreatePasswordReq = z.infer<typeof createPasswordSchema>;
export type ChangeAvatarReq = z.infer<typeof changeAvatarSchema>;
export type editProfileReq = z.infer<typeof editProfileSchema>;
export type SetupMFAReq = z.infer<typeof setupMFASchema>;
export type EnableMFAReq = z.infer<typeof enableMFASchema>;
