import { Router } from "express";
import {
  getAllMatchingProfilesHandler,
  getMatchesForUserHandler,
  createMatchHandler,
  removeMatchHandler,
} from "../controllers/matchingController";

const router = Router();

router.get("/getProfiles", getAllMatchingProfilesHandler);

router.get("/getMatches/:id", getMatchesForUserHandler);

router.post("/:userId/match/:matchId", createMatchHandler);

router.post("/:userId/unmatch/:matchId", removeMatchHandler);

export default router;