import crypto from "crypto";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { BadRequestError, NotFoundError } from "@/error-handler";
import {
  insertUserWithGoogle,
  insertUserWithPassword,
  getUserByEmail,
  getUserByToken,
  editUserById,
} from "@/services/user";
import {
  RecoverAccountReq,
  ResetPasswordReq,
  SendReActivateAccountReq,
  SignInReq,
  SignUpReq,
} from "@/schemas/auth";
import { signJWT, verifyJWT } from "@/utils/jwt";
import configs from "@/configs";
import { google } from "googleapis";
import {
  compareData,
  encrypt,
  genid,
  rand,
  validateTOTP,
} from "@/utils/helper";
import { getProvider, insertGoogleLink } from "@/services/oauth";
import { emaiEnum, sendMail } from "@/utils/nodemailer";
import { setDataInMilisecondCache } from "@/redis/cache";
import { UAParser } from "ua-parser-js";
import { omit } from "lodash";
import { getGoogleUserProfile } from "@/utils/oauth";
import { updateBackupCodeUsedById } from "@/services/mfa";
import { createSession, deleteSession } from "@/redis/cookie";

export async function reActivateAccount(
  req: Request<{ token: string }>,
  res: Response
) {
  const { token } = req.params;

  const data = verifyJWT<{
    type: "emailVerification" | "recoverAccount" | "reActivate";
    session: string;
  }>(token, configs.JWT_SECRET);

  if (!data) throw new NotFoundError();

  const user = await getUserByToken(data.type, data.session);
  if (!user) throw new NotFoundError();
  await editUserById(user.id, {
    status: "Active",
    reActiveExpires: new Date(),
    reActiveToken: null,
  });

  return res.status(StatusCodes.OK).send({
    message: "reactivateAccount",
  });
}

export async function getSession(
  req: Request<{}, {}, {}, { token?: string | string[] | undefined }>,
  res: Response
) {
  const { token } = req.query;
  if (!token || typeof token != "string") throw new NotFoundError();
  const data = verifyJWT<{
    type: "emailVerification" | "recoverAccount" | "reActivate";
    session: string;
    iat: number;
  }>(token, configs.JWT_SECRET);
  if (!data) throw new NotFoundError();
  return res.status(StatusCodes.OK).json(omit(data, ["iat"]));
}

export async function recoverAccount(
  req: Request<{}, {}, RecoverAccountReq["body"]>,
  res: Response
) {
  const { email } = req.body;
  const existingUser = await getUserByEmail(email, {
    emailVerified: true,
    profile: true,
  });
  if (!existingUser) throw new BadRequestError("Invalid email");
  if (!existingUser.emailVerified)
    throw new BadRequestError(
      "Please verify your email address after using password recovery"
    );

  const randomBytes: Buffer = await Promise.resolve(crypto.randomBytes(20));
  let randomCharacters = existingUser.passwordResetToken;
  let date = existingUser.passwordResetExpires;

  if (!randomCharacters || !date || date.getTime() < Date.now()) {
    randomCharacters = randomBytes.toString("hex");
    date = new Date(Date.now() + 4 * 60 * 60000);
    await editUserById(existingUser.id, {
      passwordResetToken: randomCharacters,
      passwordResetExpires: date,
    });
  }
  const token = signJWT(
    {
      type: "recoverAccount",
      session: randomCharacters,
      iat: Math.floor(date.getTime() / 1000),
    },
    configs.JWT_SECRET
  );
  const recoverLink = `${configs.CLIENT_URL}/reset-password?token=${token}`;
  await sendMail({
    template: emaiEnum.RECOVER_ACCOUNT,
    receiver: email,
    locals: {
      username:
        existingUser.profile?.firstName + "" + existingUser.profile?.lastName,
      recoverLink,
    },
  });

  return res.status(StatusCodes.OK).send({
    message: "Send email success",
  });
}

export async function resetPassword(
  req: Request<{}, {}, ResetPasswordReq["body"]>,
  res: Response
) {
  const { session, password } = req.body;
  const existingUser = await getUserByToken("recoverAccount", session);
  if (!existingUser) throw new BadRequestError("Reset token has expired");
  await editUserById(existingUser.id, {
    password,
    passwordResetExpires: new Date(),
    passwordResetToken: null,
  });

  return res.status(StatusCodes.OK).send({
    message: "Reset password success",
  });
}

export async function sendReactivateAccount(
  req: Request<{}, {}, SendReActivateAccountReq["body"]>,
  res: Response
) {
  const user = await getUserByEmail(req.body.email, {
    reActiveToken: true,
    reActiveExpires: true,
  });
  if (!user) throw new BadRequestError("invalid email");
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
    await editUserById(user.id, {
      reActiveToken: randomCharacters,
      reActiveExpires: date,
    });
  }
  const token = signJWT(
    {
      type: "reActivate",
      session: randomCharacters,
      iat: Math.floor(date.getTime() / 1000),
    },
    configs.JWT_SECRET
  );
  const reactivateLink = `${configs.CLIENT_URL}/reactivate?token=${token}`;
  await sendMail({
    template: emaiEnum.REACTIVATE_ACCOUNT,
    receiver: req.body.email,
    locals: {
      username: user.profile?.firstName + "" + user.profile?.lastName,
      reactivateLink,
    },
  });
  return res.status(StatusCodes.OK).send({
    message: "Send email success",
  });
}

const SESSION_MAX_AGE = 30 * 24 * 60 * 60000;
const SUCCESS_REDIRECT = `${configs.CLIENT_URL}/account/profile`;
const ERROR_REDIRECT = `${configs.CLIENT_URL}/auth/error`;
const GOOGLE_REDIRECT_URI = `${configs.SERVER_URL}/api/v1/auth/google/callback`;

const oAuth2Client = new google.auth.OAuth2(
  configs.GOOGLE_CLIENT_ID,
  configs.GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

export async function signIn(
  req: Request<{}, {}, SignInReq["body"]>,
  res: Response
) {
  console.log("----------------");
  console.log(req.ip);
  console.log(req.headers["user-agent"]);
  console.log(UAParser(req.headers["user-agent"]));
  console.log("----------------");

  const { email, password, mfa_code } = req.body;
  const user = await getUserByEmail(email, {
    password: true,
    status: true,
    mFAEnabled: true,
    mFA: true,
  });

  if (!user || !user.password || !(await compareData(user.password, password)))
    throw new BadRequestError("Invalid email or password");

  if (user.mFAEnabled) {
    if (!mfa_code) throw new BadRequestError("MFA code is required");

    const mFAValidate =
      validateTOTP({
        secret: user.mFA!.secretKey,
        token: mfa_code,
      }) == 0;
    const isBackupCode = user.mFA!.backupCodes.includes(mfa_code);
    const isBackupCodeUsed = user.mFA!.backupCodesUsed.includes(mfa_code);

    if (!mFAValidate) {
      if (isBackupCodeUsed)
        throw new BadRequestError("MFA backup codes are used");
      if (!isBackupCode) throw new BadRequestError("Invalid MFA code");

      updateBackupCodeUsedById(user.id, mfa_code);
    }
  }

  if (user.status == "Suspended")
    throw new BadRequestError("Your account is currently closed");

  if (user.status == "Disabled")
    throw new BadRequestError(
      "Your account has been disabled. Please contact the administrator"
    );

  const { sessionId, cookieOpt } = await createSession({
    userId: user.id,
    reqIp: req.ip || "",
    userAgent: req.headers["user-agent"] || "",
  });

  return res
    .status(StatusCodes.OK)
    .cookie(
      configs.SESSION_KEY_NAME,
      encrypt(sessionId, configs.SESSION_SECRET),
      cookieOpt
    )
    .json({
      message: "Sign in success",
    });
}

export async function signInWithGoogle(
  req: Request<{}, {}, {}, { redir?: string }>,
  res: Response
) {
  console.log(req.user);
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
  req: Request<{}, {}, {}, { code?: string; error?: string }>,
  res: Response
) {
  const { code, error } = req.query;

  if (error) res.redirect(ERROR_REDIRECT);

  if (code) {
    const userInfo = await getGoogleUserProfile({ code });
    let googleProvider = await getProvider(userInfo.id, "google");

    if (!googleProvider) {
      const existAccount = await getUserByEmail(userInfo.email);
      if (existAccount) {
        return res
          .cookie("registered", userInfo.email, {
            httpOnly: true,
            secure: configs.NODE_ENV == "production",
          })
          .redirect(`${configs.CLIENT_URL}/login`);
      }
      const user = await insertUserWithGoogle(userInfo);
      googleProvider = await insertGoogleLink(userInfo.id, user.id);
    }

    if (googleProvider.user.status == "Disabled")
      throw new BadRequestError(
        "Your account has been locked please contact the administrator"
      );

    if (googleProvider.user.status == "Suspended")
      throw new BadRequestError("Your account has been suspended");

    const { sessionId, cookieOpt } = await createSession({
      userId: googleProvider.user.id,
      reqIp: req.ip || "",
      userAgent: req.headers["user-agent"] || "",
    });

    return res
      .cookie(
        configs.SESSION_KEY_NAME,
        encrypt(sessionId, configs.SESSION_SECRET),
        cookieOpt
      )
      .redirect(SUCCESS_REDIRECT);
  }
}

export async function signOut(req: Request, res: Response) {
  if (req.sessionId) await deleteSession(req.sessionId);
  res
    .status(StatusCodes.OK)
    .clearCookie(configs.SESSION_KEY_NAME)
    .json({
      message: "Sign out successful",
    })
    .end();
}

export async function signUp(
  req: Request<{}, {}, SignUpReq["body"]>,
  res: Response
) {
  const { email } = req.body;
  const user = await getUserByEmail(email);
  if (user) throw new BadRequestError("User already exists");

  await insertUserWithPassword(req.body);

  return res.status(StatusCodes.CREATED).send({
    message:
      "Sign up success. A confirmation email will be sent to your email address.",
  });
}

export async function verifyEmail(
  req: Request<{ token: string }>,
  res: Response
) {
  const { token } = req.params;

  const data = verifyJWT<{
    type: "emailVerification" | "recoverAccount" | "reActivate";
    session: string;
  }>(token, configs.JWT_SECRET);
  if (!data) throw new NotFoundError();

  const user = await getUserByToken(data.type, data.session);
  if (!user) throw new NotFoundError();

  await editUserById(user.id, {
    emailVerified: true,
    emailVerificationToken: null,
    emailVerificationExpires: new Date(),
  });

  return res.status(StatusCodes.OK).json({
    message: "verify email success",
  });
}
