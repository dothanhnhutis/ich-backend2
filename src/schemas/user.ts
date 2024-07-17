import { z } from "zod";

const roles = ["MANAGER", "SALER", "BLOGER", "CUSTOMER"] as const;

const emailRegex =
  /^((([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))(\,))*?(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const roleRegex =
  /^((MANAGER|SALER|BLOGER|CUSTOMER)(\,))*?(MANAGER|SALER|BLOGER|CUSTOMER)$/;
const trueFalseRegex = /^(0|1|true|false)$/;
const orderByRegex =
  /^((email|role|emailVerified|inActive|suspended)\.(asc|desc)\,)*?(email|role|emailVerified|inActive|suspended)\.(asc|desc)$/;

export const creatUserSchema = z.object({
  body: z
    .object({
      username: z
        .string({
          required_error: "username field is required",
          invalid_type_error: "username field must be string",
        })
        .min(1, "username can't be empty"),
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
      role: z.enum(roles),
    })
    .strict(),
});

export const searchUserSchema = z.object({
  query: z
    .object({
      email: z
        .string()
        .or(z.array(z.string()))
        .transform((email) => {
          if (Array.isArray(email)) {
            return email
              .filter((val) => emailRegex.test(val))
              .join(",")
              .split(",")
              .filter((val, index, arr) => arr.indexOf(val) === index);
          } else {
            return emailRegex.test(email) ? email.split(",") : undefined;
          }
        }),
      role: z
        .string()
        .or(z.array(z.string()))
        .transform((role) => {
          if (Array.isArray(role)) {
            return role
              .filter((val) => roleRegex.test(val))
              .join(",")
              .split(",")
              .filter(
                (val, index, arr) => arr.indexOf(val) === index
              ) as CreateUserReq["body"]["role"][];
          } else {
            return roleRegex.test(role)
              ? (role.split(",") as CreateUserReq["body"]["role"][])
              : undefined;
          }
        }),
      emailVerified: z
        .string()
        .or(z.array(z.string()))
        .transform((emailVerified) => {
          if (Array.isArray(emailVerified)) {
            const hasEmailVerified = emailVerified
              .filter((val) => trueFalseRegex.test(val))
              .filter((val, index, arr) => arr.indexOf(val) === index)
              .reverse()[0];
            return hasEmailVerified
              ? hasEmailVerified == "1" || hasEmailVerified == "true"
              : undefined;
          } else {
            return trueFalseRegex.test(emailVerified)
              ? emailVerified == "1" || emailVerified == "true"
              : undefined;
          }
        }),
      inActive: z
        .string()
        .or(z.array(z.string()))
        .transform((inActive) => {
          if (Array.isArray(inActive)) {
            const hasInActive = inActive
              .filter((val) => trueFalseRegex.test(val))
              .filter((val, index, arr) => arr.indexOf(val) === index)
              .reverse()[0];
            return hasInActive
              ? hasInActive == "1" || hasInActive == "true"
              : undefined;
          } else {
            return trueFalseRegex.test(inActive)
              ? inActive == "1" || inActive == "true"
              : undefined;
          }
        }),
      suspended: z
        .string()
        .or(z.array(z.string()))
        .transform((suspended) => {
          if (Array.isArray(suspended)) {
            const hasSuspended = suspended
              .filter((val) => trueFalseRegex.test(val))
              .filter((val, index, arr) => arr.indexOf(val) === index)
              .reverse()[0];
            return hasSuspended
              ? hasSuspended == "1" || hasSuspended == "true"
              : undefined;
          } else {
            return trueFalseRegex.test(suspended)
              ? suspended == "1" || suspended == "true"
              : undefined;
          }
        }),
      orderBy: z
        .string()
        .or(z.array(z.string()))
        .transform((orderBy) => {
          if (Array.isArray(orderBy)) {
            return orderBy
              .filter((val) => orderByRegex.test(val))
              .join(",")
              .split(",")
              .filter((val, index, arr) => arr.indexOf(val) === index)
              .map((or) => or.split(".").slice(0, 3))
              .map(([key, value]) => ({ [key]: value }));
          } else {
            return orderByRegex.test(orderBy)
              ? orderBy
                  .split(",")
                  .map((or) => or.split(".").slice(0, 3))
                  .map(([key, value]) => ({ [key]: value }))
              : undefined;
          }
        }),
      page: z
        .string()
        .or(z.array(z.string()))
        .transform((page) => {
          if (Array.isArray(page)) {
            const hasPage = page
              .filter((val) => /^[1-9][0-9]*?$/.test(val))
              .filter((val, index, arr) => arr.indexOf(val) === index)
              .reverse()[0];
            return parseInt(hasPage);
          } else {
            return /^[1-9][0-9]*?$/.test(page) ? parseInt(page) : undefined;
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
      if (!val.email || val.email.length == 0) {
        delete val.email;
      }
      if (!val.role || val.role.length == 0) {
        delete val.role;
      }
      if (!val.emailVerified) {
        delete val.emailVerified;
      }
      if (!val.inActive) {
        delete val.inActive;
      }
      if (!val.suspended) {
        delete val.suspended;
      }
      if (!val.orderBy || val.orderBy.length == 0) {
        delete val.orderBy;
      }
      if (!val.page) {
        delete val.page;
      }
      if (!val.limit) {
        delete val.limit;
      }
      return val;
    }),
  body: z
    .object({
      email: z
        .array(z.string().email("Invalid email in array"))
        .min(1, "Emails can't empty"),
      role: z.array(z.enum(roles)).min(1, "Roles can't empty"),
      emailVerified: z.boolean({
        invalid_type_error: "EmailVerified must be boolean",
      }),
      inActive: z.boolean({
        invalid_type_error: "InActive must be boolean",
      }),
      suspended: z.boolean({
        invalid_type_error: "Suspended must be boolean",
      }),
      orderBy: z
        .array(
          z
            .object({
              email: z.enum(["asc", "desc"], {
                message: "orderBy email must be enum 'asc'|'desc'",
              }),
              role: z.enum(["asc", "desc"], {
                message: "orderBy role must be enum 'asc'|'desc'",
              }),
              emailVerified: z.enum(["asc", "desc"], {
                message: "orderBy emailVerified must be enum 'asc'|'desc'",
              }),
              inActive: z.enum(["asc", "desc"], {
                message: "orderBy inActive must be enum 'asc'|'desc'",
              }),
              suspended: z.enum(["asc", "desc"], {
                message: "orderBy suspended must be enum 'asc'|'desc'",
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
                  "Each object must have exactly one key, either 'email'|'role'|'emailVerified'|'inActive'|'suspended'",
              }
            )
        )
        .min(1, "OrderBy can't empty"),
      page: z
        .number({
          invalid_type_error: "Page field must be number",
        })
        .gte(1, "Page field should be >= 1"),
      limit: z
        .number({
          invalid_type_error: "Limit field must be number",
        })
        .gte(1, "Limit field should be >= 1"),
    })
    .strip()
    .partial(),
});

export const editUserSchema = z.object({
  params: z.object({
    userId: z.string(),
  }),
  body: z
    .object({
      username: z
        .string({
          required_error: "username field is required",
          invalid_type_error: "username field must be string",
        })
        .min(1, "username can't be empty"),
      role: z.enum(roles),
      inActive: z.boolean({
        required_error: "inActive field is required",
        invalid_type_error: "inActive field must be boolean",
      }),
      suspended: z.boolean({
        required_error: "suspended field is required",
        invalid_type_error: "suspended field must be boolean",
      }),
      phone: z.string({
        required_error: "phone field is required",
        invalid_type_error: "phone field must be string",
      }),
      address: z.string({
        required_error: "address field is required",
        invalid_type_error: "address field must be string",
      }),
    })
    .strip()
    .partial(),
});

export type Role = CreateUserReq["body"]["role"] | "ADMIN";
export type CreateUserReq = z.infer<typeof creatUserSchema>;
export type SearchUserReq = z.infer<typeof searchUserSchema>;
export type EditUserReq = z.infer<typeof editUserSchema>;
