import { ExpressContext } from "apollo-server-express";
import bcrypt from "bcrypt";
import {
  Arg,
  Args,
  ArgsType,
  Ctx,
  Field,
  Mutation,
  Resolver,
  UseMiddleware,
} from "type-graphql";

import { APP_TOKEN_SECRET } from "../config";
import {
  getValidationErrors,
  loginSchema,
  registerSchema,
} from "../utils/validation";
import { UserType } from "../objectTypes/user";
import { User } from "../models";
import { validateToken } from "../utils/tokens";
import { clearCookiesResponse, cookieResponse } from "../utils/helpers";
import { RateLimit } from "../middlewares/auth";

@ArgsType()
class LoginArgs {
  @Field()
  email: string;

  @Field()
  password: string;

  @Field({ nullable: true })
  asAdmin: boolean;
}

@ArgsType()
class RegisterArgs extends LoginArgs {
  @Field()
  firstname: string;

  @Field()
  lastname: string;
}

@Resolver()
export class AuthResolver {
  @Mutation(() => UserType)
  @UseMiddleware(RateLimit(20))
  async login(@Args() args: LoginArgs, @Ctx() { res }: ExpressContext) {
    const errors = getValidationErrors(args, loginSchema);
    if (errors) throw new Error(JSON.stringify(errors));

    let user = await User.findOne({ email: args.email })
      .populate("carts")
      .populate("favourites");
    if (!user) {
      throw new Error("Invalid Email or Password");
    }

    const isSamePassword = await bcrypt.compare(args.password, user.password);
    if (!isSamePassword) {
      throw new Error("Invalid Email or Password");
    }

    if (!user.isEmailVerified) {
      throw new Error("Please verify your email address");
    }

    if (args.asAdmin && user.role.toLowerCase() !== "admin") {
      throw new Error("You are not an admin");
    }

    cookieResponse({ res, user });

    return user;
  }

  @Mutation(() => String)
  async logout(@Ctx() { res }: ExpressContext) {
    clearCookiesResponse(res);
    return "Success";
  }

  @Mutation(() => String)
  @UseMiddleware(RateLimit(10))
  async register(@Args() args: RegisterArgs) {
    const errors = getValidationErrors(args, registerSchema);
    if (errors) throw new Error(JSON.stringify(errors));

    const hashedPassword = await bcrypt.hash(args.password, 15);

    try {
      const user = await User.create({ ...args, password: hashedPassword });
      await user.sendVerificationEmail();
      return "Success";
    } catch (error) {
      throw new Error(
        JSON.stringify({ email: "A user with this email already exists" })
      );
    }
  }

  @Mutation(() => UserType)
  @UseMiddleware(RateLimit(10))
  async resetPassword(
    @Arg("token") token: string,
    @Arg("password") password: string,
    @Ctx() { res }: ExpressContext
  ) {
    const decoded = validateToken({ token, secret: APP_TOKEN_SECRET });
    if (!decoded) throw new Error("Invalid or expired token");

    const user = await User.findById(decoded._id)
      .populate("carts")
      .populate("favourites");
    if (!user) throw new Error("User not found");

    user.password = await bcrypt.hash(password, 15);
    await user.save();

    cookieResponse({ res, user });

    return user;
  }

  @Mutation(() => String)
  @UseMiddleware(RateLimit(10))
  async resendVerificationMail(@Arg("email") email: string) {
    let user = await User.findOne({ email });
    if (!user) throw new Error("User not found");

    if (user.isEmailVerified) throw new Error("Account is already verified");

    try {
      await user.sendVerificationEmail();
      return "Success";
    } catch (error) {
      throw new Error(error.message);
    }
  }

  @Mutation(() => String)
  @UseMiddleware(RateLimit(10))
  async sendPasswordResetMail(@Arg("email") email: string) {
    let user = await User.findOne({ email });
    if (!user) throw new Error("User not found");

    try {
      await user.sendPasswordResetEmail();
      return "Success";
    } catch (error) {
      throw new Error(error.message);
    }
  }

  @Mutation(() => UserType)
  @UseMiddleware(RateLimit(10))
  async verifyEmail(
    @Arg("token") token: string,
    @Ctx() { res }: ExpressContext
  ) {
    const decoded = validateToken({ token, secret: APP_TOKEN_SECRET });
    if (!decoded) throw new Error("Invalid or expired token");

    const user = await User.findById(decoded._id)
      .populate("carts")
      .populate("favourites");
    if (!user) throw new Error("User not found");

    if (user.isEmailVerified) throw new Error("Account is already verified");

    user.isEmailVerified = true;
    await user.save();

    cookieResponse({ res, user });

    return user;
  }
}
