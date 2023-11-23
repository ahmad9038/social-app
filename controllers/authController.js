import Users from "../models/userModel.js";
import { compareString, createJWT, hashString } from "../utils/index.js";
import { sendVerificationEmail } from "../utils/sendEmail.js";

const register = async (req, res, next) => {
  console.log("testing");
  const { firstName, lastName, email, password } = req.body;

  if (!firstName || !lastName || !email || !password) {
    next("incomplete information");
    return;
  }

  try {
    const userExist = await Users.findOne({ email });
    if (userExist) {
      next("Email Address already exists");
      return res.status(422).json({ error: "email already exists" });
    }

    const hashedPassword = await hashString(password);

    const user = await Users.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
    });

    sendVerificationEmail(user, res);
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      next("invalid credentials");
      return;
    }

    //find user
    const user = await Users.findOne({ email }).select("+password");

    // .populate({
    //   path: "SocialFriends",
    //   select: "firstName lastName location profileUrl -password",
    // });

    if (!user) {
      next("invalid credentials");
      return;
    }

    if (!user?.verified) {
      next("User email is not verified. Verify your email");
      return;
    }

    const isMatch = await compareString(password, user?.password);

    if (!isMatch) {
      next("invalid credentials");
      return;
    }

    user.password = undefined;
    const token = createJWT(user?._id);
    res.status(201).json({
      success: true,
      message: "Login successfully",
      user,
      token,
    });
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: "" });
  }
};

export { register, login };
