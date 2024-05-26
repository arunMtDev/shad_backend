import express from "express";

import {
  isAdminOrSubscribedUser,
  isAuthenticatedUser,
  verifyAdmin,
} from "../middleware/validation";
import {
  getAllCollectionData,
  getChartsData,
  getPopularCollectionData,
} from "../controller/magicEden.controler";
const router = express.Router();

// i also have to add a middelware to check wheathe the user has subscription to see all the collections
router.get("/popular-collections", getPopularCollectionData); //window and limit in query
router.get(
  "/collections",
  isAuthenticatedUser,
  isAdminOrSubscribedUser,
  getAllCollectionData
); // window and limit in query
router.get(
  "/charts-data/:symbol",
  //  isAuthenticatedUser,
  getChartsData
); // timeframe in query


export default router;
