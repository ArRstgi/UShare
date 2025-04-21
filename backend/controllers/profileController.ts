import { Request, Response } from "express";
import {
  getProfileById,
  createProfile,
  updateProfile,
} from "../models/profileModel";

// GET /profiles/:id
export function getProfile(req: Request, res: Response): void {
  const { id } = req.params;
  const profile = getProfileById(id);
  if (!profile) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }
  res.json(profile);
}

// POST /profiles
export function createProfileHandler(req: Request, res: Response): void {
  const { skillsTeach, skillsLearn, availability } = req.body;
  if (
    typeof skillsTeach !== "string" ||
    typeof skillsLearn !== "string" ||
    typeof availability !== "string"
  ) {
    res.status(400).json({ error: "Invalid profile data" });
    return;
  }
  const profile = createProfile({ skillsTeach, skillsLearn, availability });
  res.status(201).json(profile);
}

// PUT /profiles/:id
export function updateProfileHandler(req: Request, res: Response): void {
  const { id } = req.params;
  const existing = getProfileById(id);
  if (!existing) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }

  const merged = {
    skillsTeach: typeof req.body.skillsTeach === "string"
                  ? req.body.skillsTeach
                  : existing.skillsTeach,
    skillsLearn: typeof req.body.skillsLearn === "string"
                  ? req.body.skillsLearn
                  : existing.skillsLearn,
    availability: typeof req.body.availability === "string"
                   ? req.body.availability
                   : existing.availability,
  };

  const updated = updateProfile(id, merged);
  res.json(updated);
}

// POST /profile/:id/photo
export function uploadPhotoHandler(
  req: Request<{ id: string }>,
  res: Response
) {
  const { id } = req.params;
  const file = (req as any).file as Express.Multer.File;
  if (!file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  // build a public URL
  const host = `${req.protocol}://${req.get("host")}`; 
  const photoUrl = `${host}/uploads/${file.filename}`;
  const updated = updateProfile(id, { photoUrl });
  if (!updated) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }

  res.json({ ...updated, message: "Photo uploaded" });
}
