import { Document, Schema } from "mongoose";

import {
  ADMIN_EMAIL_ADDRESS,
  CLIENT_CUSTOMER_ORIGIN,
  COMPANY_LOGO_URL,
  SENDER_EMAIL_ADDRESS,
} from "../config";
import { compileHTMLWithData } from "../utils/helpers";
import { mailService } from "../utils/services/sendgrid";

export interface IOrder extends Document {
  captureId: string;
  grossAmount: number;
  items: OrderItem[];
  orderId: string;
  orderStatus: string;
  paymentStatus: string;
  shippingDetails: ShippingDetails;
  user: string;
  sendConfirmationEmail: () => Promise<void>;
  sendNotificationToAdmin: () => Promise<void>;
}

export interface ShippingDetails {
  address: string;
  city: string;
  country: string;
  createdAt: string;
  email: string;
  fullname: string;
  phoneNumber: string;
  postalCode: string;
  state: string;
}

export interface OrderItem {
  _id: string;
  name: string;
  quantity: number;
  price: number;
}

export const orderSchema = new Schema(
  {
    captureId: {
      type: String,
      required: true,
    },
    grossAmount: {
      type: Number,
      required: true,
    },
    items: [
      {
        _id: {
          type: String,
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
      },
    ],
    orderId: {
      type: String,
      required: true,
    },
    orderStatus: {
      type: String,
      required: true,
    },
    paymentStatus: {
      type: String,
      required: true,
    },
    shippingDetails: {
      address: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
      fullname: {
        type: String,
        required: true,
      },
      phoneNumber: {
        type: String,
        default: "",
      },
      postalCode: {
        type: String,
        required: true,
      },
      state: {
        type: String,
      },
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.methods.sendConfirmationEmail = async function () {
  const { items, grossAmount, _id, shippingDetails } = this as IOrder;

  const supportLink = `${CLIENT_CUSTOMER_ORIGIN}/support/`;
  const html = await compileHTMLWithData("order-confirmation", {
    _id,
    logo: COMPANY_LOGO_URL,
    supportLink,
    grossAmount,
    items,
    shippingDetails,
  });

  return mailService.send({
    from: SENDER_EMAIL_ADDRESS,
    to: shippingDetails.email,
    html,
    subject: "Stcker - Order Confirmation Details",
  });
};

orderSchema.methods.sendNotificationToAdmin = async function () {
  const { paymentStatus, orderStatus } = this as IOrder;

  return mailService.send({
    from: SENDER_EMAIL_ADDRESS,
    to: ADMIN_EMAIL_ADDRESS,
    text: `An new order has been created\n  Payment Status: ${paymentStatus}\n Order Status: ${orderStatus}`,
    subject: "Stcker - Order Notification",
  });
};
