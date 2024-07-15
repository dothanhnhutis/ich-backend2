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
        .max(40, "invalid email or password"),
    })
    .strict(),
});

export type SignInReq = z.infer<typeof signinSchema>;
