import { BaseComponent } from "@/components/BaseComponent";
import { Navbar } from "@/components/Navbar/index";
import { SignUpPage } from "@/pages/SignUp";

export class LoginPage extends BaseComponent {
  #container: HTMLElement | null = null;

  constructor() {
    super();
    this.loadCSS("src/pages/Login", "login");
  }

  render(): HTMLElement {
    if (this.#container) return this.#container;
    this.#container = document.createElement("div");
    this.#container.classList.add("login-page");

    const navbar = new Navbar();
    this.#container.appendChild(navbar.render());

    // Create the login container.
    const loginContainer = document.createElement("div");
    loginContainer.classList.add("login-container");

    const logo = document.createElement("h1");
    logo.classList.add("logo");
    logo.innerText = "UShare";

    const form = document.createElement("form");
    form.classList.add("login-form");
    form.innerHTML = `
      <h2>Login</h2>
      <label for="email">Email</label>
      <input type="email" id="email" placeholder="you@example.com" required />
      <label for="password">Password</label>
      <input type="password" id="password" placeholder="••••••••" required />
      <button type="submit">Sign In</button>
      <p class="signup-link">Don't have an account? <a href="#">Sign up</a></p>
    `;

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      this.#handleFormSubmit();
    });

    // Add signup link event: redirect to sign up page.
    const signupLink = form.querySelector(".signup-link a");
    signupLink?.addEventListener("click", (e) => {
      e.preventDefault();
      const signUpPage = new SignUpPage();
      document.body.innerHTML = "";
      document.body.appendChild(signUpPage.render());
    });

    loginContainer.appendChild(logo);
    loginContainer.appendChild(form);
    this.#container.appendChild(loginContainer);

    return this.#container;
  }

  #handleFormSubmit() {
    const emailInput = document.getElementById("email") as HTMLInputElement;
    const passwordInput = document.getElementById("password") as HTMLInputElement;
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    if (email && password) {
      alert(`Logging in with Email: ${email}`);
      // Add actual login logic or API calls here.
    } else {
      alert("Please fill in both fields.");
    }
  }
}
