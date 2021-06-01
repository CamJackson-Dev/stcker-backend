import cookieParser from "cookie-parser";
import express, { Express, Request, Response } from "express";
import helmet from "helmet";
import cors from "cors";

import {
  CLIENT_ADMIN_ORIGIN,
  CLIENT_CUSTOMER_ORIGIN,
  IS_PRODUCTION,
  IS_STAGING,
} from "../config";
import { tokenValidator } from "../middlewares/auth";

const whitelist: (string | undefined)[] = [
  CLIENT_CUSTOMER_ORIGIN,
  CLIENT_ADMIN_ORIGIN,
  "http://localhost:3001",
];

export const registerMiddlewaresBeforeRoute = (app: Express) => {
  app.use(
    cors({
      credentials: true,
      origin: function (origin, callback) {
        if (whitelist.includes(origin) || !origin) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      },
    })
  );
  app.use(
    helmet({
      contentSecurityPolicy: IS_STAGING || IS_PRODUCTION ? undefined : false,
    })
  );
  app.use(express.json());
  app.use(cookieParser());
  app.use(tokenValidator);
};

export const registerMiddlewaresAfterRoute = (app: Express) => {
  app.use((err: Error, _: Request, res: Response) => {
    console.error(err);

    res.status(500).send("Server error");
  });
};
