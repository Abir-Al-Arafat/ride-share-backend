import mongoose from "mongoose";

const phoneSchema = new mongoose.Schema(
  {
    phoneNumber: {
      type: String,
    },

    phoneNumberVerified: {
      type: Boolean,
      default: false,
    },

    phoneNumberVerifyCode: {
      type: Number,
    },

    reviewId: { type: mongoose.Schema.Types.ObjectId, ref: "Review" },
  },
  { timestamps: true }
);

export default mongoose.model("Phone", phoneSchema);
