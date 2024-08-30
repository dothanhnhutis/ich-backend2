import { CookieOptions, RequestHandler as Middleware } from "express";
import { parse } from "cookie";
import { decrypt } from "@/utils/helper";
import configs from "@/configs";
import { deteleDataCache, getDataCache } from "@/redis/cache";
import { User } from "@/schemas/user";
import { getUserById } from "@/services/user";

declare global {
  namespace Express {
    interface Request {
      sessionID?: string | undefined;
      user?: User | undefined;
    }
  }
}

interface ISession {
  user: {
    id: string;
  };
  cookie: CookieOptions;
  userAgent: string;
}

const deserializeUser: Middleware = async (req, res, next) => {
  const cookiesString = req.get("cookie");
  if (!cookiesString) return next();
  const cookies = parse(cookiesString);
  try {
    req.sessionID = decrypt(
      cookies[configs.SESSION_KEY_NAME],
      configs.SESSION_SECRET
    );
    const cookieRedis = await getDataCache(req.sessionID);

    const cookieJson = JSON.parse(cookieRedis || "") as ISession;

    const user = await getUserById(cookieJson.user.id, {
      oauthProviders: {
        select: {
          id: true,
          provider: true,
          providerId: true,
        },
      },
    });

    if (user) {
      req.user = user;
    } else {
      res.clearCookie(configs.SESSION_KEY_NAME);
      await deteleDataCache(req.sessionID);
    }
  } catch (error) {
    res.clearCookie(configs.SESSION_KEY_NAME);
  }
  return next();
};
export default deserializeUser;
