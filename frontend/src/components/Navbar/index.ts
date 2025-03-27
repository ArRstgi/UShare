import { Events, EventHub } from "@/lib/eventhub";
import { BaseComponent } from "@/components/BaseComponent";

export class Navbar extends BaseComponent {
  #hub: EventHub | null = null;

  constructor() {
    super();
    this.#hub = EventHub.getInstance();
    this.loadCSS("src/components/Navbar", "styles");
  }

  render() {
    // Create a <div> element to hold the navigation bar
    const container = document.createElement("nav");
    container.id = "navbar";
    container.classList.add("navbar");

    // Populate the <div> element with the navigation links
    container.innerHTML = `
      <a href="/home" id="home">Home</a>
      <a href="/chat" id="chat">Chat</a>
      <a href="/profile" id="profile">Profile</a> 
    `;

    // Get all the anchor tags within the <div> element
    const links = container.querySelectorAll("a");

    // Add event listeners to each anchor tag
    links.forEach((link) => {
      link.addEventListener("click", async (e) => {
        // Prevent the default anchor tag behavior
        e.preventDefault();
        if (!this.#hub) return;

        // Get the page name from the href attribute
        const page = link.getAttribute("href");

        // TODO: Clear session and rerender when log out
        // if (page === "/logout") {
        //   await clearSession();
        //   await this.#hub.publish("rerenderNav");
        //   await this.#hub.publish("navigateTo", "/home");
        //   return;
        // }

        // Call the navigateTo function with the view name
        this.#hub.publish(Events.NavigateTo, page);
      });
    });

    // Return the populated navigation bar element
    return container;
  }
}