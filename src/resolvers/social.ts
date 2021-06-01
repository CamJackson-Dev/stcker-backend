import { ExpressContext } from "apollo-server-express";
import { Args, ArgsType, Ctx, Field, Mutation, Resolver } from "type-graphql";
import { TokenPayload } from "google-auth-library";

import { GOOGLE_CLIENT_ID } from "../config";
import { UserType } from "../objectTypes/user";
import { User } from "../models";
import { cookieResponse, createGoogleOauthClient } from "../utils/helpers";
import { IUser } from "../models/user";
@ArgsType()
class GoogleArgs {
  @Field()
  tokenId: string;

  @Field({ nullable: true })
  asAdmin?: boolean;
}

@Resolver()
export class AuthResolver {
  @Mutation(() => UserType)
  async googleLogin(
    @Args() { tokenId, asAdmin }: GoogleArgs,
    @Ctx() { res }: ExpressContext
  ) {
    const payload = await getPayloadFromGoogleIdToken(tokenId);

    const user = await User.findOne({ email: payload.email })
      .populate("carts")
      .populate("favourites");
    if (!user) {
      throw new Error("User not found");
    }

    if (asAdmin && user.role.toLowerCase() !== "admin") {
      throw new Error("You are not an admin");
    }

    if (!user.isEmailVerified) {
      user.isEmailVerified = true;
      await user.save();
    }

    cookieResponse({ res, user });

    return user;
  }

  @Mutation(() => UserType)
  async googleSignUp(
    @Ctx() { res }: ExpressContext,
    @Args() { tokenId }: GoogleArgs
  ) {
    const { email, given_name, family_name, email_verified } =
      await getPayloadFromGoogleIdToken(tokenId);

    let user: IUser;
    if (email_verified) {
      try {
        user = await User.create({
          email,
          firstname: given_name,
          lastname: family_name,
          isEmailVerified: true,
        });
      } catch (error) {
        console.log(error);

        throw new Error("A user with this email already exists");
      }
    } else {
      throw new Error("Please verify your email address");
    }

    cookieResponse({ res, user });

    return user;
  }
}

async function getPayloadFromGoogleIdToken(idToken: string) {
  let payload: TokenPayload | undefined;
  try {
    const client = createGoogleOauthClient();
    const ticket = await client.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch (error) {
    throw new Error(error.message.split(":")[0]);
  }

  if (!payload) {
    throw new Error("Token is not valid");
  }

  return payload;
}
