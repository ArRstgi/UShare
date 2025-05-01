import { Router } from "express";
import multer from "multer";
import path from "path";

import {
  getProfile,
  createProfileHandler,
  updateProfileHandler,
  uploadPhotoHandler,
} from "../controllers/profileController";

// multer will generate a random file name for the picture
const upload = multer({ dest: path.join(__dirname, "../uploads/") });

const router = Router();

// GET /profile/:id
router.get("/:id", getProfile);

// POST /profile
router.post("/", createProfileHandler);

// POST /profile/:id/photo
router.post("/:id/photo", upload.single("photo"), uploadPhotoHandler);

// PUT /profile/:id
router.put("/:id", updateProfileHandler);

export default router;
