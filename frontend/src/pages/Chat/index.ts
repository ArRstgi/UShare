import { BaseComponent } from "@/components/BaseComponent";

const paperclipIconSVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-paperclip">
  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
</svg>`;

interface User {
  name: string;
  lastMessage: string;
  date?: string;
  time?: string;
  availability: string;
}

interface Message {
  sender: string;
  text: string;
  time?: string;
  date?: string;
}

// Dummy users data

const users: User[] = [
  {
    name: "User 1",
    lastMessage: "Hi",
    date: "May 27, 2022",
    availability: "Online",
  },
  {
    name: "User 2",
    lastMessage: "Hi",
    time: "10:54 PM",
    availability: "Offline",
  },
  {
    name: "User 3",
    lastMessage: "Hi",
    date: "May 28, 2022",
    availability: "Busy",
  },
  {
    name: "User 4",
    lastMessage: "Thank you for your inquiry...",
    date: "May 28, 2022",
    availability: "Online",
  },
  {
    name: "User 5",
    lastMessage: "Hi",
    date: "May 29, 2022",
    availability: "Away",
  },
  {
    name: "User 6",
    lastMessage: "Hi",
    date: "May 29, 2022",
    availability: "Online",
  },
];

export class ChatPage extends BaseComponent {
  #container: HTMLElement | null = null;
  #messagesList: HTMLElement | null = null;
  #conversationView: HTMLElement | null = null;
  #messageInput: HTMLInputElement | null = null;
  #sendMessageButton: HTMLButtonElement | null = null;
  #attachFileButton: HTMLButtonElement | null = null; // Added for paperclip
  #searchInput: HTMLInputElement | null = null; // Added for search bar
  #cur_user: User | null = null;

  constructor() {
    super();
    this.loadCSS("src/pages/Chat", "styles");
  }

  render() {
    if (this.#container) {
      return this.#container;
    }

    this.#container = document.createElement("div");
    this.#container.classList.add("messages-page");
    this.#setupContainerContent();
    this.#attachEventListeners();

    return this.#container;
  }

  /**
   * Sets up the main content structure of the chat page.
   * This includes creating the left sidebar for the messages list
   * and the right section for the current conversation view.
   */
  #setupContainerContent() {
    if (!this.#container) return;

    this.#messagesList = document.createElement("aside");
    this.#messagesList.classList.add("messages-list");
    const messagesTitle = document.createElement("h2");
    messagesTitle.textContent = "Messages";
    this.#messagesList.appendChild(messagesTitle);

    // Search Bar
    this.#searchInput = document.createElement("input");
    this.#searchInput.type = "search";
    this.#searchInput.placeholder = "Search messages";
    this.#searchInput.classList.add("messages-search-input");
    this.#messagesList.appendChild(this.#searchInput);

    this.#populateMessagesList();

    this.#conversationView = document.createElement("main");
    this.#conversationView.classList.add("conversation-view");
    const initialUser = users[0];
    this.#setupConversationHeader(initialUser?.name || "Select a chat");
    this.#setupConversationMessages(initialUser);
    this.#setupMessageInputArea();

    this.#container.appendChild(this.#messagesList);
    this.#container.appendChild(this.#conversationView);
  }

  /**
   * Populates the left sidebar with a list of users and their last messages.
   * It creates the necessary DOM elements for each user and attaches
   * a click event listener to handle switching to their chat.
   */
  #populateMessagesList() {
    if (!this.#messagesList) return;

    const initialActiveUser = users[0];

    const ul = document.createElement("ul");
    users.forEach((user) => {
      const li = document.createElement("li");
      li.classList.add("message-item");
      li.dataset.userName = user.name;

      // Set the active class based on the initialActiveUser
      if (initialActiveUser && user.name === initialActiveUser.name) {
        li.classList.add("active");
        this.#cur_user = user; // Set the current user
      }

      const userAvatar = document.createElement("div");
      userAvatar.classList.add("user-avatar");
      // Use first letter of the name, fallback to 'User'
      userAvatar.textContent = user.name
        ? user.name.charAt(0).toUpperCase()
        : "User";

      const userInfo = document.createElement("div");
      userInfo.classList.add("user-info");

      const userName = document.createElement("h3");
      userName.classList.add("user-name");
      userName.textContent = user.name;

      const availability = document.createElement("span");
      availability.classList.add("availability");
      availability.textContent = user.availability || "Offline";

      userInfo.appendChild(userName);
      userInfo.appendChild(availability);

      li.appendChild(userAvatar);
      li.appendChild(userInfo);
      ul.appendChild(li);

      li.addEventListener("click", () => {
        this.#handleChatSwitch(user);
      });
    });
    this.#messagesList.appendChild(ul);
  }

  /**
   * Handles the logic for switching between different chats when a user
   * in the messages list is clicked. This updates the active highlight,
   * the current user, the conversation header, and the displayed messages.
   * @param selectedUser The user object representing the chat to switch to.
   */
  #handleChatSwitch(selectedUser: User) {
    if (
      !this.#messagesList ||
      !this.#conversationView ||
      this.#cur_user?.name === selectedUser.name
    )
      return; // Don't re-render if same user clicked

    // Remove active class from previously active item
    const currentActive = this.#messagesList.querySelector(
      ".message-item.active"
    );
    if (currentActive) {
      currentActive.classList.remove("active");
    }

    // Add active class to the newly selected item
    const newActiveItem = this.#messagesList.querySelector(
      `.message-item[data-user-name="${selectedUser.name}"]`
    );
    if (newActiveItem) {
      newActiveItem.classList.add("active");
    }

    this.#cur_user = selectedUser;

    // Update conversation view
    this.#setupConversationHeader(selectedUser.name);
    this.#setupConversationMessages(selectedUser); // Pass selected user
  }

  /**
   * Sets up or updates the header of the conversation view with the
   * name of the currently selected user.
   * @param userName The name of the user whose chat is currently open.
   */
  #setupConversationHeader(userName: string) {
    if (!this.#conversationView) return;

    let header = this.#conversationView.querySelector(".conversation-header");

    if (!header) {
      header = document.createElement("header");
      header.classList.add("conversation-header");
      this.#conversationView.prepend(header); // Add header at the beginning
    }

    // Clear previous content and rebuild
    header.innerHTML = "";

    const userNameElement = document.createElement("h2");
    userNameElement.textContent = userName;

    const responseTime = document.createElement("p");
    responseTime.classList.add("response-time");
    // Only show response time if a user is selected (not on "Select a chat")
    responseTime.textContent =
      userName !== "Select a chat" ? "Response time : 1 hour" : "";

    header.appendChild(userNameElement);
    header.appendChild(responseTime);
  }

  /**
   * Sets up or updates the display of messages within the conversation view.
   * It fetches or filters messages based on the currently selected user.
   * @param selectedUser The user whose chat messages should be displayed. Can be null.
   */
  #setupConversationMessages(selectedUser: User | null) {
    if (!this.#conversationView) return;

    let messagesContainer = this.#conversationView.querySelector(
      ".conversation-messages"
    );

    // Create container if it doesn't exist
    if (!messagesContainer) {
      messagesContainer = document.createElement("div");
      messagesContainer.classList.add("conversation-messages");
      // Insert after header, before input area
      const header = this.#conversationView.querySelector(
        ".conversation-header"
      );
      const inputArea = this.#conversationView.querySelector(
        ".message-input-area"
      );
      if (header && inputArea) {
        this.#conversationView.insertBefore(messagesContainer, inputArea);
      } else if (header) {
        header.insertAdjacentElement("afterend", messagesContainer);
      } else {
        this.#conversationView.appendChild(messagesContainer);
      }
    }

    // Clear previous messages
    messagesContainer.innerHTML = "";

    // If no user is selected, display a placeholder message
    if (!selectedUser) {
      const placeholder = document.createElement('p');
      placeholder.textContent = 'Select a chat to start messaging.';
      placeholder.style.textAlign = 'center';
      placeholder.style.color = '#6c757d';
      messagesContainer.appendChild(placeholder);
      return;
    }

    // Dummy messages data
    const messages: Message[] = [
      { sender: selectedUser.name, text: "Hi", time: "10:54 PM", date: "May 28, 2022"},
      { sender: "You", text: "Hi , I want to swim , could you help . Hi , I want to swim , could you help . Hi , I want to swim , could you help . Hi , I want to swim , could you help . Hi , I want to swim , could you help . Hi , I want to swim , could you help . Hi , I want to swim , could you help .", time: "10:54 PM", date: "May 28, 2022"},
      { sender: selectedUser.name, text: "Hi I know how to swim . I have lots of certifications . I swim most days of the week . I have good reviews .", time: "6:39 AM", date: "May 28, 2022" },
      { sender: selectedUser.name, text: "Thank you for your inquiry and please let me know if there's anything I can do to help you swim .", time: "", date: "May 28, 2022" }, 
    ];

    messages.forEach((message) => {
      const messageWrapper = document.createElement("div");
      messageWrapper.classList.add("message-wrapper");

      const messageDiv = document.createElement("div");
      messageDiv.classList.add("message");
      if (message.sender === "You") {
        messageDiv.classList.add("sent");
      } else {
        messageDiv.classList.add("received");
      }

      const messageContent = document.createElement("p");
      messageContent.textContent = message.text;
      messageDiv.appendChild(messageContent);

      const messageTime = document.createElement("span");
      messageTime.classList.add("message-time");
      let timeText = "";
      if (message.time && message.date) {
        // Check if time is AM/PM format already
        const timeSuffix =
          message.time.includes("AM") || message.time.includes("PM");
        timeText = timeSuffix
          ? `${message.time}, ${message.date}`
          : `${message.time} ${message.date}`; // Simple concatenation if not AM/PM
      } else if (message.time) {
        timeText = message.time;
      } else if (message.date) {
        timeText = message.date;
      }

      messageTime.textContent = timeText;

      messageWrapper.appendChild(messageDiv);
      messageWrapper.appendChild(messageTime);
      messagesContainer?.appendChild(messageWrapper);
    });

    // Scroll to the bottom of the messages
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  /**
   * Sets up the input area at the bottom of the conversation view,
   * including the text input field, attach button, and the send button.
   */
  #setupMessageInputArea() {
    if (!this.#conversationView) return;

    let inputArea = this.#conversationView.querySelector(".message-input-area");

    if (!inputArea) {
      inputArea = document.createElement("div");
      inputArea.classList.add("message-input-area");

      this.#messageInput = document.createElement("input");
      this.#messageInput.type = "text";
      this.#messageInput.placeholder = "Type a message";

      // Attach Button
      this.#attachFileButton = document.createElement("button");
      this.#attachFileButton.classList.add("attach-file-button");
      this.#attachFileButton.type = "button"; // Prevent form submission
      this.#attachFileButton.title = "Drag and Drop or Select File";
      this.#attachFileButton.innerHTML = paperclipIconSVG; // Use SVG content

      this.#sendMessageButton = document.createElement("button");
      this.#sendMessageButton.textContent = "Send";
      this.#sendMessageButton.type = "button"; // Good practice

      inputArea.appendChild(this.#messageInput);
      inputArea.appendChild(this.#attachFileButton); // Add paperclip before send
      inputArea.appendChild(this.#sendMessageButton);

      this.#conversationView.appendChild(inputArea);
    } else {
      this.#messageInput = inputArea.querySelector("input[type='text']");
      this.#attachFileButton = inputArea.querySelector(".attach-file-button");
      this.#sendMessageButton = inputArea.querySelector(
        "button:not(.attach-file-button)"
      );
    }
  }

  /**
   * Adds a new message to the conversation view.
   * @param message The message object to add.
   */
  #addMessageToView(message: Message) {
    if (!this.#conversationView) return;
    const messagesContainer = this.#conversationView.querySelector(
      ".conversation-messages"
    );
    if (!messagesContainer) return;

    const messageWrapper = document.createElement("div");
    messageWrapper.classList.add("message-wrapper");

    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message");
    if (message.sender === "You") {
      messageDiv.classList.add("sent");
    } else {
      messageDiv.classList.add("received");
    }

    const messageContent = document.createElement("p");
    messageContent.textContent = message.text;
    messageDiv.appendChild(messageContent);

    const messageTime = document.createElement("span");
    messageTime.classList.add("message-time");
    let timeText = "";
    if (message.time && message.date) {
      // Use locale specific formats
      timeText = `${message.time}, ${message.date}`;
    } else if (message.time) {
      timeText = message.time;
    } else if (message.date) {
      timeText = message.date;
    }
    messageTime.textContent = timeText;

    messageWrapper.appendChild(messageDiv);
    messageWrapper.appendChild(messageTime);
    messagesContainer.appendChild(messageWrapper);

    // Scroll to the bottom to show the new message
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  /**
   * Attaches event listeners to the interactive elements of the chat page,
   * such as the send message button and message input field.
   */
  #attachEventListeners() {
    // Send message on button click
    if (this.#sendMessageButton) {
      this.#sendMessageButton.addEventListener("click", () =>
        this.#sendMessage()
      );
    }

    // Send message on Enter key press in the input field
    if (this.#messageInput) {
      this.#messageInput.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
          event.preventDefault(); // Prevent default form submission or line break
          this.#sendMessage();
        }
      });
    }

    if (this.#attachFileButton) {
      this.#attachFileButton.addEventListener("click", () => {
        console.log("Attach file button clicked");
        // TODO: Implement Drag and Drop logic
      });
    }

    if (this.#searchInput) {
      this.#searchInput.addEventListener("input", (event) => {
        const searchTerm = (event.target as HTMLInputElement).value;
        console.log("Search term:", searchTerm);
        // TODO: Implement search/filter logic
      });
    }
  }

  /**
   * Sends the message currently typed in the input field.
   */
  #sendMessage() {
    if (
      this.#messageInput &&
      this.#messageInput.value.trim() &&
      this.#cur_user
    ) {
      const now = new Date();
      const newMessage: Message = {
        sender: "You",
        text: this.#messageInput.value.trim(),
        time: now.toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
        date: now.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      };

      // Add the message to the UI
      this.#addMessageToView(newMessage);

      // Clear the input field
      this.#messageInput.value = "";
    }
  }
}