import express from "express";
import {
  createReview,
  getAllReviews,
  getReviewById,
  getReviewByReviewer,
  deleteReview,
} from "../controllers/review.controller";
import multer from "multer";

import {
  isAuthorizedUser,
  isAuthorizedAdmin,
  isAuthorizedSuperAdmin,
} from "../middlewares/authValidationJWT";

const routes = express();
const upload = multer();

routes.post("/", upload.none(), isAuthorizedUser, createReview);

routes.get("/", getAllReviews);

routes.get("/:id", getReviewById);

routes.get("/by-reviewer", isAuthorizedUser, getReviewByReviewer);

routes.delete("/", isAuthorizedUser, deleteReview);

export default routes;
