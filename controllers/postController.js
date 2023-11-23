import Posts from "../models/postModel.js";
import Users from "../models/userModel.js";
import Comments from "../models/commentModel.js";

const createPost = async (req, res, next) => {
  try {
    const { userId } = req.body.user;
    const { description, image } = req.body;

    if (!description) {
      next("enter description");
      return;
    }

    const post = await Posts.create({
      userId,
      description,
      image,
    });

    res.status(200).json({
      success: true,
      message: "Post created successfully",
      data: post,
    });
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};

const getPosts = async (req, res, next) => {
  let postsRes = null;

  try {
    const { userId } = req.body.user;
    const { search } = req.body;

    const user = await Users.findById(userId);
    const friends = user?.friends?.toString().split(",") ?? [];
    friends.push(userId);

    const searchPostQuery = {
      $or: [
        {
          description: { $regex: search, $options: "i" },
        },
      ],
    };

    const posts = await Posts.find(search ? searchPostQuery : {})
      .populate({
        path: "userId",
        select: "firstName lastName location profileUrl",
      })
      .sort({ _id: -1 });

    const friendsPosts = posts?.filter((post) => {
      return friends.includes(post?.userId?._id.toString());
    });

    const otherPosts = posts?.filter(
      (post) => !friends.includes(post?.userId?._id.toString())
    );

    if (friendsPosts?.length > 0) {
      postsRes = search ? friendsPosts : [...friendsPosts, ...otherPosts];
    } else {
      postsRes = posts;
    }
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }

  res.status(200).json({
    success: true,
    message: "successfully",
    data: postsRes,
  });
};

const getPost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const post = await Posts.findById(id).populate({
      path: "userId",
      select: "firstName, lastName, location, profileUrl",
    });

    // .populate({
    //     path: "comments",
    //     populate: {
    //         path: "userId",
    //         select: "firstName lastName location profileUrl -password",
    //     },
    //     options: {
    //         sort: "-_id",
    //     }
    // }).populate({
    //     path:'comments',
    //     populate: {
    //         path: "replies.userId",
    //         select: "firstName, lastName location profileUrl -password"
    //     }
    // })

    res.status(200).json({
      success: true,
      message: "success",
      data: post,
    });
  } catch (error) {}
};

const getUserPost = async (req, res, next) => {
  const { id } = req.params;
  const post = await Posts.find({ userId: id })
    .populate({
      path: "userId",
      select: "firstName lastName location profileUrl ",
    })
    .sort({ _id: -1 });

  res.status(200).json({
    success: true,
    message: "success",
    data: post,
  });
};

const getComments = async (req, res, next) => {
  const { postId } = req.params;

  const postComments = await Comments.find({ postId })
    .populate({
      path: "userId",
      select: "firstName lastName location profileUrl ",
    })
    .populate({
      path: "replies.userId",
      select: "firstName lastName location profileUrl ",
    })
    .sort({ _id: -1 });

  res.status(200).json({
    success: true,
    message: "successful",
    data: postComments,
  });
};

const likePost = async (req, res, next) => {
  try {
    const { userId } = req.body.user;
    const { id } = req.params;

    const post = await Posts.findById(id);

    //check if post is already liked or not
    const index = post.likes.findIndex((pid) => pid === String(userId));

    if (index === -1) {
      post.likes.push(userId);
    } else {
      post.likes = post.likes.filter((pid) => pid !== String(userId));
    }

    const newPost = await Posts.findByIdAndUpdate(id, post, { new: true });

    res.status(200).json({
      sucess: true,
      message: "success",
      data: newPost,
    });
  } catch (error) {}
};

const likePostComment = async (req, res, next) => {
  const { userId } = req.body.user;
  const { id, rid } = req.params;
  let replyComments;
  try {
    if (rid === undefined || rid === null || rid === "false") {
      const comment = await Comments.findById(id);
      const index = comment.likes.findIndex((el) => el === String(userId));

      if (index === -1) {
        comment.likes.push(userId);
      } else {
        comment.likes = comment.likes.filter((i) => i !== String(userId));
      }

      const updated = await Comments.findByIdAndUpdate(id, comment, {
        new: true,
      });

      res.status(201).json(updated);
    } else {
      const replyComments = await Comments.findOne(
        {
          _id: id,
        },
        {
          replies: {
            $elemMatch: {
              _id: rid,
            },
          },
        }
      );

      const index = replyComments?.replies[0]?.likes.findIndex(
        (i) => i === String(userId)
      );

      if (index === -1) {
        replyComments.replies[0].likes.push(userId);
      } else {
        replyComments.replies[0].likes = replyComments.replies[0]?.likes.filter(
          (i) => i !== String(userId)
        );
      }
    }

    const query = { _id: id, "replies._id": rid };
    const updated = {
      $set: {
        "replies.$.likes": replyComments.replies[0].likes,
      },
    };

    const result = await Comments.updateOne(query, updated, { new: true });
    res.status(201).json(result);
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};

const commentPost = async (req, res, next) => {
  try {
    const { comment, from } = req.body;
    const { userId } = req.body.user;
    const { id } = req.params;

    if (comment === null) {
      res.status(404).json({ message: "empty message not allowed" });
      return;
    }

    const newComment = new Comments({ comment, from, userId, postId: id });
    await newComment.save();

    const post = await Posts.findById(id);
    post.comments.push(newComment._id);

    const updatedPost = await Posts.findByIdAndUpdate(id, post, { new: true });
    res.status(201).json(newComment);
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};

const replyPostComment = async (req, res, next) => {
  const { userId } = req.body.user;
  const { comment, replyAt, from } = req.body;
  const { id } = req.params;

  if (comment === null) {
    return res.status(404).json({ message: "commen is required" });
  }

  try {
    const commentInfo = await Comments.findById(id);
    commentInfo.replies.push({
      comment,
      replyAt,
      from,
      userId,
      created_At: Date.now(),
    });

    commentInfo.save();
    res.status(200).json(commentInfo);
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};

const deletePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Posts.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};

export {
  createPost,
  getPosts,
  getPost,
  getUserPost,
  getComments,
  likePost,
  likePostComment,
  commentPost,
  replyPostComment,
  deletePost,
};
