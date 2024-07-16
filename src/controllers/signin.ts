import crypto from "crypto";
import { Request, Response } from "express";
import { BadRequestError } from "@/error-handler";
import { compareData } from "@/utils/helper";
import { StatusCodes } from "http-status-codes";
import { checkEmailSignInReq, SignInReq } from "@/schemas/auth";
import {
  createUserWithGoogle,
  getUserByEmail,
  GoogleUserInfo,
  updateUserById,
} from "@/services/user";
import configs from "@/configs";
import { google } from "googleapis";
import { createGoogleLink, getGoogleProviderById } from "@/services/link";
import { signJWT } from "@/utils/jwt";

const SESSION_MAX_AGE = 30 * 24 * 60 * 60000;
const SUCCESS_REDIRECT = `${configs.CLIENT_URL}/account/profile`;
const ERROR_REDIRECT = `${configs.CLIENT_URL}/auth/error`;
const RECOVER_SESSION_NAME = "eid";
const GOOGLE_REDIRECT_URI = `${configs.SERVER_URL}/api/v1/auth/google/callback`;

const oAuth2Client = new google.auth.OAuth2(
  configs.GOOGLE_CLIENT_ID,
  configs.GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

export async function read(
  req: Request<{}, {}, SignInReq["body"]>,
  res: Response
) {
  const { email, password } = req.body;
  const user = await getUserByEmail(email, { password: true, suspended: true });

  if (!user || !user.password || !(await compareData(user.password, password)))
    throw new BadRequestError("Invalid email or password");

  if (user.suspended)
    throw new BadRequestError(
      "Your account has been locked please contact the administrator"
    );

  req.session.user = {
    id: user.id,
  };
  req.session.cookie.expires = new Date(Date.now() + SESSION_MAX_AGE);
  return res.status(StatusCodes.OK).json({ message: "Sign in success" });
}

export async function signInWithGoogle(
  req: Request<{}, {}, {}, { redir?: string }>,
  res: Response
) {
  const url = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
      "openid",
    ],
    state: req.query.redir || undefined,
    prompt: "consent",
  });
  return res.redirect(url);
}

export async function signInWithGoogleCallBack(
  req: Request<{}, {}, {}, { code?: string; error?: string; state: string }>,
  res: Response
) {
  const { code, error, state } = req.query;

  if (error) res.redirect(ERROR_REDIRECT);

  if (code) {
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({
      auth: oAuth2Client,
      version: "v2",
    });

    const userInfo = (await oauth2.userinfo.get()).data as GoogleUserInfo;
    let googleProvider = await getGoogleProviderById(userInfo.id);

    if (!googleProvider) {
      const existAccount = await getUserByEmail(userInfo.email);
      if (existAccount) {
        return res
          .cookie(
            "oauth2",
            JSON.stringify({
              type: "nolink",
              email: state == "/auth/signin" ? userInfo.email : "",
            }),
            {
              httpOnly: false,
              path: "/auth",
              secure: configs.NODE_ENV == "production",
            }
          )
          .redirect(`${configs.CLIENT_URL}/auth/signin`);
      }
      const user = await createUserWithGoogle(userInfo);
      googleProvider = await createGoogleLink(userInfo.id, user.id);
    }

    if (googleProvider.user.suspended)
      throw new BadRequestError(
        "Your account has been locked please contact the administrator"
      );

    if (!googleProvider.user.inActive)
      throw new BadRequestError("Your account has been disactivate");

    req.session.user = {
      id: googleProvider.user.id,
    };
    req.session.cookie.expires = new Date(Date.now() + SESSION_MAX_AGE);

    return res.redirect(SUCCESS_REDIRECT);
  }
}

export async function checkEmailSignIn(
  req: Request<{}, {}, checkEmailSignInReq["body"]>,
  res: Response
) {
  const { email } = req.body;
  const user = await getUserByEmail(email);

  if (!user)
    return res.clearCookie(RECOVER_SESSION_NAME).status(StatusCodes.OK).json({
      message: "You can use this email to register for an account",
    });

  if (user.inActive)
    return res.clearCookie(RECOVER_SESSION_NAME).status(StatusCodes.OK).json({
      message: "Your account is active",
    });

  const randomBytes: Buffer = await Promise.resolve(crypto.randomBytes(20));
  let randomCharacters = user.reActiveToken;
  let date = user.reActiveExpires;
  if (
    !randomCharacters ||
    randomCharacters == "" ||
    !date ||
    date.getTime() <= Date.now()
  ) {
    randomCharacters = randomBytes.toString("hex");
    date = new Date(Date.now() + 5 * 60000);
    await updateUserById(user.id, {
      reActiveToken: randomCharacters,
      reActiveExpires: date,
    });
  }

  const token = signJWT(
    {
      session: randomCharacters,
      iat: Math.floor(date.getTime() / 1000),
    },
    configs.JWT_SECRET
  );

  return res
    .status(StatusCodes.BAD_REQUEST)
    .cookie(RECOVER_SESSION_NAME, token, { expires: date })
    .json({ message: "Your account is currently closed" });
}
