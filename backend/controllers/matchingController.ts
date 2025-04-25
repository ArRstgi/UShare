import { Request, Response } from "express";
import {
  createMatch,
  removeMatch,
  getAllProfiles,
  getProfileById
} from "../models/matchingPageModel";


export function getAllProfile(req: Request, res: Response): void {
  const profiles = getAllProfiles();
  if (!profiles) {
    res.status(404).json({ error: "Unable to load Profiles" });
    return;
  }
  res.json(profiles);
}

export function getAllMatch(req: Request, res: Response): void {
  const { id } = req.params;
  const profile = getProfileById(parseInt(id, 10));
  if (!profile) {
    res.status(404).json({ error: "Unable to load Matches" });
    return;
  }
  res.json(profile.matched?.map((matchId => getProfileById(matchId)?.username)) || []);
}

export function match(req: Request, res: Response): void {
  const { currentId, matchId } = req.params;

  // Validate input
  if (!currentId || !matchId) {
    res.status(400).json({ error: "both ID is required" });
    return;
  }

  // Retrieve the initiating user's profile
  const userProfile1 = getProfileById(parseInt(currentId, 10));
  if (userProfile1 === null) {
    res.status(404).json({ error: "user profile not found" });
    return;
  }

  const userProfile2 = getProfileById(parseInt(matchId, 10));
  if (userProfile2 === null) {
      res.status(404).json({ error: "match profile not found" });
      return;
  }

  createMatch(parseInt(currentId, 10), parseInt(matchId, 10));

  res.status(200).json({
    message: "Match created successfully"
  });
}

export function unmatch(req: Request, res: Response): void {
  const { currentId, matchId } = req.params;

  // Validate input
  if (!currentId || !matchId) {
    res.status(400).json({ error: "both ID is required" });
    return;
  }

  // Retrieve the initiating user's profile
  const userProfile1 = getProfileById(parseInt(currentId, 10));
  if (userProfile1 === null) {
    res.status(404).json({ error: "user profile not found" });
    return;
  }

  const userProfile2 = getProfileById(parseInt(matchId, 10));
  if (userProfile2 === null) {
    res.status(404).json({ error: "match profile not found" });
    return;
  }

  removeMatch(parseInt(currentId, 10), parseInt(matchId, 10));

  res.status(200).json({
    message: "unmatch successfully"
  });
}