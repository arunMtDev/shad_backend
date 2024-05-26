import express from "express";
import { isAuthenticatedUser, verifyAdmin } from "../middleware/validation";
import { getTransactions } from "../controller/transaction.controler";

const router = express.Router();

router.get("/", isAuthenticatedUser, verifyAdmin, getTransactions);

export default router;
