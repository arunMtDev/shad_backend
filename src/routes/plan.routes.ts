import express from "express";
import { isAuthenticatedUser, verifyAdmin } from "../middleware/validation";
import {
  createPlan,
  deletePlan,
  getPlans,
  updatePlan,
} from "../controller/plan.controler";
const router = express.Router();

router.post("/create", isAuthenticatedUser, verifyAdmin, createPlan);
router.get("/", isAuthenticatedUser, getPlans);
router.put("/update/:id", isAuthenticatedUser, verifyAdmin, updatePlan);
router.delete("/delete/:id", isAuthenticatedUser, verifyAdmin, deletePlan);

export default router;
