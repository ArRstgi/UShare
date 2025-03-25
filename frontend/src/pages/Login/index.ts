import { BaseComponent } from "@/components/BaseComponent";
import { Events, EventHub } from "@/lib/eventhub";

export class LoginPage extends BaseComponent {
  #container: HTMLElement | null = null;

  constructor() {
    super();
    // this.loadCSS("LoginPage");
  }

  render() {
    if (this.#container) {
      return this.#container;
    }

    this.#container = document.createElement("div");
    this.#container.classList.add("login-page");
    this.#setupContainerContent();
    this.#attachEventListeners();

    return this.#container;
  }

  #setupContainerContent() {
    if (!this.#container) return;
    this.#container.innerHTML = `
      <div>
        <h1>Login</h1>
        <div>You will implement the login form here.</div>
        <p>Also, the site is just very plain too. Make sure to add some CSS to spice it up :D</p>
      </div>
    `;
  }

  #attachEventListeners() {
    if (!this.#container) return;
  }
}
