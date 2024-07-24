import z from "zod";

export const changePasswordSchema = z.object({
  body: z
    .object({
      oldPassword: z.string(),
      newPassword: z
        .string({
          required_error: "Password field is required",
          invalid_type_error: "Password field must be string",
        })
        .min(8, "Password field is too short")
        .max(40, "Password field can not be longer than 40 characters")
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]*$/,
          "Password field must include: letters, numbers and special characters"
        ),
      confirmNewPassword: z.string(),
    })
    .strict()
    .refine((data) => data.newPassword === data.confirmNewPassword, {
      message: "Confirm new password don't match",
      path: ["confirmNewPassword"],
    })
    .refine((data) => data.oldPassword === data.newPassword, {
      message: "The new password and old password must not be the same",
      path: ["confirmNewPassword"],
    }),
});

export const changeAvatarSchema = z.object({
  body: z
    .object({
      type: z.enum(["base64", "url"], {
        invalid_type_error: "type must be 'base64' | 'url'",
      }),
      data: z.string({
        required_error: "data is required",
        invalid_type_error: "data must be string",
      }),
    })
    .strict(),
});

export const editProfileSchema = z.object({
  body: z
    .object({
      username: z
        .string({
          required_error: "username field is required",
          invalid_type_error: "username field must be string",
        })
        .min(1, "username can't be empty"),
      phone: z.string({
        required_error: "phone field is required",
        invalid_type_error: "phone field must be string",
      }),
      address: z.string({
        required_error: "address field is required",
        invalid_type_error: "address field must be string",
      }),
    })
    .partial()
    .strip(),
});

export type ChangePasswordReq = z.infer<typeof changePasswordSchema>;
export type ChangeAvatarReq = z.infer<typeof changeAvatarSchema>;
export type editProfileReq = z.infer<typeof editProfileSchema>;
