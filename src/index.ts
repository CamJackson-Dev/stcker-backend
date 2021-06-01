import "dotenv/config";
import "reflect-metadata";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";

import { connectToDatabase, redis } from "./app/database";
import {
  registerMiddlewaresAfterRoute,
  registerMiddlewaresBeforeRoute,
} from "./app/middlewares";
import { IS_TESTING } from "./config";
import { generateRandomPort } from "./utils/helpers";

const app = express();

export const bootstrap = async () => {
  try {
    let port = process.env.PORT || 5000;

    if (IS_TESTING) {
      port = generateRandomPort({ min: 1000, max: 10000 });
      await redis.flushall();
    }

    await connectToDatabase();
    registerMiddlewaresBeforeRoute(app);

    const server = new ApolloServer({
      schema: await buildSchema({
        resolvers: [__dirname + "/resolvers/*.{ts,js}"],
        validate: false,
        dateScalarMode: "timestamp",
      }),
      schemaDirectives: {},
      context: ({ req, res }) => ({ req, res }),
    });

    server.applyMiddleware({ app, cors: false });

    registerMiddlewaresAfterRoute(app);

    const listener = () => {
      console.log(
        `🚀 Server running on port ${port}. GraphQL PATH: ${server.graphqlPath}`
      );
    };
    return app.listen(port, IS_TESTING ? undefined : listener);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

if (!IS_TESTING) {
  bootstrap();
}
