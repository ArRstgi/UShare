// backend/controllers/messageController.ts
import { Request, Response, NextFunction } from "express";
import path from "path";
import messageModel from "../models/messageModel"; // This now uses Sequelize
import { Message } from "../types/chatTypes";
import { UPLOADS_DIR } from "../middleware/uploadMiddleware"; // Import UPLOADS_DIR

// Define expected Request param/query types
interface MessageParams {
  id: string;
}
interface MessageQuery {
  user1: string;
  user2: string;
}
interface MessagePostBody {
  sender: string;
  receiver: string;
  text?: string;
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
    // messageModel.getMessagesBetweenUsers returns MessageType[] directly
    const messages: Message[] = await messageModel.getMessagesBetweenUsers(
      user1,
      user2
    );
    res.status(200).json(messages);
  } catch (error) {
    next(error);
  }
};

export const createMessage = async (
  req: Request<{}, {}, MessagePostBody>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const messageData = req.body;
  const fileInfo = req.file as Express.Multer.File | undefined;

  if (!messageData.sender || !messageData.receiver) {
    res.status(400).json({ message: "Sender and Receiver are required." });
    return;
  }
  const text = messageData.text ?? null; // Ensure text is null if not provided

  if (!text && !fileInfo) {
    res.status(400).json({ message: "Message must contain text or a file." });
    return;
  }

  try {
    // messageModel.addMessage returns MessageType directly
    const newMessage: Message = await messageModel.addMessage(
      { sender: messageData.sender, receiver: messageData.receiver, text },
      fileInfo
    );
    res.status(201).json(newMessage);
  } catch (error) {
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
    const message = await messageModel.getMessageById(id); // Returns MessageType or null
    if (!message || !message.filePath) {
      res
        .status(404)
        .json({ message: "Message or associated file not found." });
      return;
    }

    // message.filePath is relative, e.g., 'uploads/xyz.pdf'
    // We need the basename of the file and join it with UPLOADS_DIR (absolute path to uploads folder)
    const fileNameInUploads = path.basename(message.filePath);
    const absoluteFilePath = path.join(UPLOADS_DIR, fileNameInUploads);

    res.download(
      absoluteFilePath,
      message.fileName || fileNameInUploads,
      (err) => {
        if (err) {
          console.error(`Download error for file: ${absoluteFilePath}`, err);
          if (!res.headersSent) {
            // Check if headers already sent to avoid "Can't set headers after they are sent."
            if ((err as any).code === "ENOENT") {
              res.status(404).send("File not found on server.");
            } else {
              res
                .status(500)
                .send("Could not download file due to a server error.");
            }
          }
        }
      }
    );
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
      res.status(404).json({
        message: result.message || `Message with id '${id}' not found`,
      });
      return;
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
