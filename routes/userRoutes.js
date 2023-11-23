import express from "express";
import path from "path";
import {
  acceptRequest,
  changePassword,
  friendRequest,
  getFriendRequest,
  getUser,
  profileViews,
  requestPasswordReset,
  resetPassword,
  suggestedFriends,
  updateUser,
  verifyEmail,
} from "../controllers/userController.js";
import { resetPasswordLink } from "../utils/sendEmail.js";
import userAuth from "../middleware/authMiddleware.js";
import FriendRequest from "../models/friendRequests.js";

const router = express.Router();
const __dirname = path.resolve(path.dirname(""));

router.get("/verify/:userId/:token", verifyEmail);

router.get("/verified", (req, res) => {
  res.sendFile(path.join(__dirname, "./server/../views/verifiedpage.html"));
});

//password reset
router.post("/request-passwordreset", requestPasswordReset);
router.get("/reset-password/:userId/:token", resetPassword);
router.post("/reset-password", changePassword);

router.get("/resetpassword", (req, res) => {
  res.sendFile(
    path.join(__dirname, "./server/../views/passwordresetpage.html")
  );
});

//user routes
router.post("/get-user/:id?", userAuth, getUser);
router.put("/update-user", userAuth, updateUser);

// friend request
router.post("/friend-request", userAuth, friendRequest);
router.post("/get-friend-request", userAuth, getFriendRequest);

//accet / deny request
router.post("/accept-request", userAuth, acceptRequest);

//view profile
router.post("/profile-view", userAuth, profileViews);

//suggested friends
router.post("/suggested-friends", userAuth, suggestedFriends);

export default router;
