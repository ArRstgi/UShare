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
    // Create a <nav> element to hold the navigation bar
    const nav = document.createElement("nav");
    nav.id = "navbar";
    nav.classList.add("navbar");

    // Create a <span> element for the "UShare" text
    const ushare = document.createElement("span");
    ushare.textContent = "UShare";
    ushare.classList.add("ushare");

    // Create a <div> element to hold the navigation links
    const linksContainer = document.createElement("div");
    linksContainer.classList.add("nav-links");
    linksContainer.innerHTML = `
      <a href="/home" id="home">Home</a>
      <a href="/chat" id="chat">Chat</a>
      <a href="/profile" id="profile">Profile</a>
      <a href="/login" id="login">Login</a>
    `;

    // Get all the anchor tags within the links container
    const links = linksContainer.querySelectorAll("a");

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

    // Append "UShare" and the links container to the navigation bar
    nav.appendChild(ushare);
    nav.appendChild(linksContainer);

    // Return the populated navigation bar element
    return nav;
  }
}