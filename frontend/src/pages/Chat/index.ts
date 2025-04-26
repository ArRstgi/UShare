import { BaseComponent } from "@/components/BaseComponent";
import { ALLOWED_FILE_TYPES, paperclipIconSVG } from "./constants";
import type { User, Message } from "./types";
import { formatTimestamp, getFileIcon } from "./chat-utils";
import { ApiService } from "@/services/api-service";

/**
 * Controller for the Chat Page, managing state, DB, and DOM directly.
 */
export class ChatPage extends BaseComponent {
  // Main container
  #container: HTMLElement | null = null;

  // Service

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
      await this.#renderUserList(); // Initial list render
      await this.#loadInitialConversation();
    } catch (error) {
      console.error("Failed to initialize chat page:", error);
      this.#showConversationPlaceholder("Error loading chat.", true);
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
      const users = await ApiService.getUsers();

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
    try {
      const users = await ApiService.getUsers();
      if (users.length > 0) {
        await this.#handleUserSelected(users[0]); // Select the first user
      } else {
        this.#cur_user = null;
        this.#updateConversationHeader("Select a chat");
        this.#showConversationPlaceholder("No users available.");
        this.#updateActiveUserHighlight();
      }
    } catch (error) {
      console.error("Failed to load initial conversation users:", error);
      this.#showConversationPlaceholder("Error loading user list.", true);
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
    this.#updateConversationHeader(selectedUser.name);
    // Pass "You" (current frontend user) and selected user's name
    await this.#renderConversationMessages("You", selectedUser.name);
  };

  /** Handles sending a text message */
  #handleSendMessage = async () => {
    if (!this.#cur_user || !this.#messageInput?.value.trim()) return;
    const text = this.#messageInput.value.trim();
    const receiverName = this.#cur_user.name;
    this.#messageInput.value = ""; // Clear input

    try {
      const newMessageFromApi = await ApiService.sendMessage(
        "You",
        receiverName,
        text
      );
      this.#renderSingleMessageElement(newMessageFromApi); // Render API response
      this.#scrollToBottom();
      await this.#renderUserList(this.#searchInput?.value ?? ""); // Refresh user list
    } catch (error) {
      console.error("Failed to send message:", error);
      alert(
        `Failed to send message: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  };

  /** Processes and sends a file */
  #processAndSendFile = async (file: File) => {
    if (!this.#cur_user) {
      /* alert */ return;
    }
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      /* alert */ return;
    }
    const receiverName = this.#cur_user.name;

    try {
      const newMessageFromApi = await ApiService.sendMessage(
        "You",
        receiverName,
        undefined, // No text content
        file
      );
      this.#renderSingleMessageElement(newMessageFromApi); // Render API response
      this.#scrollToBottom();
      await this.#renderUserList(this.#searchInput?.value ?? ""); // Refresh user list
    } catch (error) {
      console.error("Failed to send file:", error);
      alert(
        `Failed to send file: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  };

  /** Fetches and renders messages */
  async #renderConversationMessages(
    currentUser: string,
    selectedUserName: string
  ) {
    if (!this.#conversationMessagesContainer) return;
    this.#conversationMessagesContainer.innerHTML = ""; // Clear existing messages

    try {
      const messages = await ApiService.getMessages(
        currentUser,
        selectedUserName
      );
      if (messages.length === 0) {
        this.#showConversationPlaceholder(
          `No messages with ${selectedUserName}. Start the conversation!`
        );
      } else {
        messages.forEach((msg) => this.#renderSingleMessageElement(msg));
      }
    } catch (error) {
      console.error("Error loading messages:", error);
      this.#showConversationPlaceholder("Error loading messages.", true);
    }
    this.#scrollToBottom();
  }

  /** Renders a single message element (text or file) */
  #renderSingleMessageElement(message: Message) {
    if (!this.#conversationMessagesContainer) return;
    const placeholder = this.#conversationMessagesContainer.querySelector(
      ".conversation-placeholder"
    );
    if (placeholder) placeholder.remove();

    const messageWrapper = document.createElement("div");
    messageWrapper.classList.add("message-wrapper");
    const messageDiv = document.createElement("div");
    messageDiv.classList.add(
      "message",
      message.sender === "You" ? "sent" : "received"
    );

    // File display: Use backend fields
    if (message.filePath && message.fileName) {
      messageDiv.classList.add("file-message");
      const fileIcon = getFileIcon(message.fileType); // Use backend fileType
      const fileLink = document.createElement("a");
      fileLink.href = "#"; // Let click handler trigger download
      fileLink.dataset.messageId = message.id?.toString(); // Use backend string ID
      fileLink.innerHTML = `${fileIcon} <span>${message.fileName}</span>`;
      fileLink.title = "Click to download";
      fileLink.addEventListener("click", this.#handleDownloadClick);
      messageDiv.appendChild(fileLink);
    } else {
      // Text display
      const messageContent = document.createElement("p");
      messageContent.textContent = message.text || "";
      messageDiv.appendChild(messageContent);
    }
    const messageTime = document.createElement("span");
    messageTime.classList.add("message-time");
    messageTime.textContent = formatTimestamp(message.timestamp);
    messageWrapper.appendChild(messageDiv);
    messageWrapper.appendChild(messageTime);
    this.#conversationMessagesContainer.appendChild(messageWrapper);
  }

  /** Central handler for download clicks */
  #handleDownloadClick = (event: Event) => {
    // No async needed
    event.preventDefault();
    const target = event.currentTarget as HTMLElement;
    const messageId = target.dataset.messageId; // Get the string ID from dataset
    if (messageId) {
      ApiService.downloadFile(messageId); // Trigger download via service
    } else {
      console.error("Message ID missing for download");
      alert("Cannot download file: missing ID.");
    }
  };

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
}
