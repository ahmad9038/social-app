import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const hashString = async (value) => {
  const salt = await bcrypt.genSalt(10);
  const hashedString = await bcrypt.hash(value, salt);
  return hashedString;
};

//now compare hashed string with original
export const compareString = async (userPassword, password) => {
  const isMatch = await bcrypt.compare(userPassword, password);
  return isMatch;
};

export function createJWT(id) {
  return jwt.sign({ userId: id }, process.env.JWT_SECRET_KEY, {
    expiresIn: "1d",
  });
}
