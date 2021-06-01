import { Document, Schema } from "mongoose";
import jwt from "jsonwebtoken";

import {
  APP_ACCESS_SECRET,
  APP_REFRESH_SECRET,
  APP_TOKEN_SECRET,
  CLIENT_CUSTOMER_ORIGIN,
  COMPANY_LOGO_URL,
  SENDER_EMAIL_ADDRESS,
} from "../config";
import { mailService } from "../utils/services/sendgrid";
import { compileHTMLWithData } from "../utils/helpers";

export interface IUser extends Document {
  carts: string[];
  createdAt: string;
  email: string;
  favourites: string[];
  firstname: string;
  isEmailVerified: boolean;
  lastname: string;
  password: string;
  updatedAt: string;
  role: string;
  generateAccessToken: (expiresIn?: string) => string;
  generateRefreshToken: (expiresIn?: string) => string;
  sendVerificationEmail: () => Promise<any>;
  sendPasswordResetEmail: () => Promise<any>;
}

export const userSchema = new Schema(
  {
    carts: [
      {
        type: Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    email: {
      type: String,
      lowercase: true,
      maxlength: 255,
      required: true,
      unique: true,
    },
    favourites: [
      {
        type: Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    firstname: {
      type: String,
      maxLength: 50,
      required: true,
    },
    lastname: {
      type: String,
      maxLength: 50,
      required: true,
    },
    password: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      default: "Customer",
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.methods.generateAccessToken = function (expiresIn = "1h") {
  const { email, _id, role } = this as IUser;

  return jwt.sign(
    {
      email,
      _id,
      role,
    },
    APP_ACCESS_SECRET,
    { expiresIn }
  );
};

userSchema.methods.generateRefreshToken = function (expiresIn = "1d") {
  const { _id } = this as IUser;

  return jwt.sign(
    {
      _id,
    },
    APP_REFRESH_SECRET,
    { expiresIn }
  );
};

userSchema.methods.sendVerificationEmail = async function () {
  const { email, firstname, lastname, _id } = this as IUser;

  const token = generateToken({ _id });
  const link = `${CLIENT_CUSTOMER_ORIGIN}/verify-email/${token}`;
  const supportLink = `${CLIENT_CUSTOMER_ORIGIN}/support/`;
  const html = await compileHTMLWithData("verify-email", {
    email,
    firstname,
    lastname,
    link,
    logo: COMPANY_LOGO_URL,
    supportLink,
  });

  return mailService.send({
    from: SENDER_EMAIL_ADDRESS,
    to: email,
    html,
    subject: "Stcker - Please verify your email address",
  });
};

userSchema.methods.sendPasswordResetEmail = async function () {
  const { email, firstname, lastname, _id } = this as IUser;

  const token = generateToken({ _id });
  const link = `${CLIENT_CUSTOMER_ORIGIN}/password-reset/`;
  const supportLink = `${CLIENT_CUSTOMER_ORIGIN}/support/`;
  const html = await compileHTMLWithData("password-reset", {
    firstname,
    lastname,
    link,
    logo: COMPANY_LOGO_URL,
    token,
    supportLink,
  });

  return mailService.send({
    from: SENDER_EMAIL_ADDRESS,
    to: email,
    html,
    subject: "Reset your Stcker Password",
  });
};

export function generateToken(payload: string | object): string {
  return jwt.sign(payload, APP_TOKEN_SECRET, { expiresIn: "1h" });
}
