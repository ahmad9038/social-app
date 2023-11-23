import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SocialUsers",
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    image: {
      type: String,
    },
    likes: [
      {
        type: String,
      },
    ],
    comments: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SocialComments",
        },
      },
    ],
  },
  { timestamps: true }
);

const Post = mongoose.model("SocialPosts", postSchema);

export default Post;
