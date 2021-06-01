import jwt from "jsonwebtoken";
import { IUser } from "../models/user";

interface TokenOptions {
  token: string;
  secret: string;
}

export const validateToken = ({ token, secret }: TokenOptions) => {
  try {
    return jwt.verify(token, secret, { algorithms: ["HS256"] }) as IUser & {
      iat: number;
      exp: number;
    };
  } catch (error) {
    return null;
  }
};
