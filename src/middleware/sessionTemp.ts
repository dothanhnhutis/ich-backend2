// import { Request, RequestHandler as Middleware, CookieOptions } from "express";
// import crypto from "crypto";
// import { parse } from "cookie";
// import { decrypt, encrypt } from "@/utils/helper";
// import { deteleSession, getData, setDataInMilisecond } from "@/redis/cache";
// import { User } from "@/schemas/user";

// declare global {
//   namespace Express {
//     interface Request {
//       sessionID: string;
//       session: SessionData;
//       logout: () => Promise<void>;
//       user?: User | undefined;
//     }
//   }
// }

// interface SessionData {
//   cookie: CookieOptions;
//   user?: {
//     id: string;
//   };
// }

// function genId(req: Request) {
//   const randomId = crypto.randomBytes(10).toString("hex");
//   return randomId;
// }

// interface SessionOptions {
//   secret: string;
//   genid?(req: Request): string;
//   name?: string | undefined;
//   cookie?: CookieOptions | undefined;
//   prefix?: string;
// }

// const cookieDefault: CookieOptions = {
//   path: "/",
//   httpOnly: true,
//   secure: false,
// };

// export const session =
//   ({
//     secret,
//     genid = genId,
//     name = "session",
//     cookie,
//     prefix = "sid:",
//   }: SessionOptions): Middleware =>
//   async (req, res, next) => {
//     req.session = {
//       cookie: {
//         ...cookieDefault,
//         ...cookie,
//       },
//     };

//     const cookies = parse(req.get("cookie") || "");
//     let changed: boolean = false;
//     if (cookies[name]) {
//       try {
//         req.sessionID = decrypt(cookies[name], secret);
//         const cookieRedis = await getData(req.sessionID);
//         if (cookieRedis) {
//           const cookieJson = JSON.parse(cookieRedis);
//           if ("expires" in cookieJson.cookie) {
//             cookieJson.cookie.expires = new Date(cookieJson.cookie.expires);
//           }
//           req.session = cookieJson;
//         }
//       } catch (error) {
//         res.clearCookie(name);
//       }
//     }

//     const createCookieProxy = (data: CookieOptions) => {
//       return new Proxy<CookieOptions>(data, {
//         set(target, p: keyof CookieOptions, newValue, receiver) {
//           if (p == "expires") {
//             delete target["maxAge"];
//           } else if (p == "maxAge") {
//             delete target["expires"];
//           }
//           // target[p] = newValue;
//           Reflect.set(target, p, newValue, receiver);
//           changed = true;
//           if (req.session.user)
//             res.cookie(name, encrypt(req.sessionID, secret), target);
//           return true;
//         },
//       });
//     };

//     req.logout = async () => {
//       if (cookie) {
//         res.clearCookie(name);
//         await deteleSession(req.sessionID);
//       }
//     };

//     req.session = new Proxy<SessionData>(
//       {
//         ...req.session,
//         cookie: createCookieProxy(req.session.cookie),
//       },
//       {
//         set(target, p: keyof SessionData, newValue, receiver) {
//           console.log(p);
//           if (p == "cookie") {
//             if ("expires" in newValue && "maxAge" in newValue) {
//               const keysIndex = Object.keys(newValue);
//               if (keysIndex.indexOf("maxAge") > keysIndex.indexOf("expires")) {
//                 delete newValue.expires;
//               } else {
//                 delete newValue.maxAge;
//               }
//             }
//             // target.cookie = createCookieProxy({
//             //   ...target.cookie,
//             //   ...newValue,
//             // });
//             Reflect.set(
//               target,
//               p,
//               createCookieProxy({
//                 ...target.cookie,
//                 ...newValue,
//               }),
//               receiver
//             );
//           }
//           if (p == "user") {
//             // target[p] = newValue;
//             Reflect.set(target, p, newValue, receiver);
//             req.sessionID = req.sessionID || `${prefix}${genid(req)}`;
//           }
//           changed = true;
//           if (target.user) {
//             res.cookie(name, encrypt(req.sessionID, secret), {
//               ...target.cookie,
//             });
//           }

//           return true;
//         },
//         get(target, p, receiver) {
//           return Reflect.get(target, p, receiver);
//           // return Reflect.get(target, p);
//         },
//       }
//     );

//     res.on("finish", async () => {
//       if (changed && req.sessionID) {
//         await setDataInMilisecond(
//           req.sessionID,
//           JSON.stringify(req.session),
//           req.session.cookie.expires
//             ? Math.abs(req.session.cookie.expires.getTime() - Date.now())
//             : req.session.cookie.maxAge!
//         );
//       }
//     });

//     next();
//   };
