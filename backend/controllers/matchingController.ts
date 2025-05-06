import { Request, Response } from "express";
import {
  getAllProfiles,
  getProfileById,
  createMatch,
  removeMatch,
  MatchingProfile,
} from "../models/matchingPageModel";
import { Op } from "sequelize";

export async function getAllMatchingProfilesHandler(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const profiles = await getAllProfiles();
    res.json(profiles);
  } catch (error) {
    console.error("Error fetching all matching profiles:", error);
    res.status(500).json({ error: "Failed to retrieve matching profiles" });
  }
}

export async function getMatchesForUserHandler(
  req: Request<{ id: string }>,
  res: Response
): Promise<void> {
  try {
    const userId = parseInt(req.params.id, 10);

    if (isNaN(userId)) {
      res.status(400).json({ error: "Invalid user ID" });
      return;
    }

    const profile = await getProfileById(userId);

    if (!profile) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }

    const matchedIds = profile.matched;

    if (!matchedIds || matchedIds.length === 0) {
      res.json([]);
      return;
    }

    const matchedProfiles = await MatchingProfile.findAll({
      where: {
        id: {
          [Op.in]: matchedIds,
        },
      },
      attributes: ["username"],
    });

    const matchedUsernames = matchedProfiles.map((p) => p.username).filter(Boolean); 

    res.json(matchedUsernames);
  } catch (error) {
    console.error(`Error fetching matches for user ${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to retrieve matches" });
  }
}

export async function createMatchHandler(
  req: Request<{ userId: string; matchId: string }>,
  res: Response
): Promise<void> {
  try {
    const currentId = parseInt(req.params.userId, 10);
    const matchId = parseInt(req.params.matchId, 10);

    if (isNaN(currentId) || isNaN(matchId)) {
      res.status(400).json({ error: "Invalid user ID or match ID" });
      return;
    }

    await createMatch(currentId, matchId);
    res.status(200).json({ message: "Match created successfully"});
  } catch (error) {
    console.error("Error creating match:", error);
    res.status(500).json({ error: "Failed to create match" });
  }
}

export async function removeMatchHandler(
  req: Request<{ userId: string; matchId: string }>,
  res: Response
): Promise<void> {
  try {
    const currentId = parseInt(req.params.userId, 10);
    const matchId = parseInt(req.params.matchId, 10);

    if (isNaN(currentId) || isNaN(matchId)) {
      res.status(400).json({ error: "Invalid user ID or match ID" });
      return;
    }

    await removeMatch(currentId, matchId);
    res.status(200).json({ message: "Match removed successfully" });
  } catch (error) {
    console.error("Error removing match:", error);
    res.status(500).json({ error: "Failed to remove match" });
  }
}