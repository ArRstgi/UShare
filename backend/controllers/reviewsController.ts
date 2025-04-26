import { Request, Response } from "express";
import { addReview, deleteReview, getAllReviews } from "../models/reviewsModel";

// POST: Add a new review
export const addReviewHandler = (req: Request, res: Response): void => {
  const newReview = req.body;

  if (
    !newReview.stars ||
    !newReview.teacherName ||
    !newReview.skill ||
    !newReview.reviewerName ||
    !newReview.date ||
    !newReview.reviewText
  ) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const createdReview = addReview(newReview);
  res.status(201).json({ message: "Review added successfully", createdReview });
};

// GET: Retrieve all reviews
export const getAllReviewsHandler = (req: Request, res: Response): void => {
  try {
    const reviews = getAllReviews(); // Fetch reviews from the model
    res.status(200).json(reviews);   // Respond with reviews in JSON format
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
};

// DELETE: Remove a review by teacherName and reviewText
export const deleteReviewHandler = (req: Request, res: Response): void => {
  const { teacherName } = req.params;
  const { reviewText } = req.body;

  if (!reviewText) {
    res.status(400).json({ error: "Review text is required" });
    return;
  }

  const reviewDeleted = deleteReview(teacherName, reviewText);
  if (!reviewDeleted) {
    res.status(404).json({ error: "Review not found" });
    return;
  }

  res.status(200).json({ message: `Review for ${teacherName} deleted successfully` });
};
