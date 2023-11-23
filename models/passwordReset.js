import mongoose from "mongoose";

const passwordResetSchema = new mongoose.Schema({
  userId: {
    type: String,
    unique: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
  },
  token: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
});

const PasswordReset = mongoose.model(
  "SocialPasswordReset",
  passwordResetSchema
);

export default PasswordReset;
