import z from "zod";

export const signinSchema = z.object({
  body: z
    .object({
      email: z
        .string({
          required_error: "email is required",
          invalid_type_error: "email must be string",
        })
        .email("invalid email or password"),
      password: z
        .string({
          required_error: "password is required",
          invalid_type_error: "password must be string",
        })
        .min(8, "invalid email or password")
        .max(40, "invalid email or password"),
      mfa_code: z
        .string({
          required_error: "MFA code is required",
          invalid_type_error: "MFA code must be string",
        })
        .length(6, "invalid MFA code")
        .optional(),
    })
    .strict(),
});

export const signupSchema = z.object({
  body: z
    .object({
      firstName: z
        .string({
          required_error: "firstName is required",
          invalid_type_error: "firstName must be string",
        })
        .min(1, "firstName can't be empty"),
      lastName: z
        .string({
          required_error: "lastName is required",
          invalid_type_error: "lastName must be string",
        })
        .min(1, "lastName can't be empty"),
      email: z
        .string({
          required_error: "Email is required",
          invalid_type_error: "Email must be string",
        })
        .email("Invalid email"),
      password: z
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
  body: z
    .object({
      session: z
        .string({
          required_error: "Session is required",
          invalid_type_error: "Session must be string",
        })
        .min(1, "Session can not empty"),
      password: z
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
      confirmPassword: z.string(),
    })
    .strict()
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords don't match",
      path: ["confirmPassword"],
    }),
});

export const sendReActivateAccountSchema = z.object({
  body: z
    .object({
      email: z
        .string({
          required_error: "email is required",
          invalid_type_error: "email must be string",
        })
        .email("invalid email or password"),
    })
    .strict(),
});

export type SignInReq = z.infer<typeof signinSchema>;
export type SignUpReq = z.infer<typeof signupSchema>;
export type RecoverAccountReq = z.infer<typeof recoverAccountSchema>;
export type ResetPasswordReq = z.infer<typeof resetPasswordSchema>;
export type SendReActivateAccountReq = z.infer<
  typeof sendReActivateAccountSchema
>;
