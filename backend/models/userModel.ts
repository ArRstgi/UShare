import storage from "../services/storageService";
import { User } from "../types/chatTypes";

const initializeAndReadUsers = async (): Promise<User[]> => {
  try {
    // Ensures the file exists and is readable JSON (defaults to [] if created)
    // This step is still useful to prevent errors if the file is deleted manually.
    await storage.initializeDataFiles(); // Ensures both user/message files are checked/created if missing

    // Read the users directly from the file
    const users: User[] = await storage.readUsers();
    return users;
  } catch (error) {
    console.error("Error initializing or reading users:", error);
    return [];
  }
};

const getAllUsers = async (): Promise<User[]> => {
  try {
    let users = await initializeAndReadUsers();
    // Sort by timestamp descending (most recent first)
    users.sort(
      (a, b) => (b.lastMessageTimestamp ?? 0) - (a.lastMessageTimestamp ?? 0)
    );
    return users;
  } catch (error) {
    console.error("Error getting all users:", error);
    throw new Error("Failed to retrieve users.");
  }
};

const getUserByName = async (name: string): Promise<User | null> => {
  try {
    // Note: initializeAndReadUsers is implicitly called by getAllUsers
    const users = await getAllUsers();
    const user = users.find((u) => u.name === name);
    return user || null;
  } catch (error) {
    console.error(`Error getting user by name ${name}:`, error);
    throw new Error("Failed to retrieve user by name.");
  }
};

// Updates user data in the JSON file
// Use Partial<User> to allow updating only specific fields
const updateUser = async (
  name: string,
  updateData: Partial<User>
): Promise<User | null> => {
  try {
    let users = await storage.readUsers(); // Read fresh data
    const userIndex = users.findIndex((u) => u.name === name);

    if (userIndex === -1) {
      console.warn(`Attempted to update non-existent user: ${name}`);
      return null; // Indicate user not found
    }

    // Merge existing user data with new data, ensuring type safety
    users[userIndex] = { ...users[userIndex], ...updateData };

    await storage.writeUsers(users);
    return users[userIndex];
  } catch (error) {
    console.error(`Error writing user update for ${name}:`, error);
    throw new Error("Failed to save user update.");
  }
};

export default {
  getAllUsers,
  getUserByName,
  updateUser,
};
