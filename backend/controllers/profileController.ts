import { Request, Response } from "express";
import {
  getProfileById,
  createProfile,
  updateProfile,
} from "../models/profileModel";

// GET /profile/:id
export async function getProfile(
  req: Request<{ id: string }>,
  res: Response
): Promise<void> {
  const { id } = req.params;
  const profile = await getProfileById(id);
  if (!profile) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }
  res.json(profile);
}

// POST /profile
export async function createProfileHandler(
  req: Request<{}, {}, { skillsTeach: string; skillsLearn: string; availability: string }>,
  res: Response
): Promise<void> {
  const { skillsTeach, skillsLearn, availability } = req.body;
  if (
    typeof skillsTeach !== "string" ||
    typeof skillsLearn !== "string" ||
    typeof availability !== "string"
  ) {
    res.status(400).json({ error: "Invalid profile data" });
    return;
  }
  const profile = await createProfile({ skillsTeach, skillsLearn, availability });
  res.status(201).json(profile);
}

// PUT /profile/:id
export async function updateProfileHandler(
  req: Request<{ id: string }, {}, { skillsTeach?: string; skillsLearn?: string; availability?: string }>,
  res: Response
): Promise<void> {
  const { id } = req.params;
  const existing = await getProfileById(id);
  if (!existing) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }

  const merged = {
    skillsTeach:
      typeof req.body.skillsTeach === "string"
        ? req.body.skillsTeach
        : existing.skillsTeach,
    skillsLearn:
      typeof req.body.skillsLearn === "string"
        ? req.body.skillsLearn
        : existing.skillsLearn,
    availability:
      typeof req.body.availability === "string"
        ? req.body.availability
        : existing.availability,
  };

  const updated = await updateProfile(id, merged);
  res.json(updated!);
}

// POST /profile/:id/photo
export async function uploadPhotoHandler(
  req: Request<{ id: string }>,
  res: Response
): Promise<void> {
  const { id } = req.params;
  const file = (req as any).file as Express.Multer.File | undefined;
  if (!file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  const host = `${req.protocol}://${req.get("host")}`;
  const photoUrl = `${host}/uploads/${file.filename}`;

  const updated = await updateProfile(id, { photoUrl });
  if (!updated) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }

  res.json({ ...updated, message: "Photo uploaded" });
}
