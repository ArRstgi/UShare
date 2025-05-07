import { Op } from "sequelize";
import { ChatMessage, ChatMessageAttributes } from "./chatMessage";
import userModel from "./userModel"; // For updating user's last message details
import path from "path";
import fs from "fs-extra";
import { Message as MessageType } from "../types/chatTypes"; // For controller return types
import { UPLOADS_DIR } from "../middleware/uploadMiddleware";

// Type guard
function isValidFile(file: any): file is Express.Multer.File {
  return (
    file &&
    typeof file.filename === "string" &&
    typeof file.originalname === "string" &&
    typeof file.mimetype === "string"
  );
}

const getMessagesBetweenUsers = async (
  user1: string,
  user2: string
): Promise<MessageType[]> => {
  try {
    const messages = await ChatMessage.findAll({
      where: {
        [Op.or]: [
          { senderName: user1, receiverName: user2 },
          { senderName: user2, receiverName: user1 },
        ],
      },
      order: [["timestamp", "ASC"]], // Chronological order
      // include: [{ model: ChatUser, as: 'sender' }, { model: ChatUser, as: 'receiver' }]
    });
    // Convert to match frontend MessageType, especially timestamp
    return messages.map((msg) => {
      const msgJson = msg.toJSON() as ChatMessageAttributes;
      return {
        id: msgJson.id,
        sender: msgJson.senderName,
        receiver: msgJson.receiverName,
        text: msgJson.text,
        fileName: msgJson.fileName,
        fileType: msgJson.fileType,
        filePath: msgJson.filePath, // Frontend expects this path
        timestamp: Number(msgJson.timestamp), // Ensure timestamp is number
      };
    });
  } catch (error) {
    console.error("Error getting messages between users:", error);
    throw new Error("Failed to retrieve messages for the chat.");
  }
};

interface NewMessageInput {
  sender: string; // senderName
  receiver: string; // receiverName
  text?: string | null;
}

const addMessage = async (
  messageData: NewMessageInput,
  fileInfo?: Express.Multer.File
): Promise<MessageType> => {
  const validFileInfo = isValidFile(fileInfo) ? fileInfo : undefined;
  const relativeFilePath = validFileInfo
    ? path.join("uploads", validFileInfo.filename).replace(/\\/g, "/") // Store relative path
    : null;

  // Ensure sender and receiver users exist
  await userModel.findOrCreateUser(messageData.sender);
  await userModel.findOrCreateUser(messageData.receiver);

  try {
    const newMessageInstance = await ChatMessage.create({
      senderName: messageData.sender,
      receiverName: messageData.receiver,
      text: messageData.text || null,
      fileName: validFileInfo ? validFileInfo.originalname : null,
      fileType: validFileInfo ? validFileInfo.mimetype : null,
      filePath: relativeFilePath,
      timestamp: Date.now(), // Sequelize model default will also handle this
    });

    // Update last message preview for both sender and receiver (for their user lists)
    const previewText =
      newMessageInstance.text ??
      `File: ${newMessageInstance.fileName ?? "unknown"}`;
    const timestamp = Number(newMessageInstance.timestamp);

    // Update for receiver
    try {
      await userModel.updateUser(messageData.receiver, {
        lastMessageText: previewText,
        lastMessageTimestamp: timestamp,
      });
    } catch (userUpdateError) {
      console.error(
        `Non-fatal: Failed to update receiver ${messageData.receiver}'s preview:`,
        userUpdateError
      );
    }
    // Update for sender (so their list also reflects the last message they sent in that convo)
    try {
      const senderUser = await userModel.getUserByName(messageData.sender);
      // Only update sender's preview if this new message is more recent than their current lastMessageTimestamp
      if (
        senderUser &&
        (!senderUser.lastMessageTimestamp ||
          timestamp > senderUser.lastMessageTimestamp)
      ) {
        await userModel.updateUser(messageData.sender, {
          lastMessageText: `You: ${previewText}`, // Differentiate sent message
          lastMessageTimestamp: timestamp,
        });
      }
    } catch (userUpdateError) {
      console.error(
        `Non-fatal: Failed to update sender ${messageData.sender}'s preview:`,
        userUpdateError
      );
    }

    const msgJson = newMessageInstance.toJSON() as ChatMessageAttributes;
    return {
      id: msgJson.id,
      sender: msgJson.senderName,
      receiver: msgJson.receiverName,
      text: msgJson.text,
      fileName: msgJson.fileName,
      fileType: msgJson.fileType,
      filePath: msgJson.filePath,
      timestamp: Number(msgJson.timestamp),
    };
  } catch (error) {
    console.error(`Error creating new message:`, error);
    if (validFileInfo?.path) {
      // validFileInfo.path is the absolute path multer saved to
      try {
        await fs.unlink(validFileInfo.path);
        console.log(
          `Cleaned up uploaded file due to save error: ${validFileInfo.path}`
        );
      } catch (cleanupError) {
        console.error("Failed to clean up uploaded file:", cleanupError);
      }
    }
    throw new Error("Failed to save new message.");
  }
};

const getMessageById = async (id: string): Promise<MessageType | null> => {
  try {
    const message = await ChatMessage.findByPk(id);
    if (!message) return null;

    const msgJson = message.toJSON() as ChatMessageAttributes;
    return {
      id: msgJson.id,
      sender: msgJson.senderName,
      receiver: msgJson.receiverName,
      text: msgJson.text,
      fileName: msgJson.fileName,
      fileType: msgJson.fileType,
      filePath: msgJson.filePath,
      timestamp: Number(msgJson.timestamp),
    };
  } catch (error) {
    console.error(`Error getting message by ID ${id}:`, error);
    throw new Error("Failed to retrieve message by ID.");
  }
};

interface DeleteResult {
  found: boolean;
  message?: string;
}

const deleteMessage = async (id: string): Promise<DeleteResult> => {
  try {
    const messageToDelete = await ChatMessage.findByPk(id);
    if (!messageToDelete) {
      return { found: false, message: `Message with id '${id}' not found.` };
    }

    const filePathToDelete = messageToDelete.filePath;
    const result = await ChatMessage.destroy({ where: { id } });

    if (result === 0) {
      return {
        found: false,
        message: `Message with id '${id}' not found for deletion.`,
      };
    }

    if (filePathToDelete) {
      try {
        // filePathToDelete is relative e.g., 'uploads/filename.ext'
        // UPLOADS_DIR is absolute path to 'backend/uploads'
        const absoluteFilePath = path.join(
          UPLOADS_DIR,
          path.basename(filePathToDelete)
        );
        if (await fs.pathExists(absoluteFilePath)) {
          await fs.unlink(absoluteFilePath);
          console.log(`Deleted associated file: ${absoluteFilePath}`);
        } else {
          console.warn(
            `File not found for deletion, but message record removed: ${absoluteFilePath}`
          );
        }
      } catch (fileDeleteError: any) {
        if (fileDeleteError.code !== "ENOENT") {
          console.error(
            `Failed to delete file ${filePathToDelete}:`,
            fileDeleteError
          );
        }
      }
    }
    return { found: true, message: `Message ${id} deleted successfully.` };
  } catch (error) {
    console.error(`Error deleting message ${id}:`, error);
    throw new Error("Failed to process message deletion.");
  }
};

export default {
  getMessagesBetweenUsers,
  addMessage,
  getMessageById,
  deleteMessage,
};
