// backend/models/ChatUser.ts
import { Model, DataTypes, Optional } from "sequelize";
import { sequelize } from "./db"; // Your Sequelize instance
import { User as UserType } from "../types/chatTypes"; // Frontend/API User type

// Interface for ChatUser attributes, matches UserType from chatTypes
export interface ChatUserAttributes extends UserType {
  // 'name' is already in UserType and will be PK
  // 'availability' is in UserType
  // 'lastMessageText' is in UserType
  // 'lastMessageTimestamp' is in UserType
}

// Some attributes are optional in `Model.build` and `Model.create` calls
interface ChatUserCreationAttributes
  extends Optional<
    ChatUserAttributes,
    "availability" | "lastMessageText" | "lastMessageTimestamp"
  > {}

class ChatUser
  extends Model<ChatUserAttributes, ChatUserCreationAttributes>
  implements ChatUserAttributes
{
  public name!: string; // Primary Key
  public availability!: string;
  public lastMessageText?: string | null;
  public lastMessageTimestamp?: number | null;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ChatUser.init(
  {
    name: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    availability: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "offline", // Default availability
    },
    lastMessageText: {
      type: DataTypes.TEXT, // TEXT for potentially longer previews
      allowNull: true,
    },
    lastMessageTimestamp: {
      type: DataTypes.BIGINT, // To store epoch milliseconds
      allowNull: true,
    },
  },
  {
    tableName: "chat_users",
    sequelize, // Pass the Sequelize instance
    timestamps: true, // Enable createdAt and updatedAt
  }
);

export { ChatUser };
