export interface User {
  name: string;
  availability: string;
  lastMessageText?: string | null;
  lastMessageTimestamp?: number | null;
}

export interface Message {
  id: string;
  sender: string;
  receiver: string;
  text?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  filePath?: string | null;
  timestamp: number;
}

export interface UserDataStore {
  users: User[];
}

export interface MessageDataStore {
  messages: Message[];
}
