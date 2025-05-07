import { ChatUser, ChatUserAttributes } from "./chatUser";
import { User as UserType } from "../types/chatTypes"; // For controller return types

const getAllUsers = async (): Promise<UserType[]> => {
  try {
    const users = await ChatUser.findAll({
      order: [["lastMessageTimestamp", "DESC"]], // Sort by most recent message
    });
    // Convert Sequelize model instances to plain objects matching UserType
    return users.map((user: { toJSON: () => UserType; }) => user.toJSON() as UserType);
  } catch (error) {
    console.error("Error getting all users:", error);
    throw new Error("Failed to retrieve users.");
  }
};

const getUserByName = async (name: string): Promise<UserType | null> => {
  try {
    const user = await ChatUser.findByPk(name);
    return user ? user.toJSON() as UserType : null;
  } catch (error) {
    console.error(`Error getting user by name ${name}:`, error);
    throw new Error("Failed to retrieve user by name.");
  }
};

const updateUser = async (
  name: string,
  updateData: Partial<UserType> // Use UserType from chatTypes for partial updates
): Promise<UserType | null> => {
  try {
    const user = await ChatUser.findByPk(name);
    if (!user) {
      console.warn(`Attempted to update non-existent user: ${name}`);
      return null;
    }
    // Sequelize's update method or save on instance
    // Ensure updateData only contains fields present in ChatUserAttributes
    const allowedUpdates: Partial<ChatUserAttributes> = {};
    if (updateData.availability !== undefined) allowedUpdates.availability = updateData.availability;
    if (updateData.lastMessageText !== undefined) allowedUpdates.lastMessageText = updateData.lastMessageText;
    if (updateData.lastMessageTimestamp !== undefined) allowedUpdates.lastMessageTimestamp = updateData.lastMessageTimestamp;

    await user.update(allowedUpdates);
    return user.toJSON() as UserType;
  } catch (error) {
    console.error(`Error updating user ${name}:`, error);
    throw new Error("Failed to save user update.");
  }
};

// Utility function to find or create a user, useful for chat initiation
const findOrCreateUser = async (name: string, defaults?: Partial<ChatUserAttributes>): Promise<ChatUser> => {
  const [user, created] = await ChatUser.findOrCreate({
    where: { name },
    defaults: {
      availability: 'offline', // Default availability
      ...defaults,
      name, // Ensure name is part of defaults if it might be missing
    },
  });
  if (created) {
    console.log(`User ${name} created in chat system.`);
  }
  return user;
};

export default {
  getAllUsers,
  getUserByName,
  updateUser,
  findOrCreateUser, // Export for use in matchingController or messageModel
};