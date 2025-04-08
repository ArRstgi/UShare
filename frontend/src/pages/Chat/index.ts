import { BaseComponent } from "@/components/BaseComponent";
import { DatabaseService } from "../../services/database-service";
import {
  USERS_STORE,
  MESSAGES_STORE,
  ALLOWED_FILE_TYPES,
  paperclipIconSVG,
  initialUsersData,
} from "./constants";
import type { User, Message } from "./types";
import { formatTimestamp, getFileIcon } from "./chat-utils";

/**
 * Controller for the Chat Page, managing state, DB, and DOM directly.
 */
export class ChatPage extends BaseComponent {
  // Main container
  #container: HTMLElement | null = null;

  // Service
  #dbService: DatabaseService;

  // UI Element References
  #messagesListUL: HTMLUListElement | null = null;
  #conversationView: HTMLElement | null = null;
  #conversationHeader: HTMLElement | null = null;
  #conversationMessagesContainer: HTMLElement | null = null;
  #messageInput: HTMLInputElement | null = null;
  #sendMessageButton: HTMLButtonElement | null = null;
  #attachFileButton: HTMLButtonElement | null = null;
  #hiddenFileInput: HTMLInputElement | null = null;
  #searchInput: HTMLInputElement | null = null;

  // State
  #cur_user: User | null = null;
  #searchDebounceTimer: number | null = null;

  constructor() {
    super();
    this.loadCSS("src/pages/Chat", "styles");
    this.#dbService = new DatabaseService();
  }

  render(): HTMLElement {
    if (this.#container) return this.#container;
    this.#container = document.createElement("div");
    this.#container.classList.add("messages-page");
    this.#setupContainerLayout(); // Build structure
    this.#attachEventListeners(); // Attach listeners
    this.#initializePage(); // Start async setup
    return this.#container;
  }

  /** Sets up the static DOM layout, including search and input area with attach */
  #setupContainerLayout() {
    if (!this.#container) return;
    // Left Sidebar
    const messagesListAside = document.createElement("aside");
    messagesListAside.classList.add("messages-list");
    const messagesTitle = document.createElement("h2");
    messagesTitle.textContent = "Messages";
    messagesListAside.appendChild(messagesTitle);
    // Search Input (Restored)
    this.#searchInput = document.createElement("input");
    this.#searchInput.type = "search";
    this.#searchInput.placeholder = "Search messages";
    this.#searchInput.classList.add("messages-search-input");
    messagesListAside.appendChild(this.#searchInput);
    this.#messagesListUL = document.createElement("ul");
    messagesListAside.appendChild(this.#messagesListUL);

    // Right Side (Conversation)
    this.#conversationView = document.createElement("main");
    this.#conversationView.classList.add("conversation-view");
    // Header
    this.#conversationHeader = document.createElement("header");
    this.#conversationHeader.classList.add("conversation-header");
    this.#conversationView.appendChild(this.#conversationHeader);
    // Messages Container
    this.#conversationMessagesContainer = document.createElement("div");
    this.#conversationMessagesContainer.classList.add("conversation-messages");
    this.#conversationView.appendChild(this.#conversationMessagesContainer);
    // Input Area (Now includes attach button)
    this.#setupMessageInputArea(); // Appends to #conversationView

    // Append main sections
    this.#container.appendChild(messagesListAside);
    this.#container.appendChild(this.#conversationView);
  }

  /** Creates and appends the message input area, including attach button */
  #setupMessageInputArea() {
    if (!this.#conversationView) return;
    const inputArea = document.createElement("div");
    inputArea.classList.add("message-input-area");
    // Text Input
    this.#messageInput = document.createElement("input");
    this.#messageInput.type = "text";
    this.#messageInput.placeholder = "Type a message or drop a file";
    // Hidden File Input
    this.#hiddenFileInput = document.createElement("input");
    this.#hiddenFileInput.type = "file";
    this.#hiddenFileInput.multiple = false;
    this.#hiddenFileInput.accept = ALLOWED_FILE_TYPES.join(",");
    this.#hiddenFileInput.style.display = "none";
    // Attach Button
    this.#attachFileButton = document.createElement("button");
    this.#attachFileButton.classList.add("attach-file-button");
    this.#attachFileButton.type = "button";
    this.#attachFileButton.title = "Attach File";
    this.#attachFileButton.innerHTML = paperclipIconSVG;
    // Send Button
    this.#sendMessageButton = document.createElement("button");
    this.#sendMessageButton.textContent = "Send";
    this.#sendMessageButton.type = "button";
    // Append elements
    inputArea.appendChild(this.#messageInput);
    inputArea.appendChild(this.#hiddenFileInput); // Needs to be in DOM
    inputArea.appendChild(this.#attachFileButton);
    inputArea.appendChild(this.#sendMessageButton);
    this.#conversationView.appendChild(inputArea);
  }

  /** Attaches all required event listeners */
  #attachEventListeners() {
    // Input Area
    this.#sendMessageButton?.addEventListener("click", this.#handleSendMessage);
    this.#messageInput?.addEventListener("keypress", this.#handleInputKeyPress);
    this.#attachFileButton?.addEventListener("click", this.#triggerFileInput);
    this.#hiddenFileInput?.addEventListener("change", this.#handleFileSelected);
    // Search
    this.#searchInput?.addEventListener("input", this.#handleSearchInput);
    // Drag/Drop
    this.#conversationView?.addEventListener("dragover", this.#handleDragOver);
    this.#conversationView?.addEventListener(
      "dragleave",
      this.#handleDragLeave
    );
    this.#conversationView?.addEventListener("drop", this.#handleDrop);
  }

  /** Coordinates async setup */
  async #initializePage() {
    try {
      await this.#dbService.ready();
      await this.#populateInitialUsers();
      await this.#renderUserList(); // Initial list render
      await this.#loadInitialConversation();
    } catch (error) {
      console.error("Failed to initialize chat page:", error);
      this.#showConversationPlaceholder("Error loading chat.", true);
    }
  }

  /** Populates DB with initial users if needed */
  async #populateInitialUsers() {
    const userCount = await this.#dbService.count(USERS_STORE);
    if (userCount === 0) {
      console.log("Populating initial users...");
      // Include availability now
      const putPromises = initialUsersData.map((user) =>
        this.#dbService.put(USERS_STORE, {
          name: user.name,
          availability: user.availability,
        })
      );
      await Promise.all(putPromises);
      console.log("Initial users populated.");
    }
  }

  /**
   * Fetches users (with stored preview info) and renders the list.
   * Sorts by the stored timestamp. Applies filtering.
   */
  async #renderUserList(filterTerm: string = "") {
    if (!this.#messagesListUL) return;
    this.#messagesListUL.innerHTML = ""; // Clear list

    try {
      // Fetch users - they now have lastMessageTimestamp/Text stored on them
      const users = await this.#dbService.getAll<User>(USERS_STORE);

      // Sort directly using the stored timestamp
      users.sort(
        (a, b) => (b.lastMessageTimestamp ?? 0) - (a.lastMessageTimestamp ?? 0)
      );

      // Apply search filter
      let filteredUsers = users;
      if (filterTerm) {
        const lower = filterTerm.toLowerCase();
        // Search name, availability, and last message text
        filteredUsers = users.filter(
          (u) =>
            u.name.toLowerCase().includes(lower) ||
            u.availability.toLowerCase().includes(lower) ||
            u.lastMessageText?.toLowerCase().includes(lower)
        );
      }

      // Render the filtered and sorted list
      filteredUsers.forEach((user) => {
        const li = this.#createUserListItemElement(user);
        this.#messagesListUL?.appendChild(li);
      });

      this.#updateActiveUserHighlight(); // Ensure current user is highlighted
    } catch (error) {
      console.error("Failed to render user list:", error);
      this.#messagesListUL.innerHTML =
        "<li class='error-message'>Failed to load users.</li>";
    }
  }

  /** Creates a single user list item element, including preview/status */
  #createUserListItemElement(user: User): HTMLLIElement {
    const li = document.createElement("li");
    li.classList.add("message-item");
    li.dataset.userName = user.name;
    // Avatar
    const userAvatar = document.createElement("div");
    userAvatar.classList.add("user-avatar");
    userAvatar.textContent = user.name
      ? user.name.charAt(0).toUpperCase()
      : "User";
    // Info
    const userInfo = document.createElement("div");
    userInfo.classList.add("user-info");
    const userName = document.createElement("h3");
    userName.classList.add("user-name");
    userName.textContent = user.name;
    // Preview (uses data from User object)
    const lastMessagePreview = document.createElement("p");
    lastMessagePreview.classList.add("last-message-preview");
    let previewText = user.lastMessageText || "";
    lastMessagePreview.textContent =
      previewText.length > 30
        ? previewText.substring(0, 27) + "..."
        : previewText || "No messages yet";
    // Availability/Time
    const availabilitySpan = document.createElement("span");
    availabilitySpan.classList.add("availability");
    let subText = user.availability || "Offline"; // Use stored availability
    if (user.lastMessageTimestamp) {
      subText += ` • ${formatTimestamp(user.lastMessageTimestamp)}`; // Use stored timestamp
    }
    availabilitySpan.textContent = subText;
    // Assemble Info
    userInfo.appendChild(userName);
    userInfo.appendChild(lastMessagePreview);
    userInfo.appendChild(availabilitySpan);
    // Assemble Item
    li.appendChild(userAvatar);
    li.appendChild(userInfo);
    li.addEventListener("click", () => this.#handleUserSelected(user));
    return li;
  }

  /** Loads the first conversation or placeholder */
  async #loadInitialConversation() {
    const users = await this.#dbService.getAll<User>(USERS_STORE);
    // Sort by stored timestamp to potentially load the most recent chat first
    users.sort(
      (a, b) => (b.lastMessageTimestamp ?? 0) - (a.lastMessageTimestamp ?? 0)
    );
    if (users.length > 0) {
      await this.#handleUserSelected(users[0]);
    } else {
      this.#cur_user = null;
      this.#updateConversationHeader("Select a chat");
      this.#showConversationPlaceholder("No users available.");
      this.#updateActiveUserHighlight();
    }
  }

  /** Updates highlighting in the user list */
  #updateActiveUserHighlight() {
    this.#messagesListUL
      ?.querySelectorAll(".message-item.active")
      .forEach((el) => el.classList.remove("active"));
    if (this.#cur_user) {
      const activeItem = this.#messagesListUL?.querySelector(
        `.message-item[data-user-name="${this.#cur_user.name}"]`
      );
      activeItem?.classList.add("active");
    }
  }

  // Event Handlers / Actions

  #handleInputKeyPress = (event: KeyboardEvent): void => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      this.#handleSendMessage();
    }
  };

  #triggerFileInput = (): void => {
    this.#hiddenFileInput?.click();
  };

  #handleFileSelected = (event: Event): void => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.#processAndSendFile(file); // Use dedicated method
    input.value = ""; // Reset
  };

  #handleSearchInput = (event: Event) => {
    const searchTerm = (event.target as HTMLInputElement).value;
    if (this.#searchDebounceTimer) clearTimeout(this.#searchDebounceTimer);
    this.#searchDebounceTimer = window.setTimeout(() => {
      // Re-render user list with filter
      this.#renderUserList(searchTerm).catch((err) =>
        console.error("Search failed:", err)
      );
    }, 300);
  };

  #handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    this.#conversationView?.classList.add("drag-over");
    if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
  };
  #handleDragLeave = (e: DragEvent) => {
    if (!this.#conversationView?.contains(e.relatedTarget as Node))
      this.#conversationView?.classList.remove("drag-over");
  };
  #handleDrop = (e: DragEvent) => {
    e.preventDefault();
    this.#conversationView?.classList.remove("drag-over");
    if (!this.#cur_user) {
      alert("Select chat first.");
      return;
    }
    const file = e.dataTransfer?.files?.[0];
    if (file) this.#processAndSendFile(file); // Use dedicated method
  };

  /** Handles user selection from the list */
  #handleUserSelected = async (selectedUser: User) => {
    if (this.#cur_user?.name === selectedUser.name) return;
    this.#cur_user = selectedUser;
    this.#updateActiveUserHighlight();
    this.#updateConversationHeader(selectedUser.name); // Update header (includes response time again)
    await this.#renderConversationMessages(selectedUser);
  };

  /** Handles sending a text message */
  #handleSendMessage = async () => {
    if (!this.#cur_user || !this.#messageInput?.value.trim()) return;
    const text = this.#messageInput.value.trim();
    this.#messageInput.value = ""; // Clear input

    const newMessage: Message = {
      sender: "You",
      receiver: this.#cur_user.name,
      text: text,
      timestamp: Date.now(),
    };
    await this.#saveAndUpdate(newMessage); // Use common save/update logic
  };

  /** Processes and sends a file */
  #processAndSendFile = async (file: File) => {
    if (!this.#cur_user) {
      alert("Select chat first.");
      return;
    } // Safety check
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      alert(`File type not allowed: ${file.type}.`);
      return;
    }

    const newMessage: Message = {
      sender: "You",
      receiver: this.#cur_user.name,
      file: file,
      fileName: file.name,
      fileType: file.type,
      timestamp: Date.now(),
    };
    await this.#saveAndUpdate(newMessage); // Use common save/update logic
  };

  /** Common logic to save message, update UI, and update user preview */
  async #saveAndUpdate(newMessage: Message) {
    if (!this.#cur_user) return; // Should have a current user here

    try {
      // 1. Save the message
      const savedMessage = await this.#saveMessageToDB(newMessage);

      // 2. Update Conversation View
      this.#renderSingleMessageElement(savedMessage);
      this.#scrollToBottom();

      // 3. Update User Store & List Item (Simplified Preview Logic)
      const previewText = savedMessage.text ?? `File: ${savedMessage.fileName}`;
      await this.#updateUserStoreAndPreview(
        this.#cur_user.name,
        previewText,
        savedMessage.timestamp
      );
    } catch (error) {
      console.error("Failed to save/update:", error);
      alert("Failed to send message or update status.");
    }
  }

  /** Updates User store and DOM list item */
  async #updateUserStoreAndPreview(
    userName: string,
    text: string,
    timestamp: number
  ) {
    try {
      // Fetch the user
      const user = await this.#dbService.get<User>(USERS_STORE, userName);
      if (!user) return; // User not found

      // Update preview fields
      user.lastMessageText = text;
      user.lastMessageTimestamp = timestamp;

      // Save updated user back to DB
      await this.#dbService.put(USERS_STORE, user);

      // Update the DOM list item directly (more efficient than full re-render)
      const listItem = this.#messagesListUL?.querySelector<HTMLElement>(
        `.message-item[data-user-name="${userName}"]`
      );
      if (listItem) {
        const previewEl = listItem.querySelector<HTMLParagraphElement>(
          ".last-message-preview"
        );
        const availabilityEl =
          listItem.querySelector<HTMLSpanElement>(".availability");
        if (previewEl)
          previewEl.textContent =
            text.length > 30 ? text.substring(0, 27) + "..." : text;
        if (availabilityEl)
          availabilityEl.textContent = `${user.availability} • ${formatTimestamp(timestamp)}`;
        // Move to top
        if (
          this.#messagesListUL &&
          listItem !== this.#messagesListUL.firstChild
        ) {
          this.#messagesListUL.insertBefore(
            listItem,
            this.#messagesListUL.firstChild
          );
        }
      } else {
        // If item not found (e.g., due to search filter), trigger a full list re-render
        await this.#renderUserList(this.#searchInput?.value ?? "");
      }
    } catch (error) {
      console.error(
        `Failed to update user store/preview for ${userName}:`,
        error
      );
    }
  }

  /** Fetches and renders messages */
  async #renderConversationMessages(selectedUser: User) {
    if (!this.#conversationMessagesContainer) return;
    this.#conversationMessagesContainer.innerHTML = "";
    try {
      const messages = await this.#getMessagesForChat(selectedUser.name);
      if (messages.length === 0)
        this.#showConversationPlaceholder(
          `No messages with ${selectedUser.name}.`
        );
      else messages.forEach((msg) => this.#renderSingleMessageElement(msg));
    } catch (error) {
      this.#showConversationPlaceholder("Error loading messages.", true);
    }
    this.#scrollToBottom();
  }

  /** Renders a single message element (text or file) */
  #renderSingleMessageElement(message: Message) {
    if (!this.#conversationMessagesContainer) return;
    const messageWrapper = document.createElement("div");
    messageWrapper.classList.add("message-wrapper");
    const messageDiv = document.createElement("div");
    messageDiv.classList.add(
      "message",
      message.sender === "You" ? "sent" : "received"
    );
    // File display
    if (message.file && message.fileName) {
      messageDiv.classList.add("file-message");
      const fileIcon = getFileIcon(message.fileType);
      const fileLink = document.createElement("a");
      fileLink.href = "#";
      fileLink.dataset.messageId = message.id?.toString();
      fileLink.innerHTML = `${fileIcon} <span>${message.fileName}</span> <small>(${(message.file.size / 1024).toFixed(1)} KB)</small>`;
      fileLink.title = "Click to download";
      fileLink.addEventListener("click", this.#handleDownloadClick); // Use central handler
      messageDiv.appendChild(fileLink);
    } else {
      // Text display
      const messageContent = document.createElement("p");
      messageContent.textContent = message.text || "";
      messageDiv.appendChild(messageContent);
    }
    const messageTime = document.createElement("span");
    messageTime.classList.add("message-time");
    messageTime.textContent = formatTimestamp(message.timestamp); // Use full format util
    messageWrapper.appendChild(messageDiv);
    messageWrapper.appendChild(messageTime);
    this.#conversationMessagesContainer.appendChild(messageWrapper);
  }

  /** Central handler for download clicks */
  #handleDownloadClick = async (event: Event) => {
    event.preventDefault();
    const target = event.currentTarget as HTMLElement;
    const messageIdStr = target.dataset.messageId;
    if (messageIdStr) {
      const messageId = parseInt(messageIdStr, 10);
      await this.#downloadFile(messageId); // Call download logic
    }
  };

  /** Logic to download the file */
  async #downloadFile(messageId: number): Promise<void> {
    try {
      const message = await this.#dbService.get<Message>(
        MESSAGES_STORE,
        messageId
      );
      if (message?.file && message.fileName) {
        const url = URL.createObjectURL(message.file);
        const a = document.createElement("a");
        a.href = url;
        a.download = message.fileName;
        a.click();
        URL.revokeObjectURL(url);
        a.remove();
      } else {
        throw new Error("File data missing.");
      }
    } catch (error) {
      console.error("Download failed:", error);
      alert("Could not download file.");
    }
  }

  /** Updates conversation header */
  #updateConversationHeader(userName: string) {
    if (!this.#conversationHeader) return;
    this.#conversationHeader.innerHTML = "";
    const userNameElement = document.createElement("h2");
    userNameElement.textContent = userName;
    const responseTime = document.createElement("p"); // Restored response time
    responseTime.classList.add("response-time");
    responseTime.textContent =
      userName !== "Select a chat" ? "Response time : 1 hour" : "";
    this.#conversationHeader.appendChild(userNameElement);
    this.#conversationHeader.appendChild(responseTime);
  }

  /** Shows placeholder message */
  #showConversationPlaceholder(text: string, isError: boolean = false): void {
    if (!this.#conversationMessagesContainer) return;
    const placeholder = document.createElement("p");
    placeholder.textContent = text;
    placeholder.classList.add("conversation-placeholder");
    if (isError) placeholder.classList.add("error-message");
    this.#conversationMessagesContainer.innerHTML = "";
    this.#conversationMessagesContainer.appendChild(placeholder);
  }

  /** Scrolls message container down */
  #scrollToBottom() {
    if (this.#conversationMessagesContainer)
      this.#conversationMessagesContainer.scrollTop =
        this.#conversationMessagesContainer.scrollHeight;
  }

  // Data Logic (using Service)
  async #getMessagesForChat(userName: string): Promise<Message[]> {
    const toUserQuery = IDBKeyRange.only([userName]);
    const fromUserQuery = IDBKeyRange.only([userName]);
    const messagesToUser = await this.#dbService.queryIndex<Message>(
      MESSAGES_STORE,
      "receiverTimestampIdx",
      toUserQuery
    );
    const messagesFromUser = await this.#dbService.queryIndex<Message>(
      MESSAGES_STORE,
      "senderTimestampIdx",
      fromUserQuery
    );
    const allMessages = [...messagesToUser, ...messagesFromUser];
    allMessages.sort((a, b) => a.timestamp - b.timestamp);
    return allMessages;
  }
  async #saveMessageToDB(message: Message): Promise<Message> {
    const savedKey = await this.#dbService.put<Message>(
      MESSAGES_STORE,
      message
    );
    return { ...message, id: savedKey as number };
  }
}
