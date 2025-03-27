import { BaseComponent } from "@/components/BaseComponent";

export class UserProfilePage extends BaseComponent {
  #container: HTMLElement | null = null;

  constructor() {
    super();
    this.loadCSS("src/pages/UserProfile", "styles");
  }

  // Render method as required by BaseComponent
  render(): HTMLElement {
    if (this.#container) {
      return this.#container;
    }

  
    this.#container = document.createElement("div");
    this.#container.classList.add("user-profile-page");

  
    this.#setupContainerContent();

    return this.#container;
  }

  #setupContainerContent() {
    if (!this.#container) return;


    const header = document.createElement("header");

    const logo = document.createElement("div");
    logo.classList.add("logo");
    logo.innerText = "UShare";

    const navButtons = document.createElement("div");
    navButtons.classList.add("nav-buttons");

    ["Home", "Matches", "Messages"].forEach((btnText) => {
      const button = document.createElement("button");
      button.innerText = btnText;
      navButtons.appendChild(button);
    });

    header.appendChild(logo);
    header.appendChild(navButtons);


    const mainContent = document.createElement("main");
    mainContent.classList.add("main-content");

    // Left content
    const leftContent = document.createElement("div");
    leftContent.classList.add("left-content");

    leftContent.innerHTML = `
      <h1>Username: James</h1>
      <p>UMass Amherst Student</p>
      <div>
        <strong>Skills I can teach:</strong>
        <ul>
          <li>Music production</li>
          <li>Singing</li>
          <li>Badminton</li>
          <li>Math</li>
        </ul>
      </div>
      <div>
        <strong>Skills I want to learn:</strong>
        <ul>
          <li>Snowboarding</li>
          <li>Skating</li>
          <li>Juggling</li>
          <li>Web Development</li>
        </ul>
      </div>
      <div>
        <strong>Availability:</strong>
        <ul>
          <li>Mondays - Fridays: 2:00 PM to 4:00 PM</li>
          <li>Saturday - Sunday: 2:00 PM to 7:00 PM</li>
        </ul>
      </div>
    `;

    // Right content
    const rightContent = document.createElement("div");
    rightContent.classList.add("right-content");

    const profilePhoto = document.createElement("div");
    profilePhoto.classList.add("profile-photo");

    const editButton = document.createElement("button");
    editButton.classList.add("edit-button");
    editButton.innerText = "Edit photo";

    rightContent.appendChild(profilePhoto);
    rightContent.appendChild(editButton);

    mainContent.appendChild(leftContent);
    mainContent.appendChild(rightContent);

  
    const footer = document.createElement("footer");

    const footerLeft = document.createElement("div");
    footerLeft.classList.add("footer-left");
    footerLeft.innerText = "UShare";

    const footerRight = document.createElement("div");
    footerRight.classList.add("footer-right");

  
    for (let i = 0; i < 3; i++) {
      const footerColumn = document.createElement("div");
      footerColumn.classList.add("footer-column");
      footerColumn.innerHTML = `
        <h4>Topic</h4>
        <p>Page</p>
        <p>Page</p>
        <p>Page</p>
        <p>Page</p>
      `;
      footerRight.appendChild(footerColumn);
    }

    footer.appendChild(footerLeft);
    footer.appendChild(footerRight);

    // Add everything to the main container
    this.#container.appendChild(header);
    this.#container.appendChild(mainContent);
    this.#container.appendChild(footer);
  }
}