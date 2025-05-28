import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    uploader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    status: {
      type: String,
      enum: ["pending", "approved", "cancelled"],
      default: "pending",
    },
    title: {
      type: String,
    },
    message: {
      type: String,
      required: true, // Message about the notification
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    type: {
      type: String,
      enum: ["driver_application", "service", "forum", "story", "others"],
      default: "others",
    },
  },
  { timestamps: true }
);

// const Notification = mongoose.model("Notification", notificationSchema);
// module.exports = Notification;
export default mongoose.model("Notification", notificationSchema);
