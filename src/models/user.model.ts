import { Schema, model, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  address: string;
  role: string;
  mobile: string;
  profilePicture: string;
  token: string;
  subscription_status: boolean;
  current_plan: { plan: Schema.Types.ObjectId; type: String } | null; // Reference to the Plan schema
  purchase_date: Date;
  expiration_date: Date;
  transactions: Schema.Types.ObjectId[];
  comparePassword(password: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true, select: false },
  address: { type: String, unique: true, sparse: true },
  role: { type: String, enum: ["User", "Admin"], default: "User" },
  mobile: { type: String },
  profilePicture: { type: String },
  token: { type: String },
  subscription_status: { type: Boolean, required: true, default: false },
  current_plan: {
    plan: { type: Schema.Types.ObjectId, ref: "Plan" },
    type: { type: String, enum: ["monthly", "yearly"] }, // Assuming you want to store plan type
  }, // Reference to the Plan schema
  purchase_date: { type: Date },
  expiration_date: { type: Date },
  transactions: [{ type: Schema.Types.ObjectId, ref: "Transaction" }],
});

//Save password
userSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }

  this.password = await bcrypt.hash(this.password, 10);
});

// Compare Password
userSchema.methods.comparePassword = async function (
  password: string
): Promise<boolean> {
  return await bcrypt.compare(password, this.password);
};

const UserModel = model<IUser>("User", userSchema);

export default UserModel;
