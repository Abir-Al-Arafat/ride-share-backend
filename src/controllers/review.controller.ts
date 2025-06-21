import { Request, Response } from "express";
import HTTP_STATUS from "../constants/statusCodes";
import { success, failure } from "../utilities/common";
import Review from "../models/review.model";
import IReview from "../interfaces/review.interface";
import { UserRequest } from "../interfaces/user.interface";

// Create or update review
const createReview = async (req: UserRequest, res: Response) => {
  try {
    if (!(req as UserRequest).user || !(req as UserRequest).user!._id) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .send(failure("Please login to request a ride"));
    }
    const { reviewedUserId, rating, comment } = req.body;

    const existing = await Review.findOne({
      reviewer: req.user!._id,
      reviewedUser: reviewedUserId,
    });

    if (existing) {
      existing.rating = rating;
      existing.comment = comment;
      await existing.save();
      return res
        .status(200)
        .send(success("Review updated", { review: existing }));
    }

    const newReview: IReview = new Review({
      reviewer: req.user!._id,
      reviewedUser: reviewedUserId,
      rating,
      comment,
    });

    if (!newReview) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("failed to create review"));
    }

    await newReview.save();

    res
      .status(HTTP_STATUS.CREATED)
      .send(success("Review created successfully", { review: newReview }));
  } catch (err: any) {
    res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json(failure("Server error", err.message));
  }
};

// Get all reviews in database
const getAllReviews = async (req: Request, res: Response) => {
  try {
    const reviews = await Review.find();
    if (!reviews || !reviews.length) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("No reviews found"));
    }
    res
      .status(HTTP_STATUS.OK)
      .send(success("Reviews fetched successfully", { reviews }));
  } catch (err: any) {
    res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Server error", err.message));
  }
};

const getReviewById = async (req: Request, res: Response) => {
  try {
    if (!req.params.id) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Review ID is required"));
    }
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Review not found"));
    }
    res.status(HTTP_STATUS.OK).send(success("Review found", { review }));
  } catch (err: any) {
    res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Server error", err.message));
  }
};

const getReviewByReviewer = async (req: UserRequest, res: Response) => {
  try {
    if (!req.user || !req.user!._id) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .send(failure("Please login to view your reviews"));
    }
    const reviews = await Review.find({ reviewer: req.user!._id });
    if (!reviews || !reviews.length) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("No reviews found"));
    }
    res
      .status(HTTP_STATUS.OK)
      .send(success("Reviews fetched successfully", { reviews }));
  } catch (err: any) {
    res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Server error", err.message));
  }
};

// Delete review
const deleteReview = async (req: UserRequest, res: Response) => {
  try {
    if (!req.params.id) {
      return res
        .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
        .json({ message: "Review ID is required" });
    }

    const review = await Review.findOneAndDelete({
      _id: req.params.id,
    });

    if (!review) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Review not found"));
    }

    res
      .status(HTTP_STATUS.OK)
      .send(success("Review deleted successfully", { review }));
  } catch (err: any) {
    res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Server error", err.message));
  }
};

export {
  createReview,
  getAllReviews,
  getReviewById,
  getReviewByReviewer,
  deleteReview,
};
