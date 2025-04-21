import { Router } from "express";
import {
  getProfile,
  createProfileHandler,
  updateProfileHandler,
  uploadPhotoHandler
} from "../controllers/profileController";
import multer from "multer";
import path from "path";

// multer will generate a random file name for the picture
const upload = multer({ dest: path.join(__dirname, "../uploads/") });

const router = Router();

router.get("/:id", getProfile);


router.post("/", createProfileHandler);
router.post(
  "/:id/photo",
  upload.single("photo"),
  uploadPhotoHandler  
);

router.put("/:id", updateProfileHandler);

export default router;



