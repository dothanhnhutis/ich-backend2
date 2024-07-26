import z from "zod";

export const signinSchema = z.object({
  body: z
    .object({
      email: z
        .string({
          required_error: "email field is required",
          invalid_type_error: "email field must be string",
        })
        .email("invalid email or password"),
      password: z
        .string({
          required_error: "password field is required",
          invalid_type_error: "password field must be string",
        })
        .min(8, "invalid email or password")
        .max(40, "invalid email or password")
        .optional(),
    })
    .strict(),
});

export const signupSchema = z.object({
  body: z
    .object({
      username: z
        .string({
          required_error: "Username field is required",
          invalid_type_error: "Username field must be string",
        })
        .min(1, "Username can't be empty"),
      email: z
        .string({
          required_error: "Email field is required",
          invalid_type_error: "Email field must be string",
        })
        .email("Invalid email"),
      password: z
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
    })
    .strict(),
});

export const recoverAccountSchema = z.object({
  body: signupSchema.shape.body
    .pick({
      email: true,
    })
    .strict(),
});

export const resetPasswordSchema = z.object({
  params: z.object({
    token: z.string(),
  }),
  body: z
    .object({
      password: z
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
      confirmPassword: z.string(),
    })
    .strict()
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords don't match",
      path: ["confirmPassword"],
    }),
});

export const checkEmailSignInSchema = z.object({
  body: z
    .object({
      email: z
        .string({
          required_error: "email field is required",
          invalid_type_error: "email field must be string",
        })
        .email("invalid email or password"),
    })
    .strict(),
});

export type SignInReq = z.infer<typeof signinSchema>;
export type SignUpReq = z.infer<typeof signupSchema>;
export type RecoverAccountReq = z.infer<typeof recoverAccountSchema>;
export type ResetPasswordReq = z.infer<typeof resetPasswordSchema>;
export type checkEmailSignInReq = z.infer<typeof checkEmailSignInSchema>;
