import mongoose, { Document } from "mongoose";
export default interface IReview extends Document {
  reviewer: mongoose.Types.ObjectId;
  reviewedUser: mongoose.Types.ObjectId;
  rating: number;
  comment?: string;
}
