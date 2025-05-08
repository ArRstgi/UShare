export interface User {
  name: string;
  availability: string;
  lastMessageText?: string | null;
  lastMessageTimestamp?: number | null;
}

export interface Message {
  id: string;
  sender: string; // Corresponds to ChatUser.name
  receiver: string; // Corresponds to ChatUser.name
  text?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  filePath?: string | null; // Relative path like 'uploads/filename.ext'
  timestamp: number; // Unix timestamp (milliseconds)
}
