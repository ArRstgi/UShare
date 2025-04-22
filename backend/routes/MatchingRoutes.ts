import { Router } from "express";
import { getAllProfile, match, unmatch } from "../controllers/matchingController";

const router = Router();

// Route to get all profiles
router.get("/getProfiles", getAllProfile);

router.post("/:currentId/match/:matchId", match);

router.post("/:currentId/unmatch/:matchId", unmatch);

export default router;