import cookieParser from "cookie-parser";
import express, { Express, Request, Response } from "express";
import helmet from "helmet";
import cors from "cors";

import {
  CLIENT_ADMIN_ORIGIN,
  CLIENT_CUSTOMER_ORIGIN,
  IS_PRODUCTION,
  // IS_STAGING,
} from "../config";
import { tokenValidator } from "../middlewares/auth";

const whitelist: (string | undefined)[] = [
  CLIENT_CUSTOMER_ORIGIN,
  CLIENT_ADMIN_ORIGIN,
];

export const registerMiddlewaresBeforeRoute = (app: Express) => {
  app.use(
    cors({
      credentials: true,
      origin: function (origin, callback) {
        if (IS_PRODUCTION && origin?.includes("stcker.com")) {
          callback(null, true);
          return;
        }

        if (!IS_PRODUCTION && whitelist.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(null, false);
      },
    })
  );
  app.use(helmet());
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
