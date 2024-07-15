import jwt from "jsonwebtoken";
export function signJWT(
  payload: Object,
  secret: string,
  options?: jwt.SignOptions
) {
  return jwt.sign(payload, secret, {
    ...(options && options),
  });
}

export function verifyJWT<T>(
  token: string,
  secret: string,
  options?: jwt.VerifyOptions
) {
  try {
    const decoded = jwt.verify(token, secret, {
      ...(options && options),
    }) as T;
    return decoded;
  } catch (error) {
    return null;
  }
}
