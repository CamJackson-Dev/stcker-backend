import { ObjectType, Field, InputType, Int } from "type-graphql";

@InputType()
export class ReplyInput {
  @Field()
  id: string;

  @Field()
  message: string;
}

@InputType()
export class RequestInput {
  @Field()
  message: string;

  @Field()
  email: string;

  @Field()
  subject: string;
}

@ObjectType("Request")
export class RequestType {
  @Field()
  _id: string;

  @Field()
  message: string;

  @Field()
  email: string;

  @Field()
  subject: string;

  @Field()
  replied: boolean;
}

@ObjectType()
export class RequestPagination {
  @Field(() => [RequestType])
  items: RequestType[];

  @Field(() => Int)
  total: number;
}
