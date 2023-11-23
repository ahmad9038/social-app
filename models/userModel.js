import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      // required: true,
    },
    profileUrl: {
      type: String,
    },
    profession: {
      type: String,
    },
    friends: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "SocialUsers",
    },
    views: {
      type: String,
    },
    verified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("SocialUsers", userSchema);

export default User;
