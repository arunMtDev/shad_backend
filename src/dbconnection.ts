import mongoose from "mongoose";

const connectDB = (): void => {
  mongoose
    .connect(process.env.MONGO_URI as string)
    .then((data: any) => {
      console.log(`MongoDB is connected with server: ${data.connection.host}`);
    })
    .catch((err: Error) => {
      console.log(`error while connecting to the mongodb ${err}`);
    });
};

export default connectDB;
