import { SendRecoverEmail } from "@/schemas/auth.schema";
import { Request } from "express";
import { rateLimit } from "express-rate-limit";
// import { CreateContact } from "@/schemas/contact.schema";

// export const rateLimitContact = rateLimit({
//   windowMs: 60 * 1000,
//   limit: 2,
//   standardHeaders: "draft-7",
//   legacyHeaders: false,
//   keyGenerator: function (req: Request<{}, {}, CreateContact["body"]>) {
//     return req.body.requestId;
//   },
//   handler: (req, res, next, options) => {
//     return res.status(options.statusCode).json({ message: options.message });
//   },
// });

export const rateLimitRecover = rateLimit({
  windowMs: 3 * 60000,
  limit: 1,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: function (req: Request<{}, {}, SendRecoverEmail["body"]>) {
    return req.body.email;
  },
  handler: (req, res, next, options) => {
    return res.status(options.statusCode).json({ message: options.message });
  },
});

export const rateLimitSendEmail = rateLimit({
  windowMs: 60 * 1000,
  limit: 1,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: function (req: Request) {
    const currentUser = req.session.user!;
    return currentUser.id;
  },
  handler: (req, res, next, options) => {
    return res.status(options.statusCode).json({ message: options.message });
  },
});
