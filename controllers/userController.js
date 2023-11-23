import mongoose from "mongoose";
import Verification from "../models/emailVerification.js";
import Users from "../models/userModel.js";
import { compareString, createJWT, hashString } from "../utils/index.js";
import PasswordReset from "../models/passwordReset.js";
import { resetPasswordLink } from "../utils/sendEmail.js";
import User from "../models/userModel.js";
import FriendRequest from "../models/friendRequests.js";

const verifyEmail = async (req, res) => {
  const { userId, token } = req.params;

  try {
    const result = await Verification.findOne({ userId });

    if (result) {
      const { expiresAt, token: hashedToken } = result;

      // token has expired
      if (expiresAt < Date.now()) {
        Verification.findOneAndDelete({ userId })
          .then(() => {
            Users.findOneAndDelete({ _id: userId })
              .then(() => {
                const message = "verification token has expired";
                res.redirect(`/users/verified?status=error&message=${message}`);
              })
              .catch((err) => {
                res.redirect("/users/verified?status=error&message=");
              });
          })
          .catch((error) => {
            console.log(error);
            res.redirect(`/users/verified?message=`);
          });
      } else {
        //token valid
        compareString(token, hashedToken)
          .then((isMatch) => {
            if (isMatch) {
              Users.findOneAndUpdate({ _id: userId }, { verified: true })
                .then(() => {
                  Verification.findOneAndDelete({ userId }).then(() => {
                    const message = "email verified successfully";
                    res.redirect(
                      `/users/verified?status=success&message=${message}`
                    );
                  });
                })
                .catch((error) => {
                  console.log(error);
                  const message = "verification failed or link is invalid";
                  res.redirect(
                    `/users/verified?status=error&message=${message}`
                  );
                });
            } else {
              const message = "verification failed or liink is invalid";
              res.redirect(`/users/verified?status=error&message=${message}`);
            }
          })
          .catch((error) => {
            console.log(error);
            res.redirect(`.users/verified?message=`);
          });
      }
    } else {
      const message = "invalid verification. link. try again later";
      res.redirect(`/users/verified?status=error&message=${message}`);
    }
  } catch (error) {
    console.log(error);
    res.redirect(`/users/verified?message=`);
  }
};

const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await Users.findOne({ email });

    if (!user) {
      return res.status(404).json({
        status: "Failed",
        message: "email address not found",
      });
    }

    const existingRequest = await PasswordReset.findOne({ email });
    if (existingRequest) {
      if (existingRequest.expiresAt > Date.now()) {
        return res.status(201).json({
          status: "pending",
          message: "reset password link has already been sent to your email",
        });
      }

      await PasswordReset.findOneAndDelete({ email });
    }

    console.log(";lakdjf");
    await resetPasswordLink(user, res);
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};

const resetPassword = async (req, res) => {
  const { userId, token } = req.params;

  try {
    const user = await Users.findById(userId);

    if (!user) {
      const message = "invalid password reset link. try again";
      res.redirect(`/users/resetpassword?status=error&message=${message}`);
      return;
    }

    const resetPassword = await PasswordReset.findOne({ userId });
    if (!resetPassword) {
      const message = "invalid password reset link. try again";
      res.redirect(`/users/resetpassword?status=error&message=${message}`);
    }

    const { expiresAt, token: resetToken } = resetPassword;

    if (expiresAt < Date.now()) {
      const message = "reset password link is expired, try again";
      res.redirect(`/users/verified?status=error&message=${message}`);
    } else {
      const isMatch = await compareString(token, resetToken);

      if (!isMatch) {
        const message = "reset password link is expired, try again";
        res.redirect(`/users/verified?status=error&message=${message}`);
      } else {
        res.redirect(`/users/resetpassword?type=reset&id=${userId}`);
      }
    }
  } catch (error) {
    console.log(error);
  }
};

const changePassword = async (req, res) => {
  try {
    const { userId, password } = req.body;

    const hashedPassword = await hashString(password);

    const user = await Users.findByIdAndUpdate(
      { _id: userId },
      { password: hashedPassword }
    );

    console.log("working fine");

    if (user) {
      await PasswordReset.findOneAndDelete({ userId });
      const message = "Password successfully reset";
      // res.redirect(`/users/resetpassword?status=success&message=${message}`);
      res.redirect("/login");
      return;
    }
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};

const getUser = async (req, res, next) => {
  try {
    const { userId } = req.body.user;
    const { id } = req.params;

    const user = await Users.findById(id ?? userId).populate({
      path: "friends",
      select: "-password",
    });

    if (!user) {
      return res.status(200).send({
        message: "user not found",
        success: false,
      });
    }

    user.password = undefined;
    res.status(200).json({
      success: true,
      user: user,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "auth error",
      success: false,
      error: error.message,
    });
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { firstName, lastName, location, profileUrl, profession } = req.body;

    if (!(firstName || lastName || location || profileUrl || profession)) {
      next("Please provide all required fields");
      return;
    }

    const { userId } = req.body.user;

    const updateUser = {
      firstName,
      lastName,
      location,
      profileUrl,
      profession,
      _id: userId,
    };

    const user = await Users.findByIdAndUpdate(userId, updateUser, {
      new: true,
    });

    await user.populate({ path: "friends", select: "-password" });
    const token = createJWT(user?._id);
    user.password = undefined;

    res.status(200).json({
      success: true,
      message: "user updated",
      user,
      token,
    });
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};

const friendRequest = async (req, res, next) => {
  console.log("userId");

  try {
    const { userId } = req.body.user;
    const { requestTo } = req.body;

    const requestExist = await FriendRequest.findOne({
      requestFrom: userId,
      requestTo,
    });

    if (requestExist) {
      next("request already sent");
      return;
    }

    const accountExist = await FriendRequest.findOne({
      requestFrom: requestTo,
      requestTo: userId,
    });

    if (accountExist) {
      next("request already send");
      return;
    }

    const newRequest = await FriendRequest.create({
      requestTo,
      requestFrom: userId,
    });

    res.status(201).json({
      success: true,
      message: "friend requet sent",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "auth error",
      success: false,
      error: error.message,
    });
  }
};

const getFriendRequest = async (req, res, next) => {
  try {
    const { userId } = req.body.user;
    const request = await FriendRequest.find({
      requestTo: userId,
      requestStatus: "pending",
    })
      .populate({
        path: "requestFrom",
        select: "firstName lastName profileUrl profession",
      })
      .limit(10)
      .sort({
        _id: -1,
      });

    res.status(200).json({
      success: true,
      data: request,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "auth error",
      success: false,
      error: error.message,
    });
  }
};

const acceptRequest = async (req, res, next) => {
  try {
    const id = req.body.user.userId;
    const { rid, status } = req.body;
    const requestExist = await FriendRequest.findById(rid);

    if (!requestExist) {
      next("no friend request found");
      return;
    }

    const newRes = await FriendRequest.findByIdAndUpdate(
      { _id: rid },
      { requestStatus: status }
    );

    if (status === "Accepted") {
      const user = await Users.findById(id);
      user.friends.push(newRes?.requestFrom);
      await user.save();
      const friend = await Users.findById(newRes?.requestFrom);
      friend.friends.push(newRes?.requestTo);
      await friend.save();
    }

    res.status(201).json({
      success: true,
      message: "Friend Request" + status,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "auth error",
      success: false,
      error: error.message,
    });
  }
};

const profileViews = async (req, res, next) => {
  try {
    const { userId } = req.body.user;
    const { id } = req.body;
    const user = await Users.findById(id);

    user.views.push(userId);
    await user.save();

    res.status(201).json({
      success: true,
      message: "Successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "auth error",
      success: false,
      error: error.message,
    });
  }
};

const suggestedFriends = async (req, res, next) => {
  try {
    const { userId } = req.body.user;
    let queryObject = {};
    queryObject._id = { $ne: userId };
    queryObject.friends = { $nin: userId };
    let queryResult = Users.find(queryObject)
      .limit(15)
      .select("firstName lastName profileUrl profession ");

    const suggestedFriends = await queryResult;

    res.status(200).json({
      success: true,
      data: suggestedFriends,
    });
  } catch (error) {}
};

export {
  verifyEmail,
  requestPasswordReset,
  resetPassword,
  changePassword,
  getUser,
  updateUser,
  friendRequest,
  getFriendRequest,
  acceptRequest,
  profileViews,
  suggestedFriends,
};
