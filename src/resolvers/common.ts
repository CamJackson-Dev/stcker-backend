import { Field, InputType, Int } from "type-graphql";

@InputType()
export class PaginationArgs {
  @Field(() => Int, { nullable: true })
  perPage?: number;

  @Field(() => Int, { nullable: true })
  page?: number;
}

@InputType()
export class SortArgs {
  @Field({ nullable: true })
  field?: string;

  @Field({ nullable: true })
  order?: "ASC" | "DESC";
}

@InputType()
export class ParamsArgs {
  @Field(() => PaginationArgs, { nullable: true })
  pagination?: PaginationArgs;

  @Field(() => SortArgs, { nullable: true })
  sort?: SortArgs;
}
