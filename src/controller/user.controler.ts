import { NextFunction, Request, RequestHandler, Response } from "express";
import UserModel, { IUser } from "../models/user.model";
import CustomResponse from "../middleware/responseActions";
import { generateJWTToken } from "../middleware/validation";
import jwt, { JwtPayload } from "jsonwebtoken";

import Joi from "joi";

import fs from "fs";
import { v2 as cloudinary } from "cloudinary";

import dotenv from "dotenv";
import path from "path";
import { sendForgotPasswordEmail } from "../middleware/nodemailer";
import { scheduleTransactionVerificationCheck } from "../services/cronJob.services";
import { IPlan, PlanModel } from "../models/plan.model";
import { TransactionModel } from "../models/transaction.model";

const envPath = path.resolve(__dirname, "../../.env");
dotenv.config({ path: envPath });

interface CustomRequest extends Request {
  user: IUser | null;
}

cloudinary.config({
  cloud_name: process.env.cloudinary_cloud_name,
  api_key: process.env.cloudinary_api_key,
  api_secret: process.env.cloudinary_api_secret,
});

interface CustomFileRequest extends Request {
  files?: any;
}

const COOKIE_EXPIRE_TIME: any = process.env.COOKIE_EXPIRE || 1;

const options = {
  expires: new Date(Date.now() + COOKIE_EXPIRE_TIME * 24 * 60 * 60 * 1000),
  httpOnly: true,
  secure: true,
};

export const getUsers: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let filter: any = { ...req.query, role: { $ne: "Admin" } };
    const users = await UserModel.find(filter).populate({ path: 'current_plan.plan', model: 'Plan' });
    CustomResponse.success(res, "Users fetched successfully", users);
  } catch (error) {
    console.error("Error fetching users:", error);
    CustomResponse.error(res, "Failed to fetch users", error);
  }
};

export const createUserWithEmail: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const createUserSchema = Joi.object({
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
    const { error, value } = createUserSchema.validate(req.body);
    if (error) {
      return CustomResponse.error(res, "Validation error", error.details);
    }

    const newUser = await UserModel.create(req.body);
    const authToken = await generateJWTToken(newUser._id, "1d");

    res.cookie("token", authToken, options);
    res.cookie("loggedIn", true, {
      expires: new Date(Date.now() + COOKIE_EXPIRE_TIME * 24 * 60 * 60 * 1000), // Set expiration date
      httpOnly: false, // Make the cookie accessible only via HTTP (not accessible via JavaScript)
    });

    CustomResponse.success(res, "User created successfully", newUser);
  } catch (error) {
    console.error("Error creating user:", error);
    CustomResponse.error(res, "Failed to create user", error);
  }
};

export const getUserById: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as CustomRequest).user!._id;
    const user = await UserModel.findById(userId).populate({ path: 'current_plan.plan', model: 'Plan' });
    if (!user) {
      return CustomResponse.notFound(res, "User not found");
    }
    CustomResponse.success(res, "User details fetched successfully", user);
  } catch (error) {
    console.error("Error fetching user details:", error);
    CustomResponse.error(res, "Failed to fetch user details", error);
  }
};

export const uploadProfilePicture: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as CustomRequest).user!._id;

    let avatar: string;

    if ((req as CustomFileRequest).files !== undefined) {
      if (!fs.existsSync("public/uploads")) {
        fs.mkdirSync("public/uploads", { recursive: true });
      }

      const { files } = req as CustomFileRequest;

      if (files && files["profilePicture"]) {
        const profilePictureFile = files["profilePicture"];

        const profilePictureFileName = profilePictureFile.name + Date.now();

        fs.writeFileSync(
          `public/uploads/${profilePictureFileName}`,
          profilePictureFile.data
        );

        const profilePictureUpload = await cloudinary.uploader.upload(
          `public/uploads/${profilePictureFileName}`
        ); // Upload logo to Cloudinary

        avatar = profilePictureUpload.secure_url;

        fs.unlinkSync(`public/uploads/${profilePictureFileName}`); // deleting the logo file
      }
    }

    if (avatar!) {
      const updatedUser = await UserModel.findByIdAndUpdate(
        userId,
        { profilePicture: avatar },
        {
          new: true,
        }
      );
      if (!updatedUser) {
        return CustomResponse.notFound(res, "User not found");
      }
      return CustomResponse.success(
        res,
        "Profile picture updated successfully",
        updatedUser
      );
    } else {
      return CustomResponse.fail(res, "Please uplaod a file");
    }
  } catch (error) {
    console.error("Error updating user profile picture:", error);
    CustomResponse.error(res, "Failed to update user profile picture", error);
  }
};

export const deleteProfilePicture: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as CustomRequest).user!._id;

    const user = await UserModel.findById(userId);

    if (!user) {
      return CustomResponse.notFound(res, "User not found"); // Handle user not found
    }

    if (!user.profilePicture) {
      return CustomResponse.notFound(
        res,
        "User does not have a profile picture"
      );
    }

    user.profilePicture = "";
    await user.save();
    CustomResponse.success(
      res,
      "User's profile picture deleted successfully",
      null
    );
  } catch (error) {
    console.error("Error deleting user's profile picture:", error);
    CustomResponse.error(res, "Failed to delete user's profile picture", error);
  }
};

export const updateUser: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const updateUserSchema = Joi.object({
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
    const { error, value } = updateUserSchema.validate(req.body);
    if (error) {
      return CustomResponse.error(res, "Validation error", error.details);
    }

    const userId = (req as CustomRequest).user!._id;
    const userData: IUser = req.body;

    if ("role" in userData && userData.role === "Admin") {
      return CustomResponse.error(
        res,
        "You are not authorized to modify the role"
      );
    }

    const updatedUser = await UserModel.findByIdAndUpdate(userId, userData, {
      new: true,
    });
    if (!updatedUser) {
      return CustomResponse.notFound(res, "User not found");
    }
    CustomResponse.success(res, "User updated successfully", updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    CustomResponse.error(res, "Failed to update user", error);
  }
};

export const loginUser: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const loginUserSchema = Joi.object({
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
    const { error } = loginUserSchema.validate(req.body);
    if (error) {
      return CustomResponse.error(res, "Validation error", error.details);
    }

    const { email, password } = req.body;

    const user = await UserModel.findOne({
      email,
    })
      .select(["+password"])
      // .populate("current_plan.plan");
      .populate({ path: "current_plan.plan.plan", model: "Plan" });
    if (!user) {
      return CustomResponse.notFound(res, "User not found");
    }
    if (user && (await user.comparePassword(password))) {
      const authToken = await generateJWTToken(user._id, "1d");

      console.log(authToken, "token");

      // res.cookie("token", authToken, options);
      // res.cookie("loggedIn", true, {
      //   expires: new Date(
      //     Date.now() + COOKIE_EXPIRE_TIME * 24 * 60 * 60 * 1000
      //   ), // Set expiration date
      //   httpOnly: false, // Make the cookie accessible only via HTTP (not accessible via JavaScript)
      // });

      (req as CustomRequest).user = user;

      user.token = authToken;

      return CustomResponse.success(res, "User logged in successfully", user);
    }
    return CustomResponse.error(res, "Invalid Credentials!", null);
  } catch (error) {
    console.error("Error while login user:", error);
    CustomResponse.error(res, "Failed to login user", error);
  }
};

export const logoutUser: RequestHandler = async (
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
    //   ),
    //   httpOnly: false,
    // });
    CustomResponse.success(res, "User logged out successfully", null);
  } catch (error) {
    console.error("Error logging out user:", error);
    CustomResponse.error(res, "Failed to log out user", error);
  }
};

export const forgotPassword: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const forgotPasswordSchema = Joi.object({
    email: Joi.string().email().required(),
  });

  try {
    const { error, value } = forgotPasswordSchema.validate(req.body);
    if (error) {
      return CustomResponse.error(res, "Validation error", error.details);
    }
    const user: IUser | null = await UserModel.findOne({
      email: value.email,
    });
    if (!user) {
      return CustomResponse.notFound(res, "User not found");
    }

    const token = await generateJWTToken(user._id, "10m");
    await UserModel.updateOne({ email: value.email }, { $set: { token } });

    await sendForgotPasswordEmail(user.email, token);

    CustomResponse.success(res, "Token sent sucessfully", null);
  } catch (error) {
    console.error(
      "Error while sending token for forgot password to user:",
      error
    );
    CustomResponse.error(
      res,
      "Failed to send forgotpassword token to user",
      error
    );
  }
};

export const resetPassword: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const resetPasswordSchema = Joi.object({
    password: Joi.string()
      .min(8)
      .required()
      .messages({
        "string.min": "Password must be at least 8 characters long.",
        "any.required": "Password is required.",
      })
      .regex(/[!@#$%^&*()_+{}\[\]:;<>,.?~]/)
      .message("Password must contain at least one special character.")
      .regex(/[A-Z]/)
      .message("Password must contain at least one uppercase letter.")
      .regex(/[a-z]/)
      .message("Password must contain at least one lowercase letter.")
      .regex(/\d/)
      .message("Password must contain at least one numeric digit."),
    confirmPassword: Joi.string()
      .valid(Joi.ref("password"))
      .required()
      .messages({
        "any.only": "Both password and confirm password should match.",
        "any.required": "Confirm password is required.",
      }),
  });

  try {
    const { error } = resetPasswordSchema.validate(req.body);
    if (error) {
      return CustomResponse.error(res, "Validation error", error.details);
    }

    const { password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return CustomResponse.error(res, "Passwords do not match.", null);
    }

    const token = req.query.token as string;

    if (!token) {
      return CustomResponse.error(
        res,
        "Token not provided in the request.",
        null
      );
    }
    const user = await UserModel.findOne({ token });

    if (!user) {
      return CustomResponse.unauthorized(
        res,
        "You are not allowed to reset password"
      );
    }

    const decodedToken = jwt.decode(token) as JwtPayload;
    const decodedTokenIAT: any = decodedToken.iat;
    const decodedTokenEXP: any = decodedToken.exp;

    if (!decodedToken || decodedTokenIAT + 600 < decodedTokenEXP) {
      return CustomResponse.unauthorized(res, "Token expired or invalid.");
    }

    user.password = password;
    user.token = "";
    await user.save();

    CustomResponse.success(res, "Password reset successfully.", null);
  } catch (error) {
    console.error("Error while resetting password:", error);
    CustomResponse.error(res, "Failed to reset password.", error);
  }
};

// export const saveTransactionHashes: RequestHandler = async (req, res, next) => {
//   const transactionHashSchema = Joi.object({
//     txHash: Joi.string().required(),
//     planId: Joi.string().required(),
//   });

//   try {
//     const { error } = transactionHashSchema.validate(req.body);
//     if (error) {
//       return CustomResponse.error(res, "Validation error", error.details);
//     }

//     const { txHash, planId } = req.body;

//     const userId = (req as any).user._id;
//     const user: IUser | null = await UserModel.findById(userId);

//     if (!user) {
//       return CustomResponse.notFound(res, "User not found");
//     }

//     const plan: IPlan | null = await PlanModel.findById(planId);
//     if (!plan) {
//       return CustomResponse.notFound(res, "Plan not found");
//     }

//     const purchaseDate = new Date(Date.now());
//     const expirationDate = new Date(purchaseDate);
//     expirationDate.setDate(expirationDate.getDate() + plan.days);

//     const transactionData = {
//       user: userId,
//       hash: txHash,
//       purchase_date: purchaseDate,
//       expiration_date: expirationDate,
//       plan: planId,
//       isVerified: false,
//     };

//     const newTransaction = new TransactionModel(transactionData);
//     await newTransaction.save();

//     user.transactions.push(newTransaction._id);
//     await user.save();

//     CustomResponse.success(res, "Transaction hash saved successfully");
//   } catch (error) {
//     console.error("Error saving user's transaction hashes:", error);
//     CustomResponse.error(
//       res,
//       "Failed to save user's transaction hashes",
//       error
//     );
//   }
// };

export const saveTransactionHashes: RequestHandler = async (req, res, next) => {
  const transactionHashSchema = Joi.object({
    txHash: Joi.string().required(),
    planId: Joi.string().required(),
    purchaseType: Joi.string().valid("monthly", "yearly").required(),
  });

  try {
    const { error } = transactionHashSchema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json({ error: "Validation error", details: error.details });
    }

    const { txHash, planId, purchaseType } = req.body;

    const userId = (req as any).user._id;
    const user: IUser | null = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const plan: IPlan | null = await PlanModel.findById(planId);
    if (!plan) {
      return res.status(404).json({ error: "Plan not found" });
    }

    const purchaseDate = new Date();
    let expirationDate = new Date(purchaseDate);

    if (purchaseType === "monthly") {
      expirationDate.setMonth(expirationDate.getMonth() + 1);
    } else if (purchaseType === "yearly") {
      expirationDate.setFullYear(expirationDate.getFullYear() + 1);
    }

    const transactionData = {
      user: userId,
      hash: txHash,
      purchase_date: purchaseDate,
      expiration_date: expirationDate,
      plan: {plan: planId, type: purchaseType},
      isVerified: false,
    };

    const newTransaction = new TransactionModel(transactionData);
    await newTransaction.save();

    user.transactions.push(newTransaction._id);
    await user.save();

    res.status(200).json({ message: "Transaction hash saved successfully" });
  } catch (error) {
    console.error("Error saving user's transaction hashes:", error);
    res.status(500).json({ error: "Failed to save user's transaction hashes" });
  }
};
