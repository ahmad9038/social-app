import mongoose from "mongoose";

const friendRequestSchema = new mongoose.Schema({
  requestTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SocialUsers",
    required: true,
  },
  requestFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SocialUsers",
    required: true,
  },
  requestStatus: {
    type: String,
    default: "pending",
    required: true,
  },
});

const FriendRequest = mongoose.model(
  "SocialFriendRequests",
  friendRequestSchema
);

export default FriendRequest;
