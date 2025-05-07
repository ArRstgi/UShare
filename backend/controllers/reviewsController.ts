import { Request, Response } from "express";
import { addReview, deleteReview, getAllReviews } from "../models/reviewsModel";

export const getAllReviewsHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const reviews = await getAllReviews();
    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
};

export const addReviewHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const createdReview = await addReview(req.body);
    res.status(201).json(createdReview);
  } catch (error) {
    res.status(400).json({ error: "Invalid review data" });
  }
};

export const deleteReviewHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { teacherName } = req.params;
    const { reviewText } = req.body;
    const success = await deleteReview(teacherName, reviewText);
    
    if (!success) {
      res.status(404).json({ error: "Review not found" });
      return;
    }
    
    res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete review" });
  }
};
