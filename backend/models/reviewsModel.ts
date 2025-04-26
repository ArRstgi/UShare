import fs from "fs";
import path from "path";

export interface Review {
  stars: number;
  teacherName: string;
  skill: string;
  reviewerName: string;
  date: string;
  reviewText: string;
}

const DATA_PATH = path.join(__dirname, "../data/reviews.json");

let reviews: Review[] = [];

// Load reviews from disk
function loadFromDisk() {
  try {
    reviews = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
  } catch {
    reviews = [];
  }
}

// Save reviews to disk
function saveToDisk() {
  fs.writeFileSync(DATA_PATH, JSON.stringify(reviews, null, 2));
}

// Initialize by loading data from disk
loadFromDisk();

export function getAllReviews(): Review[] {
  return reviews;
}

export function addReview(newReview: Review): Review {
  reviews.push(newReview);
  saveToDisk();
  return newReview;
}

export function deleteReview(teacherName: string, reviewText: string): boolean {
  const initialLength = reviews.length;
  reviews = reviews.filter(
    (review) =>
      review.teacherName !== teacherName || review.reviewText !== reviewText
  );
  const wasDeleted = reviews.length < initialLength;
  if (wasDeleted) saveToDisk();
  return wasDeleted;
}
