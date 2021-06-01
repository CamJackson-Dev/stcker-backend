import AWS from "aws-sdk";
import { Response } from "express";
import { OAuth2Client } from "google-auth-library";
import Handlebars from "handlebars";
import { readFile } from "fs/promises";
import { Types } from "mongoose";
import path from "path";

import { IUser } from "../models/user";
import { OrderItem } from "../models/order";
import { ProductType } from "../objectTypes/product";
import {
  ACCESS_COOKIE_OPTIONS,
  ACCESS_TOKEN_COOKIE_NAME,
  AWS_ACCESS_KEY_ID,
  AWS_DEFAULT_REGION,
  AWS_SECRET_ACCESS_KEY,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  REFRESH_COOKIE_OPTIONS,
  REFRESH_TOKEN_COOKIE_NAME,
} from "../config";

type CartItem = Omit<
  ProductType,
  "createdAt" | "updatedAt" | "image" | "categories"
> & { quantity: number };
type CartObject = Record<string, CartItem>;

function calculateItemTotal(products: CartItem[]): number {
  let itemTotal = 0;
  products.forEach((product) => {
    itemTotal += product.quantity * product.price;
  });

  itemTotal = parseInt(((itemTotal * 100) / 100).toFixed(2));
  return itemTotal;
}

export function clearCookiesResponse(res: Response) {
  res.clearCookie(ACCESS_TOKEN_COOKIE_NAME, {
    ...ACCESS_COOKIE_OPTIONS,
    maxAge: -1,
  });
  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
    ...REFRESH_COOKIE_OPTIONS,
    maxAge: -1,
  });
}

export async function compileHTMLWithData(
  filename: string,
  data: any
): Promise<string> {
  const source = await readFile(
    path.join(__dirname + `/../templates/${filename}.html`),
    "utf8"
  );
  const template = Handlebars.compile(source);

  return template(data, { allowProtoPropertiesByDefault: true });
}

export function cookieResponse(params: { res: Response; user: IUser }) {
  const { res, user } = params;
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  res.cookie(ACCESS_TOKEN_COOKIE_NAME, accessToken, ACCESS_COOKIE_OPTIONS);
  res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTIONS);
}

export function createS3Client() {
  return new AWS.S3({
    apiVersion: "2006-03-01",
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
    signatureVersion: "v4",
    region: AWS_DEFAULT_REGION,
  });
}

export function createGoogleOauthClient() {
  return new OAuth2Client({
    clientId: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
  });
}

export function generateRandomPort(options: {
  min: number;
  max: number;
}): number {
  const { min, max } = options;
  return Math.floor(Math.random() * (max - min)) + min;
}

export function generateOrderRequestBody(options: {
  products: ProductType[];
  shippingFee: number;
}): object {
  const { products, shippingFee } = options;

  const cartObject = mapProductsToCartObject(products);
  const cart = Object.values(cartObject);
  const items = mapCartToOrderItems(cart);
  let itemTotal = calculateItemTotal(cart);
  const orderId = new Types.ObjectId().toHexString();

  return {
    application_context: {
      brand_name: "Stcker.com",
      locale: "en-US",
      landing_page: "BILLING",
      shipping_preference: "GET_FROM_FILE", // NO_SHIPPING | SET_PROVIDED_ADDRESS | GET_FROM_FILE
      user_action: "PAY_NOW", // PAY_NOW | CONTINUE
    },
    intent: "CAPTURE",
    purchase_units: [
      {
        reference_id: orderId,
        description: "Stickers",
        custom_id: orderId,
        invoice_id: orderId,
        amount: {
          currency_code: "USD",
          value: `${itemTotal + shippingFee}`,
          breakdown: {
            item_total: {
              currency_code: "USD",
              value: `${itemTotal}`,
            },
            shipping: {
              currency_code: "USD",
              value: `${shippingFee}`,
            },
          },
        },
        items,
        shipping: {
          method: "Austrialian Postal Service",
          type: "SHIPPING",
        },
      },
    ],
  };
}

export function generateOrderDocumentFields(options: {
  products: ProductType[];
  order: any;
  user: IUser;
}) {
  const { products, order, user } = options;
  const cartObject = mapProductsToCartObject(products);

  const items: OrderItem[] = Object.values(cartObject).map(
    ({ _id, quantity, name, price }) => {
      return {
        _id,
        quantity,
        name,
        price,
      };
    }
  );

  const { id, status, purchase_units, payer } = order.result;
  const shipping = purchase_units[0].shipping;
  const payment = purchase_units[0].payments;
  return {
    items,
    captureId: payment.captures[0].id,
    orderId: id,
    user: user._id,
    paymentStatus: status,
    orderStatus: status === "COMPLETED" ? "PLACED" : "PENDING",
    shippingDetails: {
      fullname: shipping.name.full_name,
      address: shipping.address.address_line_1,
      city: shipping.address.admin_area_2,
      state: shipping.address.admin_area_1 || shipping.address.address_line_2,
      postalCode: shipping.address.postal_code,
      country: shipping.address.country_code,
      email: payer.email_address,
    },
    grossAmount: parseFloat(
      payment.captures[0].seller_receivable_breakdown.gross_amount.value
    ),
    payPalFee: parseFloat(
      payment.captures[0].seller_receivable_breakdown.paypal_fee.value
    ),
  };
}

export function parseValueIfJSONString(value: any) {
  try {
    return JSON.parse(value) as Record<string, any>;
  } catch (error) {
    return value;
  }
}

function mapProductsToCartObject(products: ProductType[]): CartObject {
  const cartObject: CartObject = {};
  products.forEach((product) => {
    const { _id, name, price } = product;
    if (cartObject[_id]) {
      cartObject[_id].quantity! += 1;
    } else {
      cartObject[_id] = {
        _id,
        name,
        price,
        quantity: 1,
      };
    }
  });
  return cartObject;
}

function mapCartToOrderItems(cart: CartItem[]): object[] {
  return cart.map((cartItem) => {
    const { _id, name, price, quantity } = cartItem;
    return {
      name,
      description: name,
      sku: `${_id}`,
      unit_amount: {
        currency_code: "USD",
        value: `${price}`,
      },
      quantity: `${quantity}`,
      category: "PHYSICAL_GOODS",
    };
  });
}
