// frontend/src/services/api-service.ts
import type { User, Message } from "../pages/Chat/types"; // Adjust path if needed
import { API_BASE_URL } from "@/pages/Chat/constants";

async function handleResponse<T>(response: Response): Promise<T> {
  // Handle successful responses with no content (e.g., DELETE)
  if (response.status === 204) {
    // Return something void-like or a specific indicator if needed
    // For simplicity, returning 'undefined' cast to T might work for void promises
    return undefined as T;
  }

  if (!response.ok) {
    let errorData: { message?: string } = {};
    try {
      // Try to parse error details from the response body
      errorData = await response.json();
    } catch (e) {
      // If parsing fails, use the status text
      errorData = { message: response.statusText };
    }
    // Throw an error with a meaningful message
    throw new Error(errorData.message || `HTTP error ${response.status}`);
  }

  // Handle successful responses with JSON content
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    // Handle potentially empty but valid JSON response body (e.g., {} or [])
    const text = await response.text();
    try {
      return text ? JSON.parse(text) : ({} as T); // Return empty object for empty body if appropriate for T
    } catch (e) {
      throw new Error(
        `Failed to parse JSON response: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }

  // Handle other successful response types if necessary (e.g., text/plain)
  // For this API, we mostly expect JSON or 204/download redirects.
  console.warn("Received non-JSON response type:", contentType);
  return undefined as T;
}

export const ApiService = {
  /** Fetches all users, sorted by backend (most recent first). */
  async getUsers(): Promise<User[]> {
    const response = await fetch(`${API_BASE_URL}/users`);
    // Assuming backend returns User[] directly matching the type
    return handleResponse<User[]>(response);
  },

  /** Fetches messages between two specified users. */
  async getMessages(user1: string, user2: string): Promise<Message[]> {
    const params = new URLSearchParams({ user1, user2 });
    const response = await fetch(
      `${API_BASE_URL}/messages?${params.toString()}`
    );
    // Backend sends Message objects (without 'file' property) matching the type
    const messages = await handleResponse<Message[]>(response);
    // No mapping needed if backend structure matches frontend type definition
    return messages;
  },

  /** Sends a new message (text or file) to the backend. */
  async sendMessage(
    sender: string,
    receiver: string,
    text?: string,
    file?: File
  ): Promise<Message> {
    // Returns the created message object from the backend
    const formData = new FormData();
    formData.append("sender", sender);
    formData.append("receiver", receiver);
    if (text) {
      formData.append("text", text);
    }
    if (file) {
      // Key 'file' MUST match upload.single('file') in messageRoutes.ts
      formData.append("file", file, file.name);
    }

    const response = await fetch(`${API_BASE_URL}/messages`, {
      method: "POST",
      body: formData,
      // No 'Content-Type' header needed; browser sets it for FormData
    });

    // Backend responds with the created Message object (id, timestamp, filePath, etc.)
    const createdMessage = await handleResponse<Message>(response);
    // No mapping needed if backend response matches frontend Message type
    return createdMessage;
  },

  /** Triggers a file download for a specific message ID using browser navigation. */
  downloadFile(messageId: string): void {
    // messageId is string (UUID)
    // Construct the download URL pointing to the backend download endpoint
    const downloadUrl = `${API_BASE_URL}/messages/${messageId}/download`;
    // Use window.location to trigger the download handled by the browser/backend headers
    window.location.href = downloadUrl;
  },

  /** Deletes a message by its ID. Returns void on success. */
  async deleteMessage(messageId: string): Promise<void> {
    // messageId is string (UUID)
    const response = await fetch(`${API_BASE_URL}/messages/${messageId}`, {
      method: "DELETE",
    });
    // handleResponse will return 'undefined' for 204 No Content, fulfilling Promise<void>
    await handleResponse<void>(response);
  },

  /** Updates a user's availability (or other fields). */
  async updateUserAvailability(
    userName: string,
    availability: string
  ): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users/${userName}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      // Send only the fields to be updated
      body: JSON.stringify({ availability }),
    });
    // Assuming backend returns the full updated User object
    return handleResponse<User>(response);
  },
};
