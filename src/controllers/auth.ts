import crypto from "crypto";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { BadRequestError, NotFoundError } from "@/error-handler";
import {
  insertUserWithGoogle,
  insertUserWithPassword,
  getUserByEmail,
  getUserByToken,
  GoogleUserInfo,
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
import { compareData, encrypt, genid } from "@/utils/helper";
import { getGoogleProviderById, insertGoogleLink } from "@/services/link";
import { emaiEnum, sendMail } from "@/utils/nodemailer";
import { deteleSession, setDataInMilisecond } from "@/redis/cache";
import { UAParser } from "ua-parser-js";

export async function reActivateAccount(
  req: Request<{ token: string }>,
  res: Response
) {
  const { token } = req.params;
  const user = await getUserByToken("reActivate", token);
  if (!user) throw new NotFoundError();
  await editUserById(user.id, {
    inActive: false,
    reActiveExpires: new Date(),
    reActiveToken: null,
  });

  return res.status(StatusCodes.OK).send({
    message: "reactivateAccount",
  });
}

export async function recoverAccount(
  req: Request<{}, {}, RecoverAccountReq["body"]>,
  res: Response
) {
  const { email } = req.body;
  const existingUser = await getUserByEmail(email);
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
      session: randomCharacters,
      iat: Math.floor(date.getTime() / 1000),
    },
    configs.JWT_SECRET
  );
  const recoverLink = `${configs.CLIENT_URL}/auth/reset-password?token=${token}`;
  // await sendMail({
  //   template: emaiEnum.RECOVER_ACCOUNT,
  //   receiver: email,
  //   locals: {
  //     username: existingUser.username,
  //     recoverLink,
  //   },
  // });

  return res.status(StatusCodes.OK).send({
    message: "Send email success",
  });
}

export async function resetPassword(
  req: Request<ResetPasswordReq["params"], {}, ResetPasswordReq["body"]>,
  res: Response
) {
  const { token } = req.params;
  const { password } = req.body;

  const existingUser = await getUserByToken("recoverAccount", token);
  if (!existingUser) throw new BadRequestError("Reset token has expired");
  await editUserById(existingUser.id, {
    password,
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
      session: randomCharacters,
      iat: Math.floor(date.getTime() / 1000),
    },
    configs.JWT_SECRET
  );
  const reactivateLink = `${configs.CLIENT_URL}/auth/reactivate?token=${token}`;
  console.log(reactivateLink);
  // await sendMail({
  //   template: emaiEnum.REACTIVATE_ACCOUNT,
  //   receiver: req.body.email,
  //   locals: {
  //     username: user.username,
  //     reactivateLink,
  //   },
  // });
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
  const { email, password } = req.body;
  const user = await getUserByEmail(email, {
    password: true,
    suspended: true,
    inActive: true,
  });
  if (!password) {
    if (!user || !user.inActive)
      return res.status(StatusCodes.OK).json({
        message: !user
          ? "You can use this email to register for an account"
          : "Your account is active",
      });

    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Your account is currently closed" });
  } else {
    if (
      !user ||
      !user.password ||
      !(await compareData(user.password, password))
    )
      throw new BadRequestError("Invalid email or password");

    if (user.suspended)
      throw new BadRequestError(
        "Your account has been locked please contact the administrator"
      );

    const sessionID = `sid:${genid(user.id)}`;
    const cookieOpt = {
      path: "/",
      httpOnly: true,
      secure: false,
      expires: new Date(Date.now() + SESSION_MAX_AGE),
    };

    console.log(req.ip);
    console.log(req.headers["user-agent"]);
    console.log(UAParser(req.headers["user-agent"]));

    await setDataInMilisecond(
      sessionID,
      JSON.stringify({
        user: {
          id: user.id,
        },
        cookie: cookieOpt,
        ip: req.ip || "",
        userAgent: req.headers["user-agent"] || "",
      }),
      Math.abs(cookieOpt.expires.getTime() - Date.now())
    );

    return res
      .status(StatusCodes.OK)
      .cookie(
        configs.SESSION_KEY_NAME,
        encrypt(sessionID, configs.SESSION_SECRET),
        cookieOpt
      )
      .json({ message: "Sign in success" });
  }
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
              email: state == "/auth1/signin" ? userInfo.email : "",
            }),
            {
              httpOnly: true,
              path: "/auth",
              secure: configs.NODE_ENV == "production",
            }
          )
          .redirect(`${configs.CLIENT_URL}/auth/signin`);
      }
      const user = await insertUserWithGoogle(userInfo);
      googleProvider = await insertGoogleLink(userInfo.id, user.id);
    }

    if (googleProvider.user.suspended)
      throw new BadRequestError(
        "Your account has been locked please contact the administrator"
      );

    if (googleProvider.user.inActive)
      throw new BadRequestError("Your account has been disactivate");

    // req.session.user = {
    //   id: googleProvider.user.id,
    // };
    // req.session.cookie.expires = new Date(Date.now() + SESSION_MAX_AGE);

    return res.redirect(SUCCESS_REDIRECT);
  }
}

export async function signOut(req: Request, res: Response) {
  if (req.sessionID) await deteleSession(req.sessionID);
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
  const user = await getUserByToken("emailVerification", token);
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
