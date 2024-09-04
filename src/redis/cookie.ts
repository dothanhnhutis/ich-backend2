import { CookieOptions } from "express";
import { rand } from "@/utils/helper";
import { UAParser } from "ua-parser-js";
import {
  deteleDataCache,
  getDataCache,
  getKeyByPattern,
  setDataInMilisecondCache,
} from "./cache";
import configs from "@/configs";

export type ISessionData = {
  id: string;
  userId: string;
  cookie: CookieOptions;
  reqInfo: {
    ip: string;
    userAgent: UAParser.IResult;
    lastAccess: Date;
    createAt: Date;
  };
};

const SESSION_MAX_AGE = 30 * 24 * 60 * 60000;

export const createSession = async ({
  userId,
  reqIp,
  userAgent,
}: {
  userId: string;
  reqIp?: string;
  userAgent?: string;
}) => {
  const sessionId = `${configs.SESSION_KEY_NAME}:${userId}:${rand()}`;
  const now = new Date();
  const cookieOpt = {
    path: "/",
    httpOnly: true,
    secure: false,
    expires: new Date(now.getTime() + SESSION_MAX_AGE),
  };

  const sessionData: ISessionData = {
    id: sessionId,
    userId,
    cookie: cookieOpt,
    reqInfo: {
      ip: reqIp || "",
      userAgent: UAParser(userAgent),
      lastAccess: now,
      createAt: now,
    },
  };

  await setDataInMilisecondCache(
    sessionId,
    JSON.stringify(sessionData),
    Math.abs(cookieOpt.expires.getTime() - Date.now())
  );

  return { sessionId, cookieOpt };
};

export const getSession = async (id: string) => {
  const sessionCache = await getDataCache(id);
  if (sessionCache == null) return;
  try {
    const sessionData = JSON.parse(sessionCache) as ISessionData;
    return sessionData;
  } catch (error: any) {
    console.log(`getSession() method error: `, error);
  }
};

export const sessionLastAccess = async (cookieId: string) => {
  const sessionCache = await getDataCache(cookieId);
  if (sessionCache == null) return;
  try {
    const sessionData = JSON.parse(sessionCache) as ISessionData;
    const now = new Date();

    sessionData.reqInfo.lastAccess = now;
    sessionData.cookie.expires = new Date(now.getTime() + SESSION_MAX_AGE);
    await setDataInMilisecondCache(
      cookieId,
      JSON.stringify(sessionData),
      Math.abs(sessionData.cookie.expires.getTime() - Date.now())
    );
    return sessionData;
  } catch (error: any) {
    console.log(`SessionLastAccess() method error: `, error);
  }
};

export const getAllSession = async (userId: string) => {
  const keys = await getKeyByPattern(`${configs.SESSION_KEY_NAME}:${userId}:*`);
  console.log(keys);
  const data: ISessionData[] = [];
  for (const id of keys) {
    const sessionCache = await getDataCache(id);
    if (sessionCache == null) continue;
    try {
      const sessionData = JSON.parse(sessionCache) as ISessionData;
      data.push(sessionData);
    } catch (error: any) {
      console.log(`getAllSession() method error: `, error);
      continue;
    }
  }
  return data;
};

export const deleteSession = async (sessionId: string) => {
  await deteleDataCache(sessionId);
};
