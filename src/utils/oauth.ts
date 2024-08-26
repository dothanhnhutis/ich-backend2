import configs from "@/configs";
import { google } from "googleapis";

const GOOGLE_REDIRECT_URI = `${configs.SERVER_URL}/api/v1/auth/google/callback`;

const oAuth2Client = new google.auth.OAuth2(
  configs.GOOGLE_CLIENT_ID,
  configs.GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

export const genGoogleAuthUrl = (props?: {
  prompt?: string | undefined;
  state?: string | undefined;
  redirect_uri?: string | undefined;
  access_type?: string | undefined;
  scope?: string | string[] | undefined;
}) =>
  oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
      "openid",
    ],
    prompt: "consent",
    ...props,
  });

export type GoogleUserInfo = {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
};
export async function getGoogleUserProfile(code: string) {
  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(tokens);

  const oauth2 = google.oauth2({
    auth: oAuth2Client,
    version: "v2",
  });

  return (await oauth2.userinfo.get()).data as GoogleUserInfo;
}
