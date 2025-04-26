import { v4 as uuidv4 } from 'uuid';
import storage from '../services/storageService';
import userModel from './userModel';
import path from 'path';
import fs from 'fs-extra';
import { Message } from '../types/chatTypes';

// Type guard to check if fileInfo is a valid Multer file object
function isValidFile(file: any): file is Express.Multer.File {
  return file && typeof file.filename === 'string' && typeof file.originalname === 'string' && typeof file.mimetype === 'string';
}

const getAllMessages = async (): Promise<Message[]> => {
    try {
        // Ensure messages file exists (initializeDataFiles likely called at start)
        await storage.initializeDataFiles();
        return await storage.readMessages();
    } catch (error) {
        console.error("Error getting all messages:", error);
        throw new Error("Failed to retrieve messages.");
    }
};

const getMessagesBetweenUsers = async (user1: string, user2: string): Promise<Message[]> => {
    try {
        const allMessages = await getAllMessages();
        const filtered = allMessages.filter(msg =>
            (msg.sender === user1 && msg.receiver === user2) ||
            (msg.sender === user2 && msg.receiver === user1)
        );
        filtered.sort((a, b) => a.timestamp - b.timestamp);
        return filtered;
    } catch (error) {
        console.error("Error getting messages between users:", error);
        throw new Error("Failed to retrieve messages for the chat.");
    }
};

// Define a more specific input type for message data from the request
interface NewMessageInput {
    sender: string;
    receiver: string;
    text?: string | null;
}

const addMessage = async (messageData: NewMessageInput, fileInfo?: Express.Multer.File): Promise<Message> => {

    const validFileInfo = isValidFile(fileInfo) ? fileInfo : undefined;

    const relativeFilePath = validFileInfo
        ? path.join('uploads', validFileInfo.filename).replace(/\\/g, '/')
        : null;

    const newMessage: Message = {
        id: uuidv4(),
        sender: messageData.sender,
        receiver: messageData.receiver,
        text: messageData.text || null,
        timestamp: Date.now(),
        fileName: validFileInfo ? validFileInfo.originalname : null,
        fileType: validFileInfo ? validFileInfo.mimetype : null,
        filePath: relativeFilePath,
    };

    try {
        const allMessages = await getAllMessages();
        allMessages.push(newMessage);
        await storage.writeMessages(allMessages);

        // --- Update User Preview ---
        const previewText = newMessage.text ?? `File: ${newMessage.fileName ?? 'unknown'}`;
        try {
            await userModel.updateUser(newMessage.receiver, {
                lastMessageText: previewText,
                lastMessageTimestamp: newMessage.timestamp
            });
        } catch (userUpdateError) {
            console.error(`Non-fatal: Failed to update receiver ${newMessage.receiver}'s preview:`, userUpdateError instanceof Error ? userUpdateError.message : userUpdateError);
        }

        return newMessage;
    } catch (error) {
        console.error(`Error writing new message:`, error);
        // Clean up uploaded file if message saving failed
        if (validFileInfo?.path) {
            try {
                await fs.unlink(validFileInfo.path);
                console.log(`Cleaned up uploaded file due to save error: ${validFileInfo.path}`);
            } catch (cleanupError) {
                console.error("Failed to clean up uploaded file:", cleanupError);
            }
        }
        throw new Error("Failed to save new message.");
    }
};

const getMessageById = async (id: string): Promise<Message | null> => {
    try {
        const allMessages = await getAllMessages();
        const message = allMessages.find(m => m.id === id);
        return message || null;
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
        let messages = await getAllMessages();
        const initialLength = messages.length;
        const messageToDelete = messages.find(m => m.id === id);

        messages = messages.filter(m => m.id !== id);

        if (messages.length === initialLength) {
            return { found: false }; // Message not found
        }

        await storage.writeMessages(messages);

        // Delete the associated file
        if (messageToDelete?.filePath) {
            try {
                // Construct absolute path relative to this model file
                const absoluteFilePath = path.join(__dirname, '..', messageToDelete.filePath);
                await fs.unlink(absoluteFilePath);
                console.log(`Deleted associated file: ${messageToDelete.filePath}`);
            } catch (fileDeleteError: any) {
                 // Log error but don't necessarily fail the message deletion itself
                if (fileDeleteError.code !== 'ENOENT') { // Ignore if file already gone
                    console.error(`Failed to delete file ${messageToDelete.filePath}:`, fileDeleteError);
                }
            }
        }
        return { found: true, message: `Message ${id} deleted successfully.` };
    } catch (error) {
        console.error(`Error deleting message ${id}:`, error);
        throw new Error("Failed to save message deletion.");
    }
}


export default {
    getAllMessages,
    getMessagesBetweenUsers,
    addMessage,
    getMessageById,
    deleteMessage,
};