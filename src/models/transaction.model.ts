import { Schema, model, Document } from "mongoose";

export interface ITransaction extends Document {
  user: Schema.Types.ObjectId;
  hash: string;
  purchase_date: Date;
  expiration_date: Date;
  plan: { plan: Schema.Types.ObjectId; type: String };
  isVerified: boolean;
}

const transactionSchema: Schema<ITransaction> = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  hash: {
    type: String,
    required: true,
  },
  purchase_date: {
    type: Date,
    required: true,
  },
  expiration_date: {
    type: Date,
    required: true,
  },
  isVerified: { type: Boolean, required: true, default: false },
  plan: {
    plan: {
      type: Schema.Types.ObjectId,
      ref: "Plan", // Reference to the Plan schema
      required: true,
    },
    type: { type: String, enum: ["monthly", "yearly"], required: true },
  },
});

export const TransactionModel = model<ITransaction>(
  "Transaction",
  transactionSchema
);
