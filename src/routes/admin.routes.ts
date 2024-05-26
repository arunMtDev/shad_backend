import express from "express";

import { isAuthenticatedUser, verifyAdmin } from "../middleware/validation";
import {
  createAdmin,
  getAdmin,
  loginAdmin,
  logoutAdmin,
  updateAdmin,
} from "../controller/admin.controler";
const router = express.Router();

router.post("/create", createAdmin);
router.get("/me", isAuthenticatedUser, verifyAdmin, getAdmin);
router.put("/update", isAuthenticatedUser, verifyAdmin, updateAdmin);
router.post("/login", loginAdmin);
router.get("/logout", isAuthenticatedUser, verifyAdmin, logoutAdmin);

export default router;
