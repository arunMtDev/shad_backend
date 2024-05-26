import { Schema, model, Document } from "mongoose";

export interface IPlan extends Document {
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
}

const planSchema: Schema<IPlan> = new Schema({
  name: { type: String, required: true, unique: true },
  description: {type: String, required: true},
  monthlyPrice: { type: Number, required: true },
  yearlyPrice: { type: Number, required: true },
});

export const PlanModel = model<IPlan>("Plan", planSchema);
