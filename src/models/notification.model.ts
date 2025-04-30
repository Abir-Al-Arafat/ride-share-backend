import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    uploader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    confession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Confession",
    },
    story: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Story",
    },
    forum: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Forum",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "cancelled"],
      default: "pending",
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
      enum: ["service", "forum", "story", "others"],
      default: "others",
    },
  },
  { timestamps: true }
);

// const Notification = mongoose.model("Notification", notificationSchema);
// module.exports = Notification;
export default mongoose.model("Notification", notificationSchema);
