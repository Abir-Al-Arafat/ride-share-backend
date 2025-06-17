import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    uploader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    driver: {
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
    passenger: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    requestedRide: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RequestedRide",
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
      enum: ["driver_application", "rideshare_service", "forum", "others"],
      default: "others",
    },
  },
  { timestamps: true }
);

// const Notification = mongoose.model("Notification", notificationSchema);
// module.exports = Notification;
export default mongoose.model("Notification", notificationSchema);
