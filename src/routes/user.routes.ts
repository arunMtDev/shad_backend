import express from "express";
import {
  // addOtherDetails,
  // createUserWithAddress,
  createUserWithEmail,
  deleteProfilePicture,
  // deleteProfilePictureUsingAdd,
  forgotPassword,
  // getUserByAddress,
  getUserById,
  getUsers,
  loginUser,
  logoutUser,
  resetPassword,
  saveTransactionHashes,
  updateUser,
  uploadProfilePicture,
  // uploadProfilePictureUsingAdd,
} from "../controller/user.controler";
import { isAuthenticatedUser, verifyAdmin } from "../middleware/validation";
const router = express.Router();

router.post("/createWithEmail", createUserWithEmail);
router.get("/me", isAuthenticatedUser, getUserById);
router.put("/update", isAuthenticatedUser, updateUser);
router.post("/login", loginUser);
router.get("/logout", isAuthenticatedUser, logoutUser);

router.put("/addAvatar", isAuthenticatedUser, uploadProfilePicture);
router.delete("/avatar", isAuthenticatedUser, deleteProfilePicture);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// user with address
// router.post("/createWithAddress", createUserWithAddress);
// router.post("/addCredentils", addOtherDetails); // query address
// router.get("/userByAddress", getUserByAddress); // query address

// router.put("/addAvatarByAdd", uploadProfilePictureUsingAdd);
// router.delete("/avatarByAdd", deleteProfilePictureUsingAdd);

//admin
router.get("/", isAuthenticatedUser, verifyAdmin, getUsers);

router.post("/subscription/hash", isAuthenticatedUser, saveTransactionHashes);

export default router;
