import { google } from "googleapis";
import nodemailer from "nodemailer";
import configs from "../configs";
import Email from "email-templates";
import path from "path";

const oAuth2Client = new google.auth.OAuth2(
  configs.GOOGLE_CLIENT_ID,
  configs.GOOGLE_CLIENT_SECRET,
  configs.GOOGLE_REDIRECT_URI
);
oAuth2Client.setCredentials({ refresh_token: configs.GOOGLE_REFRESH_TOKEN });

export enum emaiEnum {
  VERIFY_EMAIL = "verifyEmail",
  RECOVER_ACCOUNT = "recoverAccount",
  REACTIVATE_ACCOUNT = "reactivateAccount",
}

type LocalsPayload = {
  [emaiEnum.VERIFY_EMAIL]: {
    username: string;
    verificationLink: string;
  };
  [emaiEnum.RECOVER_ACCOUNT]: {
    username: string;
    recoverLink: string;
  };
  [emaiEnum.REACTIVATE_ACCOUNT]: {
    username: string;
    reactivateLink: string;
  };
};

type BuilMap<T extends { [index: string]: any }> = {
  [Key in keyof T]: T[Key] extends object
    ? {
        template: Key;
        receiver: string;
        locals: T[Key];
      }
    : { template: Key };
};

type SendMailType = BuilMap<LocalsPayload>[keyof LocalsPayload];

export const sendMail = async ({
  template,
  receiver,
  locals,
}: SendMailType) => {
  try {
    const accessToken = (await oAuth2Client.getAccessToken()) as string;
    const smtpTransport = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        type: "OAuth2",
        user: configs.SENDER_EMAIL,
        clientId: configs.GOOGLE_CLIENT_ID,
        clientSecret: configs.GOOGLE_CLIENT_SECRET,
        refreshToken: configs.GOOGLE_REFRESH_TOKEN,
        accessToken,
      },
    });
    const email: Email = new Email({
      message: {
        from: `I.C.H App <${configs.SENDER_EMAIL}>`,
      },
      send: true,
      preview: false,
      transport: smtpTransport,
      views: {
        options: {
          extension: "ejs",
        },
      },
      juice: true,
      juiceResources: {
        applyStyleTags: true,
        // preserveImportant: true,
        webResources: {
          relativeTo: path.join(__dirname, "..", "/emails"),
        },
      },
    });
    console.log(path.join(__dirname, "..", "/emails", template));
    await email.send({
      template: path.join(__dirname, "..", "/emails", template),
      message: { to: receiver },
      locals: {
        appIcon: configs.APP_ICON,
        appLink: configs.CLIENT_URL,
        ...locals,
      },
    });
  } catch (error: any) {
    console.log(error.message);
    console.log(error);
  }
};
