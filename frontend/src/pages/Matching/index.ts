import { BaseComponent } from "@/components/BaseComponent";

export class Matching extends BaseComponent {
  #container: HTMLElement | null = null;

  constructor() {
    super();
    this.loadCSS("src/pages/Matching", "styles");
  }

  render(): HTMLElement {
    if (this.#container) {
      return this.#container;
    }

    this.#container = document.createElement("div");
    this.#container.classList.add("matching-page");

    this.#setupContainerContent();

    return this.#container;
  }

  #setupContainerContent() {
    if (!this.#container) return;

    // Navbar
    const navbar = document.createElement("div");
    navbar.classList.add("navbar");

    const logo = document.createElement("div");
    logo.classList.add("logo");

    const navLinks = document.createElement("div");
    navLinks.classList.add("nav-links");

    navbar.appendChild(navLinks);

    // Search Bar
    const searchContainer = document.createElement("div");
    searchContainer.classList.add("search-container");

    const searchBar = document.createElement("input");
    searchBar.type = "text";
    searchBar.classList.add("search-bar");
    searchBar.placeholder = "Search...";

    searchContainer.appendChild(searchBar);

    // Card Container
    const containerWrapper = document.createElement("div");
    containerWrapper.classList.add("container-wrapper");

    const cardContainer = document.createElement("div");
    cardContainer.classList.add("card-container");

    // TODO After we connect to the database, this will be populated from the database
    for (let i = 0; i < 14; i++) {
      const card = document.createElement("div");
      card.classList.add("card");

      const cardHeader = document.createElement("div");
      cardHeader.style.display = "flex";
      cardHeader.style.alignItems = "center";

      const profilePic = document.createElement("div");
      profilePic.classList.add("profile-pic");

      const username = document.createElement("h4");
      username.innerText = "username";

      cardHeader.appendChild(profilePic);
      cardHeader.appendChild(username);

      const image = document.createElement("img");
      image.src = "src/assets/swimmer.jpg";
      image.alt = "User Activity";

      const description = document.createElement("div");
      description.classList.add("description");
      description.innerText = "This is a sample description that may get cut off if it is too long. This is a sample description that may get cut off if it is too long. This is a sample description that may get cut off if it is too long.";

      const buttons = document.createElement("div");
      buttons.classList.add("buttons");

      const matchButton = document.createElement("button");
      matchButton.classList.add("match-btn");
      matchButton.innerText = "Match";

      const moreButton = document.createElement("button");
      moreButton.classList.add("more-btn");
      moreButton.innerText = "More";

      buttons.appendChild(matchButton);
      buttons.appendChild(moreButton);

      card.appendChild(cardHeader);
      card.appendChild(image);
      card.appendChild(description);
      card.appendChild(buttons);

      cardContainer.appendChild(card);
    }

    containerWrapper.appendChild(cardContainer);

    // Append elements to container
    this.#container.appendChild(navbar);
    this.#container.appendChild(searchContainer);
    this.#container.appendChild(containerWrapper);
  }
}