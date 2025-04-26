import { Router } from "express";
import { addReviewHandler, deleteReviewHandler, getAllReviewsHandler } from "../controllers/reviewsController";

const router = Router();

// POST: Add a new review
router.post("/", addReviewHandler);

// GET: Retrieve all reviews
router.get("/", getAllReviewsHandler);

// DELETE: Remove a review by teacherName and reviewText
router.delete("/:teacherName", deleteReviewHandler);

export default router;
