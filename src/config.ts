export const ADMIN_EMAIL_ADDRESS = process.env.ADMIN_EMAIL_ADDRESS!;
export const APP_ACCESS_SECRET = process.env.APP_ACCESS_SECRET!;
export const APP_REFRESH_SECRET = process.env.APP_REFRESH_SECRET!;
export const APP_TOKEN_SECRET = process.env.APP_TOKEN_SECRET!;

export const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID!;
export const AWS_BUCKET = process.env.AWS_BUCKET!;
export const AWS_DEFAULT_REGION = process.env.AWS_DEFAULT_REGION!;
export const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY!;

export const ACCESS_TOKEN_COOKIE_NAME = "stcker_acc_token";
export const CLIENT_CUSTOMER_ORIGIN = process.env.CLIENT_CUSTOMER_ORIGIN!;
export const CLIENT_ADMIN_ORIGIN = process.env.CLIENT_ADMIN_ORIGIN!;
export const COMPANY_LOGO_URL =
  "https://kenzy-ecommerce.s3.af-south-1.amazonaws.com/logo.png";

export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;

export const IS_PRODUCTION = process.env.NODE_ENV === "production";
export const IS_STAGING = process.env.NODE_ENV === "staging";
export const IS_TESTING = process.env.NODE_ENV === "test";

export const MONGO_URL = process.env.MONGO_URL!;
export const MILLISECONDS_IN_ONE_HOUR = 1000 * 60 * 60;
export const MILLISECONDS_IN_ONE_DAY = 1000 * 60 * 60 * 24;

export const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
export const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
export const REDIS_URL = process.env.REDIS_URL!;
export const REFRESH_TOKEN_COOKIE_NAME = "stcker_ref_token";

export const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY!;
export const SENDER_EMAIL_ADDRESS = process.env.SENDER_EMAIL_ADDRESS!;

const COOKIE_OPTIONS = {
  domain: IS_PRODUCTION ? ".stcker.com" : undefined,
  httpOnly: true,
  secure: IS_PRODUCTION || IS_STAGING,
  sameSite: IS_PRODUCTION || IS_STAGING ? ("none" as const) : undefined,
};
export const ACCESS_COOKIE_OPTIONS = {
  ...COOKIE_OPTIONS,
  maxAge: MILLISECONDS_IN_ONE_HOUR,
};

export const REFRESH_COOKIE_OPTIONS = {
  ...COOKIE_OPTIONS,
  maxAge: MILLISECONDS_IN_ONE_DAY,
};
