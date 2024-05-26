import { NextFunction, Request, RequestHandler, Response } from "express";
import UserModel, { IUser } from "../models/user.model";
import CustomResponse from "../middleware/responseActions";
import { generateJWTToken } from "../middleware/validation";

import Joi from "joi";

import dotenv from "dotenv";
import path from "path";

const envPath = path.resolve(__dirname, "../../.env");
dotenv.config({ path: envPath });

interface CustomRequest extends Request {
  user: IUser | null;
}

const COOKIE_EXPIRE_TIME: any = process.env.COOKIE_EXPIRE || 1;

const options = {
  expires: new Date(Date.now() + COOKIE_EXPIRE_TIME * 24 * 60 * 60 * 1000),
  httpOnly: true,
  secure:true
};

export const createAdmin: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const createAdminSchema = Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string()
      .min(8)
      .message("Password must be at least 8 characters long.")
      .pattern(new RegExp(/[!@#$%^&*()_+{}\[\]:;<>,.?~]/))
      .message("Password must contain at least one special character.")
      .pattern(new RegExp(/[A-Z]/))
      .message("Password must contain at least one uppercase letter.")
      .pattern(new RegExp(/[a-z]/))
      .message("Password must contain at least one lowercase letter.")
      .pattern(new RegExp(/\d/))
      .message("Password must contain at least one numeric digit.")
      .required(),
  });

  try {
    const { error, value } = createAdminSchema.validate(req.body);
    if (error) {
      return CustomResponse.error(res, "Validation error", error.details);
    }

    const userData: IUser = req.body;
    userData.role = "Admin";
    const newUser = await UserModel.create(req.body);
    const authToken = await generateJWTToken(newUser._id, "1d");

    res.cookie("token", authToken, options);

    CustomResponse.success(res, "Admin created successfully", newUser);
  } catch (error) {
    console.error("Error creating admin:", error);
    CustomResponse.error(res, "Failed to create admin", error);
  }
};

export const getAdmin: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as CustomRequest).user!._id;
    const user = await UserModel.findById(userId);
    if (!user) {
      return CustomResponse.notFound(res, "Admin not found");
    }
    CustomResponse.success(res, "Admin details fetched successfully", user);
  } catch (error) {
    console.error("Error fetching admin details:", error);
    CustomResponse.error(res, "Failed to fetch admin details", error);
  }
};

export const updateAdmin: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const updateAdminSchema = Joi.object({
    firstName: Joi.string(),
    lastName: Joi.string(),
    email: Joi.string().email(),
    password: Joi.string()
      .min(8)
      .message("Password must be at least 8 characters long.")
      .pattern(new RegExp(/[!@#$%^&*()_+{}\[\]:;<>,.?~]/))
      .message("Password must contain at least one special character.")
      .pattern(new RegExp(/[A-Z]/))
      .message("Password must contain at least one uppercase letter.")
      .pattern(new RegExp(/[a-z]/))
      .message("Password must contain at least one lowercase letter.")
      .pattern(new RegExp(/\d/))
      .message("Password must contain at least one numeric digit."),
    mobile: Joi.string(),
  });
  try {
    const { error, value } = updateAdminSchema.validate(req.body);
    if (error) {
      return CustomResponse.error(res, "Validation error", error.details);
    }

    const userId = (req as CustomRequest).user!._id;
    const userData: IUser = req.body;

    const updatedUser = await UserModel.findByIdAndUpdate(userId, userData, {
      new: true,
    });
    if (!updatedUser) {
      return CustomResponse.notFound(res, "Admin not found");
    }
    CustomResponse.success(res, "Admin updated successfully", updatedUser);
  } catch (error) {
    console.error("Error updating admin:", error);
    CustomResponse.error(res, "Failed to update admin", error);
  }
};

export const loginAdmin: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const loginAdminSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string()
      .min(8)
      .message("Password must be at least 8 characters long.")
      .pattern(new RegExp(/[!@#$%^&*()_+{}\[\]:;<>,.?~]/))
      .message("Password must contain at least one special character.")
      .pattern(new RegExp(/[A-Z]/))
      .message("Password must contain at least one uppercase letter.")
      .pattern(new RegExp(/[a-z]/))
      .message("Password must contain at least one lowercase letter.")
      .pattern(new RegExp(/\d/))
      .message("Password must contain at least one numeric digit.")
      .required(),
  });
  try {
    const { error } = loginAdminSchema.validate(req.body);
    if (error) {
      return CustomResponse.error(res, "Validation error", error.details);
    }

    const { email, password } = req.body;

   
    const user: IUser = await UserModel.findOne({
      email,
    }).select(["+password"]);
    if (!user) {
      return CustomResponse.notFound(res, "Admin not found");
    }
    if (user && (await user.comparePassword(password))) {
      const authToken = await generateJWTToken(user._id, "1d");

      // res.cookie("token", authToken, options);
      // res.cookie("loggedIn", true, {
      //   expires: new Date(
      //     Date.now() + COOKIE_EXPIRE_TIME * 24 * 60 * 60 * 1000
      //   ), // Set expiration date
      //   httpOnly: false, // Make the cookie accessible only via HTTP (not accessible via JavaScript)
      // });

      (req as CustomRequest).user = user;
      user.token = authToken;

      return CustomResponse.success(res, "Admin logged in successfully", user);
    }
    return CustomResponse.error(res, "Invalid Credentials!", null);
  } catch (error) {
    console.error("Error while login admin:", error);
    CustomResponse.error(res, "Failed to login admin", error);
  }
};

export const logoutAdmin: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // res.cookie("token", null, {
    //   expires: new Date(Date.now()),
    //   httpOnly: true,
    // });
    // res.cookie("loggedIn", null, {
    //   expires: new Date(
    //     Date.now() + COOKIE_EXPIRE_TIME * 24 * 60 * 60 * 1000
    //   ), // Set expiration date
    //   httpOnly: false, // Make the cookie accessible only via HTTP (not accessible via JavaScript)
    // });

    CustomResponse.success(res, "Admin logged out successfully", null);
  } catch (error) {
    console.error("Error logging out admin:", error);
    CustomResponse.error(res, "Failed to log out admin", error);
  }
};
