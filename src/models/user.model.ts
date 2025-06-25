import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    username: {
      type: String,
      default: function () {
        return `user_${Date.now()}`;
      },
      unique: true,
    },
    email: {
      type: String,
      required: [true, "please provide email"],
      unique: true,
    },
    image: {
      type: String,
    },
    googleId: {
      type: String,
    },
    password: {
      type: String,
      required: [
        function (this: any) {
          return !this.googleId; // Check for googleId
        },
        "Please provide a password",
      ],

      minlength: 5,
      select: false,
    },

    currentLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
        required: true,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
        default: [0, 0],
      },
    },
    address: {
      type: String,
    },
    drivingCity: {
      type: String,
    },

    paymentIntent: {
      type: String,
    },

    subscriptions: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Subscription" },
    ],

    services: [{ type: mongoose.Schema.Types.ObjectId, ref: "Service" }],

    roles: {
      type: [String],
      enum: ["user", "driver", "admin", "superadmin"],
      default: ["user"],
    },

    bio: {
      type: String,
    },

    phone: {
      type: String,
    },

    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },
    passportIdentity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PassportIdentity",
    },

    licenceDocument: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Licence",
    },

    balance: {
      type: Number,
      min: 0,
      default: 0,
    },

    dateOfBirth: {
      type: Date,
    },

    notifications: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Notification" },
    ],

    emailVerified: {
      type: Boolean,
      default: false,
    },

    emailVerifyCode: {
      type: Number,
    },

    isDriver: {
      type: Boolean,
      default: false,
    },

    selfieForDriverApproval: {
      type: String,
    },

    driverApprovalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isLocked: {
      type: Boolean,
      default: false,
    },

    reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }],
    reviewGiven: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }],
    reviewReceived: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }],
  },
  { timestamps: true }
);

userSchema.index({ currentLocation: "2dsphere" });

export default mongoose.model("User", userSchema);
