import { NextFunction, Request, RequestHandler, Response } from "express";
import CustomResponse from "../middleware/responseActions";
import Joi from "joi";
import { PlanModel, IPlan } from "../models/plan.model";

export const getPlans: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let filter: any = { ...req.query };

    const plans = await PlanModel.find(filter);
    CustomResponse.success(res, "Plans fetched successfully", plans);
  } catch (error) {
    console.error("Error fetching plans:", error);
    CustomResponse.error(res, "Failed to fetch plans", error);
  }
};

export const createPlan: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const createPlanSchema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().required(),
    monthlyPrice: Joi.number().min(0).required(),
    yearlyPrice: Joi.number().min(0).required(),
  });

  try {
    const { error } = createPlanSchema.validate(req.body);
    if (error) {
      return CustomResponse.error(res, "Validation error", error.details);
    }

    const newPlan = await PlanModel.create(req.body);
    CustomResponse.success(res, "Plan created successfully", newPlan);
  } catch (error) {
    console.error("Error creating plan:", error);
    CustomResponse.error(res, "Failed to create plan", error);
  }
};

export const updatePlan: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const updatePlanSchema = Joi.object({
    name: Joi.string(),
    description: Joi.string(),
    monthlyPrice: Joi.number().min(0),
    yearlyPrice: Joi.number().min(0),
  });

  try {
    const { error } = updatePlanSchema.validate(req.body);
    if (error) {
      return CustomResponse.error(res, "Validation error", error.details);
    }

    const updatedPlan = await PlanModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedPlan) {
      return CustomResponse.error(res, "Plan not found with provided ID", null);
    }

    CustomResponse.success(res, "Plan updated successfully", updatedPlan);
  } catch (error) {
    console.error("Error updating plan:", error);
    CustomResponse.error(res, "Failed to update plan", error);
  }
};

export const deletePlan: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const deletedPlan = await PlanModel.findByIdAndDelete(req.params.id);
    if (!deletedPlan) {
      return CustomResponse.error(res, "Plan not found with provided ID", null);
    }

    CustomResponse.success(res, "Plan deleted successfully", null);
  } catch (error) {
    console.error("Error deleting plan:", error);
    CustomResponse.error(res, "Failed to delete plan", error);
  }
};
