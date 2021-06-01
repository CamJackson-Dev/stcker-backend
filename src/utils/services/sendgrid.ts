import sgMail from "@sendgrid/mail";
import { SENDGRID_API_KEY } from "../../config";

sgMail.setApiKey(SENDGRID_API_KEY);

export const mailService = sgMail;
