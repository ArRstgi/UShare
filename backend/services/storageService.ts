import fs from "fs-extra";
import path from "path";
import { User, Message } from "../types/chatTypes";

const dataDir = path.join(__dirname, "..", "data");
const usersFilePath = path.join(dataDir, "users.json");
const messagesFilePath = path.join(dataDir, "messages.json");

// Ensure JSON file exists and has default content if empty/new
const ensureJsonFile = async (
  filePath: string,
  defaultContent: any[] = []
): Promise<void> => {
  try {
    await fs.ensureFile(filePath); // Creates file and dirs if they don't exist
    const content = await fs.readFile(filePath, "utf-8");
    if (content.trim() === "") {
      await fs.writeJson(filePath, defaultContent, { spaces: 2 });
      console.log(`Initialized empty file: ${path.basename(filePath)}`);
    }
    JSON.parse(content || JSON.stringify(defaultContent));
  } catch (error: any) {
    if (error instanceof SyntaxError) {
      console.warn(`Invalid JSON in ${filePath}, overwriting with default.`);
      await fs.writeJson(filePath, defaultContent, { spaces: 2 });
    } else {
      console.error(`Error ensuring JSON file ${filePath}:`, error);
      throw new Error(
        `Could not ensure or initialize file: ${path.basename(filePath)}`
      );
    }
  }
};

const readFile = async <T>(filePath: string): Promise<T[]> => {
  try {
    await ensureJsonFile(filePath); // Ensure file exists and is valid/initialized
    // fs-extra's readJson handles parsing
    const data = await fs.readJson(filePath);
    // Ensure data is an array, return empty array if not
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error(`Error reading or parsing JSON file ${filePath}:`, error);
    // Return empty array on failure to avoid crashing, log the error
    return []; // Or rethrow a custom error if needed
  }
};

const writeFile = async <T>(filePath: string, data: T[]): Promise<void> => {
  try {
    await fs.ensureDir(path.dirname(filePath)); // Ensure directory exists
    await fs.writeJson(filePath, data, { spaces: 2 }); // writeJson handles stringify
  } catch (error) {
    console.error(`Error writing JSON file ${filePath}:`, error);
    throw new Error(`Could not write data to ${path.basename(filePath)}`);
  }
};

const initializeDataFiles = async (): Promise<void> => {
  try {
    await fs.ensureDir(dataDir);
    await ensureJsonFile(usersFilePath, []); // Ensure default empty array
    await ensureJsonFile(messagesFilePath, []); // Ensure default empty array
  } catch (error) {
    console.error("Failed to initialize data directory/files:", error);
    throw error; // Re-throw to halt server startup if needed
  }
};

export default {
  readUsers: (): Promise<User[]> => readFile<User>(usersFilePath),
  writeUsers: (data: User[]): Promise<void> =>
    writeFile<User>(usersFilePath, data),
  readMessages: (): Promise<Message[]> => readFile<Message>(messagesFilePath),
  writeMessages: (data: Message[]): Promise<void> =>
    writeFile<Message>(messagesFilePath, data),
  initializeDataFiles,
  usersFilePath,
  messagesFilePath,
  dataDir,
};
