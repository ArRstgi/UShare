// backend/models/ChatMessage.ts
import { Model, DataTypes, Optional } from "sequelize";
import { sequelize } from "./db";
import { ChatUser } from "./chatUser"; // Import ChatUser for associations
import { Message as MessageType } from "../types/chatTypes"; // Frontend/API Message type

// Interface for ChatMessage attributes, matches MessageType from chatTypes
export interface ChatMessageAttributes
  extends Omit<MessageType, "sender" | "receiver"> {
  // 'id' is in MessageType
  // 'text' is in MessageType
  // 'fileName' is in MessageType
  // 'fileType' is in MessageType
  // 'filePath' is in MessageType
  // 'timestamp' is in MessageType (as number)
  senderName: string; // Foreign Key to ChatUser.name
  receiverName: string; // Foreign Key to ChatUser.name
}

interface ChatMessageCreationAttributes
  extends Optional<
    ChatMessageAttributes,
    "id" | "timestamp" | "text" | "fileName" | "fileType" | "filePath"
  > {}

class ChatMessage
  extends Model<ChatMessageAttributes, ChatMessageCreationAttributes>
  implements ChatMessageAttributes
{
  public id!: string; // Primary Key (UUID)
  public senderName!: string;
  public receiverName!: string;
  public text?: string | null;
  public fileName?: string | null;
  public fileType?: string | null;
  public filePath?: string | null; // Relative path like 'uploads/filename.ext'
  public timestamp!: number; // Epoch milliseconds

  // Timestamps from Sequelize
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public readonly sender?: ChatUser;
  public readonly receiver?: ChatUser;
}

ChatMessage.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    senderName: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: ChatUser,
        key: "name",
      },
    },
    receiverName: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: ChatUser,
        key: "name",
      },
    },
    text: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    fileName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    fileType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    filePath: {
      // Stores relative path like 'uploads/image.png'
      type: DataTypes.STRING,
      allowNull: true,
    },
    timestamp: {
      // Store as epoch milliseconds
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: () => Date.now(), // Default to current time
    },
  },
  {
    tableName: "chat_messages",
    sequelize,
    timestamps: true, // Enable createdAt and updatedAt for DB auditing
  }
);

// Define associations
ChatUser.hasMany(ChatMessage, {
  sourceKey: "name",
  foreignKey: "senderName",
  as: "sentMessages",
});
ChatUser.hasMany(ChatMessage, {
  sourceKey: "name",
  foreignKey: "receiverName",
  as: "receivedMessages",
});

ChatMessage.belongsTo(ChatUser, {
  foreignKey: "senderName",
  targetKey: "name",
  as: "sender",
});
ChatMessage.belongsTo(ChatUser, {
  foreignKey: "receiverName",
  targetKey: "name",
  as: "receiver",
});

export { ChatMessage };
