import { Document, Schema } from "mongoose";

import {
  ADMIN_EMAIL_ADDRESS,
  COMPANY_LOGO_URL,
  SENDER_EMAIL_ADDRESS,
} from "../config";
import { compileHTMLWithData } from "../utils/helpers";
import { mailService } from "../utils/services/sendgrid";

export interface IRequest extends Document {
  createdAt: string;
  email: string;
  message: string;
  replied: boolean;
  subject: string;
  updatedAt: string;
  sendNotificationToAdmin: () => Promise<void>;
  sendConfirmationEmail: () => Promise<void>;
  sendReplyEmail: (message: string) => Promise<void>;
}

export const requestSchema = new Schema(
  {
    message: {
      type: String,
      maxLength: 1024,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      required: true,
      maxLength: 255,
    },
    replied: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

requestSchema.methods.sendConfirmationEmail = async function () {
  const { _id, subject, email } = this as IRequest;

  const html = await compileHTMLWithData("request-confirmation", {
    logo: COMPANY_LOGO_URL,
  });

  return mailService.send({
    from: SENDER_EMAIL_ADDRESS,
    to: email,
    html,
    subject: `Sticker - Case #${_id} ${subject}`,
  });
};

requestSchema.methods.sendNotificationToAdmin = async function () {
  const { subject, message } = this as IRequest;

  return mailService.send({
    from: SENDER_EMAIL_ADDRESS,
    to: ADMIN_EMAIL_ADDRESS,
    text: message,
    subject: "Stcker Case |" + subject,
  });
};

requestSchema.methods.sendReplyEmail = async function (message: string) {
  const { _id, subject, email } = this as IRequest;

  return mailService.send({
    from: SENDER_EMAIL_ADDRESS,
    to: email,
    text: message,
    subject: `Stcker - Case #${_id} ${subject}`,
  });
};
