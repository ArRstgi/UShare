import { Router } from "express";
import * as messageController from "../controllers/messageController";
import upload from "../middleware/uploadMiddleware";

const messageRoutes = Router();

messageRoutes.get("/", messageController.getMessages);
messageRoutes.post("/", upload.single("file"), messageController.createMessage);
messageRoutes.get("/:id/download", messageController.downloadMessageFile);
messageRoutes.delete("/:id", messageController.deleteMessageById);

export default messageRoutes;
