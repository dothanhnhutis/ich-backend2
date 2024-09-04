import { RequestHandler as Middleware } from "express";
import { parse } from "cookie";
import { decrypt } from "@/utils/helper";
import configs from "@/configs";
import { User } from "@/schemas/user";
import { getUserById } from "@/services/user";
import {
  deleteSession,
  getSession,
  ISessionData,
  sessionLastAccess,
} from "@/redis/cookie";

declare global {
  namespace Express {
    interface Request {
      sessionId?: string | undefined;
      sessionData?: ISessionData | undefined;
      user?: User | null;
    }
  }
}

const deserializeUser: Middleware = async (req, res, next) => {
  const cookiesString = req.get("cookie");

  if (!cookiesString) return next();
  const cookies = parse(cookiesString);
  req.sessionId = decrypt(
    cookies[configs.SESSION_KEY_NAME],
    configs.SESSION_SECRET
  );
  if (!req.sessionId) {
    res.clearCookie(configs.SESSION_KEY_NAME);
    return next();
  }
  req.sessionData = await getSession(req.sessionId);

  if (!req.sessionData) {
    res.clearCookie(configs.SESSION_KEY_NAME);
    return next();
  }

  req.user = await getUserById(req.sessionData.userId, {
    oauthProviders: {
      select: {
        id: true,
        provider: true,
        providerId: true,
      },
    },
  });
  if (req.user) {
    const newSession = await sessionLastAccess(req.sessionId);
    if (newSession) {
      res.cookie(
        configs.SESSION_KEY_NAME,
        cookies[configs.SESSION_KEY_NAME],
        newSession.cookie
      );
    }
  } else {
    res.clearCookie(configs.SESSION_KEY_NAME);
    await deleteSession(req.sessionId);
  }

  return next();
};
export default deserializeUser;
