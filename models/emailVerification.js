import mongoose from "mongoose";

const verificationTokenSchema = new mongoose.Schema({
  userId: {
    type: String,
    require: true,
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

const VerificationToken = mongoose.model(
  "SocialVerification",
  verificationTokenSchema
);

export default VerificationToken;
