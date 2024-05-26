import { Request, Response, NextFunction } from "express";
import UserModel, { IUser } from "../models/user.model";
import CustomResponse from "./responseActions";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";

const envPath = path.resolve(__dirname, "../../.env");
dotenv.config({ path: envPath });

export interface CustomRequest extends Request {
  user: IUser | null;
}

export const generateJWTToken = async (
  id: string,
  expiryTime: string
): Promise<string> => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "", {
    expiresIn: expiryTime,
  });
};

export const isAuthenticatedUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    // console.log(actualToken,'acutal');
    const token: any = req.headers.authorization;

    if (!token) {
      return CustomResponse.error(res, "Please login!");
    }
    const parts = token?.split(" ");

    // Extract the actual token text (excluding the "Bearer" prefix)
    const actualToken = parts[1];

    const decodedData: any = jwt.verify(
      actualToken,
      process.env.JWT_SECRET as string
    );

    (req as CustomRequest).user = await UserModel.findById(decodedData.id);

    next();
  } catch (error: any) {
    if (error.name === "JsonWebTokenError") {
      console.log(error);
      return CustomResponse.unauthorized(res, "unauthorized access!");
    }
    if (error.name === "TokenExpiredError") {
      console.log(error);
      return CustomResponse.fail(res, "sesson expired try sign in!", null);
    }

    console.log(error);
    CustomResponse.error(res, error.message, null);
  }
};

export const verifyAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let { role } = (req as CustomRequest).user as IUser;
  if (role == "Admin") {
    next();
  } else {
    CustomResponse.unauthorized(res, "You are not authorized to access API");
  }
};

export const verifyUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let { role } = (req as CustomRequest).user as IUser;
  if (role == "User") {
    next();
  } else {
    CustomResponse.unauthorized(res, "You are not authorized to access API");
  }
};

export const isAdminOrSubscribedUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let user = (req as CustomRequest).user as IUser;

  if (user.role === "Admin") {
    next();
  }
  if (
    user.subscription_status === true &&
    user.expiration_date &&
    user.expiration_date > new Date()
  ) {
    next();
  } else {
    CustomResponse.unauthorized(
      res,
      "You do not have any plan to access this API, please buy a plan"
    );
  }
};
