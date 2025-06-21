import mongoose, { Schema } from "mongoose";
import IReview from "../interfaces/review.interface";

const reviewSchema: Schema<IReview> = new Schema(
  {
    reviewer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reviewedUser: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
  },
  { timestamps: true }
);

const Review = mongoose.model<IReview>("Review", reviewSchema);
export default Review;
