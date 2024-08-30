import crypto from "crypto";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { BadRequestError, NotFoundError } from "@/error-handler";
import { emaiEnum, sendMail } from "@/utils/nodemailer";
import {
  getUserByEmail,
  getUserById,
  editUserById,
  enableMFA,
  disableMFA,
} from "@/services/user";
import configs from "@/configs";
import { signJWT } from "@/utils/jwt";
import {
  ChangeAvatarReq,
  ChangePasswordReq,
  editProfileReq,
  CreatePasswordReq,
  EnableMFAReq,
  SetupMFAReq,
} from "@/schemas/current-user";
import {
  compareData,
  genOTP,
  genTOTP,
  TOTPType,
  validateTOTP,
} from "@/utils/helper";
import { uploadImageCloudinary } from "@/utils/image";
import {
  deteleDataCache,
  getDataCache,
  setDataCache,
  setDataInSecondCache,
} from "@/redis/cache";
import qrcode from "qrcode";
import { getMFAByUserId } from "@/services/mfa";
import { genGoogleAuthUrl, getGoogleUserProfile } from "@/utils/oauth";
import { deleteOauth, getProvider, insertGoogleLink } from "@/services/oauth";
import { DisconnectOauthProviderReq } from "@/schemas/user";

export function currentUser(req: Request, res: Response) {
  res.status(StatusCodes.OK).json(req.user);
}

export async function resendEmail(req: Request, res: Response) {
  const { id } = req.user!;
  const user = await getUserById(id, {
    profile: true,
  });
  if (!user) throw new NotFoundError();
  if (user.emailVerified) throw new NotFoundError();

  const randomBytes: Buffer = await Promise.resolve(crypto.randomBytes(20));
  let randomCharacters = user.emailVerificationToken;
  let date = user.emailVerificationExpires;

  if (!randomCharacters || !date || date.getTime() < Date.now()) {
    randomCharacters = randomBytes.toString("hex");
    date = new Date(Date.now() + 24 * 60 * 60000);
    await editUserById(id, {
      emailVerificationToken: randomCharacters,
      emailVerificationExpires: date,
    });
  }

  const token = signJWT(
    {
      type: "emailVerification",
      session: randomCharacters,
      iat: Math.floor(date.getTime() / 1000),
    },
    configs.JWT_SECRET
  );
  const verificationLink = `${configs.CLIENT_URL}/confirm-email?token=${token}`;

  await sendMail({
    template: emaiEnum.VERIFY_EMAIL,
    receiver: user.email,
    locals: {
      username: user.profile?.lastName + " " + user.profile?.lastName,
      verificationLink,
    },
  });

  return res.status(StatusCodes.OK).json({
    message:
      "New verification email is successfully sent. Please, check your email...",
  });
}

export async function changePassword(
  req: Request<{}, {}, ChangePasswordReq["body"]>,
  res: Response
) {
  const { oldPassword, newPassword } = req.body;
  const { id } = req.user!;
  const userExist = await getUserById(id, {
    password: true,
  });
  if (!userExist) throw new BadRequestError("User not exist");
  const isValidOldPassword = await compareData(
    userExist.password!,
    oldPassword
  );

  if (!isValidOldPassword)
    throw new BadRequestError("Old password is incorrect");

  if (oldPassword != newPassword)
    await editUserById(id, {
      password: newPassword,
    });

  return res.status(StatusCodes.OK).json({
    message: "Update password success",
  });
}

export async function createPassword(
  req: Request<{}, {}, CreatePasswordReq["body"]>,
  res: Response
) {
  const { id, hasPassword } = req.user!;
  const { newPassword } = req.body;
  if (hasPassword) throw new BadRequestError("Password has been initialized");

  await editUserById(id, {
    password: newPassword,
  });

  return res.status(StatusCodes.OK).json({
    message: "Create password success",
  });
}

export async function changeAvatar(
  req: Request<{}, {}, ChangeAvatarReq["body"]>,
  res: Response
) {
  const { id } = req.user!;
  const { type, data } = req.body;
  let url: string;

  if (type == "base64") {
    const { secure_url } = await uploadImageCloudinary(data, {
      transformation: [{ width: 640, height: 640, crop: "scale" }],
      tags: ["avatar", id],
    });
    url = secure_url;
  } else {
    url = data;
  }
  await editUserById(id, {
    picture: url,
  });
  return res.send({
    message: "Update picture success",
  });
}

export async function disactivate(req: Request, res: Response) {
  const { id } = req.user!;
  await editUserById(id, {
    status: "Suspended",
  });
  if (req.sessionID) await deteleDataCache(req.sessionID);
  res.status(StatusCodes.OK).clearCookie(configs.SESSION_KEY_NAME).json({
    message: "Your account has been disabled. You can reactivate at any time!",
  });
}

export async function editProfile(
  req: Request<{}, {}, editProfileReq["body"]>,
  res: Response
) {
  const { id } = req.user!;
  await editUserById(id, req.body);
  return res.status(StatusCodes.OK).json({ message: "Update profile success" });
}

export async function changeEmail(req: Request, res: Response) {
  const { email } = req.body;
  const { id, profile } = req.user!;

  if (email == req.user!.email)
    throw new BadRequestError(
      "The new password must not be the same as the old password"
    );

  const checkNewEmail = await getUserByEmail(email);
  if (checkNewEmail) throw new BadRequestError("Email already exists");

  const randomBytes: Buffer = await Promise.resolve(crypto.randomBytes(20));
  const randomCharacters = randomBytes.toString("hex");
  const date = new Date(Date.now() + 24 * 60 * 60000);

  await editUserById(id, {
    email,
    emailVerified: false,
    emailVerificationExpires: date,
    emailVerificationToken: randomCharacters,
  });

  const token = signJWT(
    {
      type: "emailVerification",
      session: randomCharacters,
      iat: Math.floor(date.getTime() / 1000),
    },
    configs.JWT_SECRET
  );
  const verificationLink = `${configs.CLIENT_URL}/confirm-email?token=${token}`;

  await sendMail({
    template: emaiEnum.VERIFY_EMAIL,
    receiver: email,
    locals: {
      username: profile?.firstName + " " + profile?.lastName,
      verificationLink: verificationLink,
    },
  });

  return res.status(StatusCodes.OK).json({
    message: "Updated and resending e-mail...",
  });
}

export async function setupMFA(
  req: Request<{}, {}, SetupMFAReq["body"]>,
  res: Response
) {
  const { id, mFAEnabled } = req.user!;
  const { deviceName } = req.body;
  if (mFAEnabled)
    throw new BadRequestError(
      "Multi-factor authentication (MFA) has been enabled"
    );

  let backupCodes: string[], totp: TOTPType;
  const totpData = await getDataCache(`${id}:mfa`);

  if (!totpData) {
    backupCodes = Array.from({ length: 10 }).map(() => genOTP());
    totp = genTOTP(deviceName);

    await setDataInSecondCache(
      `${id}:mfa`,
      JSON.stringify({
        backupCodes,
        totp,
      }),
      60 * 60
    );
  } else {
    const mfaCookie = JSON.parse(totpData) as {
      backupCodes: string[];
      totp: TOTPType;
    };

    backupCodes = mfaCookie.backupCodes;
    totp = genTOTP(deviceName, mfaCookie.totp.base32);
    await setDataCache(
      `${id}:mfa`,
      JSON.stringify({
        backupCodes,
        totp,
      }),
      { keepTTL: true }
    );
  }

  qrcode.toDataURL(totp.oauth_url, async (err, imageUrl) => {
    if (err) {
      deteleDataCache(`${id}:mfa`);
      throw new BadRequestError("Failed to generate QR code.");
    }

    return res.status(StatusCodes.OK).json({
      message: "Scan this QR code with your authenticator app.",
      data: {
        backupCodes,
        totp,
        qrCodeUrl: imageUrl,
      },
    });
  });
}

export async function enableMFAAccount(
  req: Request<{}, {}, EnableMFAReq["body"]>,
  res: Response
) {
  const { id, mFAEnabled } = req.user!;
  const { mfa_code1, mfa_code2 } = req.body;

  if (mFAEnabled)
    throw new BadRequestError(
      "Multi-factor authentication (MFA) has been enabled"
    );
  const totpInfo = await getDataCache(`${id}:mfa`);
  if (!totpInfo)
    throw new BadRequestError(
      "The multi-factor authentication (MFA) code has expired"
    );

  const { backupCodes, totp } = JSON.parse(totpInfo) as {
    backupCodes: string[];
    totp: TOTPType;
  };

  if (
    validateTOTP({ secret: totp.base32, token: mfa_code1 }) == null ||
    validateTOTP({ secret: totp.base32, token: mfa_code2 }) == null
  )
    throw new BadRequestError("Invalid MFA code");

  await enableMFA(id, { secretKey: totp.base32, backupCodes });

  res.status(StatusCodes.OK).json({
    message: "Multi-factor authentication (MFA) is enable",
    data: {
      backupCodes,
    },
  });
}

export async function disableMFAAccount(req: Request, res: Response) {
  const { id, mFAEnabled } = req.user!;
  const { mfa_code1, mfa_code2 } = req.body;

  if (!mFAEnabled)
    throw new BadRequestError(
      "Multi-factor authentication (MFA) has been disable"
    );
  const totp = await getMFAByUserId(id);
  if (!totp)
    throw new BadRequestError(
      "Multi-factor authentication (MFA) has been disable"
    );
  if (
    validateTOTP({ secret: totp.secretKey, token: mfa_code1 }) == null ||
    validateTOTP({ secret: totp.secretKey, token: mfa_code2 }) == null
  )
    throw new BadRequestError("Invalid MFA code");
  await disableMFA(id);

  return res
    .status(StatusCodes.OK)
    .json({ message: "Multi-factor authentication (MFA) is disable" });
}

export async function connectOauthProvider(
  req: Request<{ provider: "google" }>,
  res: Response
) {
  const { id } = req.user!;
  const { provider } = req.params;
  const url = genGoogleAuthUrl({
    redirect_uri: `${configs.SERVER_URL}/api/v1/users/connect/${provider}/callback`,
    state: id,
  });
  return res.redirect(url);
}

export async function connectOauthProviderCallback(
  req: Request<
    { provider: "google" },
    {},
    {},
    {
      code?: string | string[] | undefined;
      error?: string | string[] | undefined;
      state?: string | string[] | undefined;
    }
  >,
  res: Response
) {
  const { provider } = req.params;
  const { code, error, state } = req.query;
  console.log(code, error, state);
  if (
    error ||
    !code ||
    typeof code == "object" ||
    !state ||
    typeof state == "object"
  )
    throw new BadRequestError("fail connect");

  const userInfo = await getGoogleUserProfile({
    code,
    redirect_uri: `${configs.SERVER_URL}/api/v1/users/connect/${provider}/callback`,
  });
  await insertGoogleLink(userInfo.id, state);
  return res.status(StatusCodes.OK).json({ message: "oke" });
}

export async function disconnectOauthProvider(
  req: Request<{}, {}, DisconnectOauthProviderReq["body"]>,
  res: Response
) {
  const { oauthProviders, hasPassword } = req.user!;
  const { provider, providerId } = req.body;
  if (
    oauthProviders.filter(
      (o) => o.provider == provider && o.providerId == providerId
    ).length == 0
  )
    throw new BadRequestError(`Unable to disconnect ${provider} provider`);
  if (
    oauthProviders.filter((o) => o.provider != provider).length == 0 &&
    !hasPassword
  )
    throw new BadRequestError(
      `Please create a password before disconnecting from the ${provider} provider.`
    );

  await deleteOauth(providerId, provider);
  return res
    .status(StatusCodes.OK)
    .json({ message: `Disconnect to ${provider} success.` });
}
