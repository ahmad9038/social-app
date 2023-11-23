import mongoose from "mongoose";
const db = process.env.DATABASE;

const dbConnection = () => {
  mongoose
    .connect(process.env.DATABASE)
    .then(async () => {
      console.log("Connected!");
    })
    .catch((err) => {
      console.log("Error connecting to database: ", err);
    });
};

export default dbConnection;
