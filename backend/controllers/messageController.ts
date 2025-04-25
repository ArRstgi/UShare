import { Request, Response, NextFunction } from "express";
import path from "path";
import messageModel from "../models/messageModel";
import { Message } from "../types/chatTypes";

// Define expected Request param/query types
interface MessageParams {
  id: string;
}
interface MessageQuery {
  user1: string;
  user2: string;
}
// Define expected request body structure (adjust based on what frontend sends)
interface MessagePostBody {
  sender: string;
  receiver: string;
  text?: string;
  // file is handled by multer (req.file)
}

export const getMessages = async (
  req: Request<{}, {}, {}, MessageQuery>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { user1, user2 } = req.query;
  if (!user1 || !user2) {
    res
      .status(400)
      .json({ message: "Both user1 and user2 query parameters are required." });
    return;
  }
  try {
    const messages: Message[] = await messageModel.getMessagesBetweenUsers(
      user1,
      user2
    );
    res.status(200).json(messages);
  } catch (error) {
    next(error);
  }
};

// Use Partial<MessagePostBody> if some fields are optional in the body
export const createMessage = async (
  req: Request<{}, {}, MessagePostBody>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Type assertion for safety, or use a validation library
  const messageData = req.body; // Body parsed by express.json/urlencoded OR multer for text fields
  const fileInfo = req.file as Express.Multer.File | undefined; // Get file info from multer

  if (!messageData.sender || !messageData.receiver) {
    res.status(400).json({ message: "Sender and Receiver are required." });
    return;
  }
  // Ensure text is at least empty string if not provided but needed (or handle null in model)
  const text = messageData.text ?? null;

  if (!text && !fileInfo) {
    res.status(400).json({ message: "Message must contain text or a file." });
    return;
  }

  try {
    const newMessage: Message = await messageModel.addMessage(
      { sender: messageData.sender, receiver: messageData.receiver, text },
      fileInfo
    );
    res.status(201).json(newMessage);
  } catch (error) {
    // Error handling (including potential file cleanup) is now within the model
    next(error);
  }
};

export const downloadMessageFile = async (
  req: Request<MessageParams>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { id } = req.params;
  try {
    const message = await messageModel.getMessageById(id);
    if (!message || !message.filePath) {
      res
        .status(404)
        .json({ message: "Message or associated file not found." });
      return;
    }

    // Construct absolute path from backend root (where server.ts runs)
    // message.filePath is like 'uploads/xyz.pdf'
    const absoluteFilePath = path.resolve(__dirname, "..", message.filePath); // Go up from controllers -> backend root

    res.download(absoluteFilePath, message.fileName || "download", (err) => {
      if (err) {
        console.error(`Download error for file: ${absoluteFilePath}`, err);
        if (!res.headersSent) {
          res
            .status(500)
            .send("Could not download file due to a server error.");
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMessageById = async (
  req: Request<MessageParams>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { id } = req.params;
  try {
    const result = await messageModel.deleteMessage(id);
    if (!result.found) {
      res.status(404).json({ message: `Message with id '${id}' not found` });
      return;
    }
    res.status(204).send(); // No Content on successful delete
  } catch (error) {
    next(error);
  }
};
