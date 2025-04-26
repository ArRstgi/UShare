/**
 * Represents a user in the chat application.
 * Includes fields for list preview/sorting, which will be stored in DB.
 */
export interface User {
  name: string;
  availability: string;
  lastMessageText?: string;
  lastMessageTimestamp?: number;
}

/**
 * Represents a single chat message (text or file).
 */
export interface Message {
  id?: number;
  sender: string;
  receiver: string;
  text?: string;
  fileName?: string;
  fileType?: string;
  filePath?: string | null;
  timestamp: number;
}
