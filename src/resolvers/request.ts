import { QueryOptions, Types } from "mongoose";
import { Arg, Mutation, Query, Resolver, UseMiddleware } from "type-graphql";

import {
  RequestInput,
  RequestType,
  ReplyInput,
  RequestPagination,
} from "../objectTypes/request";
import { Request } from "../models";
import { getValidationErrors, requestSchema } from "../utils/validation";
import { IsAdmin, RateLimit } from "../middlewares/auth";
import { ParamsArgs } from "./common";

@Resolver()
export class RequestResolver {
  @Query(() => RequestPagination)
  async requests(@Arg("params") { pagination, sort }: ParamsArgs) {
    let queryOptions: QueryOptions | null | undefined;

    if (pagination) {
      const { page, perPage } = pagination;
      if (page && perPage) {
        queryOptions = {
          limit: perPage,
          skip: (page - 1) * perPage,
        };
      }
    }

    if (sort) {
      const { field, order } = sort;
      if (field && order) {
        queryOptions = {
          ...queryOptions,
          sort: { [field]: order === "ASC" ? 1 : -1 },
        };
      }
    }

    return Promise.all([
      Request.find({}, undefined, queryOptions),
      Request.estimatedDocumentCount(),
    ])
      .then((value) => {
        return {
          items: value[0],
          total: value[1],
        };
      })
      .catch((error) => {
        throw new Error(error.message);
      });
  }

  @Query(() => RequestType)
  @UseMiddleware(IsAdmin)
  async request(@Arg("id") id: string) {
    if (!Types.ObjectId.isValid(id)) throw new Error("Invalid ObjectID");

    const request = await Request.findById(id);
    if (!request) throw new Error("Request not found");

    return request;
  }

  @Mutation(() => String)
  @UseMiddleware(RateLimit(10))
  async createRequest(@Arg("params") params: RequestInput) {
    const errors = getValidationErrors(params, requestSchema);
    if (errors) throw new Error(JSON.stringify(errors));

    const request = await Request.create(params);
    return Promise.all([
      request.sendNotificationToAdmin(),
      request.sendConfirmationEmail(),
    ])
      .then(() => "Success")
      .catch((error) => {
        throw new Error(error.message);
      });
  }

  @Mutation(() => String)
  @UseMiddleware(IsAdmin)
  async replyRequest(@Arg("params") { id, message }: ReplyInput) {
    if (!Types.ObjectId.isValid(id)) throw new Error("Invalid ObjectID");

    const request = await Request.findById(id);
    if (!request) throw new Error("Request not found");

    try {
      await request.sendReplyEmail(message);
    } catch (error) {
      throw new Error(error.message);
    }

    await request.updateOne({ replied: true });
    return "Success";
  }

  @Mutation(() => String)
  @UseMiddleware(IsAdmin)
  async deleteRequest(@Arg("id") id: string) {
    if (!Types.ObjectId.isValid(id)) throw new Error("Invalid ObjectID");

    const request = await Request.findById(id);
    if (!request) throw new Error("Request not found");

    if (!request.replied)
      throw new Error("Please reply to this request before deleting");

    await request.deleteOne();
    return "Success";
  }

  @Mutation(() => String)
  @UseMiddleware(IsAdmin)
  async deleteRequests(@Arg("ids", () => [String]) ids: string[]) {
    if (!ids.length) throw new Error("Please provide some ids");

    const areAllObjectIds = ids.every((id) => Types.ObjectId.isValid(id));
    if (!areAllObjectIds) throw new Error("Invalid ObjectID");

    const requests = await Request.find({ _id: ids });
    if (requests.length !== ids.length)
      throw new Error("Some requests are not found");

    const haveAllBeenReplied = requests.every((request) => request.replied);
    if (!haveAllBeenReplied)
      throw new Error("Please reply to all unreplied requests before deleting");

    await await Request.deleteMany({ _id: ids });
    return "Success";
  }
}
