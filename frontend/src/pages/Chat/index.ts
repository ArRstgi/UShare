import { BaseComponent } from "@/components/BaseComponent";


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


export class ChatPage extends BaseComponent {
  #container: HTMLElement | null = null;
  #messagesList: HTMLElement | null = null;
  #conversationView: HTMLElement | null = null;
  #messageInput: HTMLInputElement | null = null;
  #sendMessageButton: HTMLButtonElement | null = null;
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
    this.#populateMessagesList();


    this.#conversationView = document.createElement("main");
    this.#conversationView.classList.add("conversation-view");
    this.#setupConversationHeader("User 2");
    this.#setupConversationMessages();
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


    const users: User[] = [
      { name: "User 1", lastMessage: "Hi", date: "May 27, 2022", availability: "Online" },
      { name: "User 2", lastMessage: "Hi", time: "10:54 PM", availability: "Offline" },
      { name: "User 3", lastMessage: "Hi", date: "May 28, 2022", availability: "Busy" },
      { name: "User 4", lastMessage: "Thank you for your inquiry...", date: "May 28, 2022", availability: "Online" },
      { name: "User 5", lastMessage: "Hi", date: "May 29, 2022", availability: "Away" },
      { name: "User 6", lastMessage: "Hi", date: "May 29, 2022", availability: "Online" },
    ];


    const ul = document.createElement("ul");
    users.forEach(user => {
      const li = document.createElement("li");
      li.classList.add("message-item");
      li.dataset.userName = user.name;


      if (user.name === "User 2") {
        li.classList.add("active");
        this.#cur_user = user;
      }


      const userAvatar = document.createElement("div");
      userAvatar.classList.add("user-avatar");
      userAvatar.textContent = user.name.charAt(0);


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
    if (!this.#messagesList || !this.#conversationView) return;


    this.#messagesList.querySelectorAll(".message-item.active").forEach(item => {
      item.classList.remove("active");
    });


    this.#messagesList.querySelectorAll(`.message-item[data-user-name="${selectedUser.name}"]`).forEach(item => {
      item.classList.add("active");
    });


    this.#cur_user = selectedUser;


    this.#setupConversationHeader(selectedUser.name);


    this.#setupConversationMessages();
  }


  /**
   * Sets up or updates the header of the conversation view with the
   * name of the currently selected user.
   * @param userName The name of the user whose chat is currently open.
   */
  #setupConversationHeader(userName: string) {
    if (!this.#conversationView) return;


    const header = this.#conversationView.querySelector(".conversation-header");
    if (header) {
      const userNameElement = header.querySelector("h2");
      if (userNameElement) {
        userNameElement.textContent = userName;
      }
    } else {
      const newHeader = document.createElement("header");
      newHeader.classList.add("conversation-header");
      const userNameElement = document.createElement("h2");
      userNameElement.textContent = userName;
      const responseTime = document.createElement("p");
      responseTime.classList.add("response-time");
      responseTime.textContent = "Response time : 1 hour";
      newHeader.appendChild(userNameElement);
      newHeader.appendChild(responseTime);


      const existingHeader = this.#conversationView.querySelector(".conversation-header");
      if (existingHeader) {
        this.#conversationView.replaceChild(newHeader, existingHeader);
      } else {
        this.#conversationView.prepend(newHeader);
      }
    }
  }


  /**
   * Sets up or updates the display of messages within the conversation view.
   * Currently, it uses the same dummy message data for all chats.
   */
  #setupConversationMessages() {
    if (!this.#conversationView) return;


    let messagesContainer = this.#conversationView.querySelector(".conversation-messages");
    if (messagesContainer) {
      messagesContainer.innerHTML = '';
    } else {
      messagesContainer = document.createElement("div");
      messagesContainer.classList.add("conversation-messages");
    }


    const messages: Message[] = [
      { sender: "User 2", text: "Hi", time: "10:54 PM", date: "May 28, 2022"},
      { sender: "You", text: "Hi , I want to swim , could you help . Hi , I want to swim , could you help . Hi , I want to swim , could you help . Hi , I want to swim , could you help . Hi , I want to swim , could you help . Hi , I want to swim , could you help . Hi , I want to swim , could you help .", time: "10:54 PM", date: "May 28, 2022"},
      { sender: "User 3", text: "Hi I know how to swim . I have lots of certifications . I swim most days of the week . I have good reviews .", time: "6:39 AM", date: "May 28, 2022" },
      { sender: "N - UMass", text: "Thank you for your inquiry and please let me know if there's anything I can do to help you swim .", time: "", date: "May 28, 2022" },
    ];


    messages.forEach(message => {
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
        timeText = `${message.time}, ${message.date}`;
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


    const existingMessagesContainer = this.#conversationView.querySelector(".conversation-messages");
    if (existingMessagesContainer) {
      this.#conversationView.replaceChild(messagesContainer, existingMessagesContainer);
    } else {
      this.#conversationView.appendChild(messagesContainer);
    }
  }


  /**
   * Sets up the input area at the bottom of the conversation view,
   * including the text input field and the send button.
   */
  #setupMessageInputArea() {
    if (!this.#conversationView) return;


    const inputArea = this.#conversationView.querySelector(".message-input-area");
    if (!inputArea) {
      const newInputArea = document.createElement("div");
      newInputArea.classList.add("message-input-area");


      this.#messageInput = document.createElement("input");
      this.#messageInput.type = "text";
      this.#messageInput.placeholder = "Type a message";


      this.#sendMessageButton = document.createElement("button");
      this.#sendMessageButton.textContent = "Send";


      newInputArea.appendChild(this.#messageInput);
      newInputArea.appendChild(this.#sendMessageButton);


      this.#conversationView.appendChild(newInputArea);
    } else {
      this.#messageInput = inputArea.querySelector("input[type='text']");
      this.#sendMessageButton = inputArea.querySelector("button");
    }
  }


  /**
   * Attaches event listeners to the interactive elements of the chat page,
   * such as the send message button.
   */
  #attachEventListeners() {
    if (this.#sendMessageButton) {
      this.#sendMessageButton.addEventListener("click", () => {
        if (this.#messageInput && this.#messageInput.value && this.#cur_user) {
          const now = new Date();
          const newMessage: Message = {
            sender: "You",
            text: this.#messageInput.value,
            time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            date: now.toLocaleDateString(),
          };
          const conversationMessages = this.#conversationView?.querySelector(".conversation-messages");
          if (conversationMessages) {
            const messageWrapper = document.createElement("div");
            messageWrapper.classList.add("message-wrapper");


            const messageDiv = document.createElement("div");
            messageDiv.classList.add("message", "sent");
            const messageContent = document.createElement("p");
            messageContent.textContent = newMessage.text;
            messageDiv.appendChild(messageContent);


            const messageTime = document.createElement("span");
            messageTime.classList.add("message-time");
            messageTime.textContent = `${newMessage.time}, ${newMessage.date}`;


            messageWrapper.appendChild(messageDiv);
            messageWrapper.appendChild(messageTime);
            conversationMessages.appendChild(messageWrapper);
            this.#messageInput.value = "";
          }
        }
      });
    }
  }
}