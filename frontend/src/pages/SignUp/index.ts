import { BaseComponent } from "@/components/BaseComponent";
import { LoginPage } from "@/pages/Login";

interface RegistrationData {
  email?: string;
  fullname?: string;
  username?: string;
  password?: string;
}

export class SignUpPage extends BaseComponent {
  #container: HTMLElement | null = null;
  #currentStep: number = 1;
  #registrationData: RegistrationData = {};

  constructor() {
    super();
    this.loadCSS("src/pages/SignUp", "signup");
    this.initIndexedDB();
  }

  initIndexedDB() {
    const request = indexedDB.open("UShareDB", 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("registration")) {
        db.createObjectStore("registration");
      }
    };
    request.onerror = () => console.error("IndexedDB error:", request.error);
  }

  // Load saved registration progress from IndexedDB.
  loadProgress(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("UShareDB", 1);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction("registration", "readonly");
        const store = tx.objectStore("registration");
        const getRequest = store.get("currentRegistration");
        getRequest.onsuccess = () => {
          if (getRequest.result) {
            this.#registrationData = getRequest.result;
          }
          resolve();
        };
        getRequest.onerror = () => reject(getRequest.error);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Delete registration progress after a successful submission.
  deleteProgress(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("UShareDB", 1);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction("registration", "readwrite");
        const store = tx.objectStore("registration");
        const deleteRequest = store.delete("currentRegistration");
        deleteRequest.onsuccess = () => resolve();
        deleteRequest.onerror = () => reject(deleteRequest.error);
      };
      request.onerror = () => reject(request.error);
    });
  }

  render(): HTMLElement {
    if (this.#container) return this.#container;
    this.#container = document.createElement("div");
    this.#container.classList.add("signup-page");

    // Load saved data before setting up the form.
    this.loadProgress()
      .then(() => {
        this.setupContent();
      })
      .catch((err) => console.error("Failed to load progress:", err));

    return this.#container;
  }

  setupContent() {
    if (!this.#container) return;
    this.#container.innerHTML = "";
    const container = document.createElement("div");
    container.classList.add("signup-container");

    const logo = document.createElement("h1");
    logo.classList.add("logo");
    logo.innerText = "UShare";

    const form = document.createElement("form");
    form.classList.add("signup-form");
    form.innerHTML = this.getStepHTML(this.#currentStep);

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleSubmit();
    });

    container.appendChild(logo);
    container.appendChild(form);
    this.#container.appendChild(container);
    this.setupStepButtons(form);
  }

  getStepHTML(step: number): string {
    if (step === 1) {
      return `
        <h2>Sign Up - Step 1</h2>
        <label for="email">Email</label>
        <input type="email" id="email" placeholder="you@example.com" required value="${this.#registrationData.email ?? ''}" />
        <label for="fullname">Full Name</label>
        <input type="text" id="fullname" placeholder="Your full name" required value="${this.#registrationData.fullname ?? ''}" />
        <button type="button" id="nextBtn">Next</button>
      `;
    } else if (step === 2) {
      return `
        <h2>Sign Up - Step 2</h2>
        <label for="username">Username</label>
        <input type="text" id="username" placeholder="Username" required value="${this.#registrationData.username ?? ''}" />
        <label for="password">Password</label>
        <input type="password" id="password" placeholder="Password" required value="${this.#registrationData.password ?? ''}" />
        <label for="confirmPassword">Confirm Password</label>
        <input type="password" id="confirmPassword" placeholder="Confirm Password" required />
        <button type="button" id="prevBtn">Previous</button>
        <button type="submit">Submit</button>
      `;
    }
    return "";
  }

  setupStepButtons(form: HTMLFormElement) {
    if (this.#currentStep === 1) {
      const nextBtn = form.querySelector("#nextBtn");
      nextBtn?.addEventListener("click", () => {
        const emailInput = form.querySelector("#email") as HTMLInputElement;
        const fullnameInput = form.querySelector("#fullname") as HTMLInputElement;
        const email = emailInput.value.trim();
        const fullname = fullnameInput.value.trim();
        if (!email || !fullname) {
          alert("Please fill in all fields.");
          return;
        }
        if (!this.isValidEmail(email)) {
          alert("Please enter a valid email.");
          return;
        }
        this.#registrationData.email = email;
        this.#registrationData.fullname = fullname;
        this.saveProgress(this.#registrationData);
        this.#currentStep = 2;
        this.setupContent();
      });
    } else if (this.#currentStep === 2) {
      const prevBtn = form.querySelector("#prevBtn");
      prevBtn?.addEventListener("click", () => {
        const usernameInput = form.querySelector("#username") as HTMLInputElement;
        const passwordInput = form.querySelector("#password") as HTMLInputElement;
        this.#registrationData.username = usernameInput.value.trim();
        this.#registrationData.password = passwordInput.value;
        this.saveProgress(this.#registrationData);
        this.#currentStep = 1;
        this.setupContent();
      });
    }
  }

  isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  async saveProgress(data: RegistrationData): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("UShareDB", 1);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction("registration", "readwrite");
        const store = tx.objectStore("registration");
        store.put(data, "currentRegistration");
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      };
      request.onerror = () => reject(request.error);
    });
  }

  handleSubmit() {
    const form = this.#container?.querySelector("form");
    if (!form) return;
    const usernameInput = form.querySelector("#username") as HTMLInputElement;
    const passwordInput = form.querySelector("#password") as HTMLInputElement;
    const confirmPasswordInput = form.querySelector("#confirmPassword") as HTMLInputElement;
    if (passwordInput.value !== confirmPasswordInput.value) {
      alert("Passwords do not match!");
      return;
    }
    this.#registrationData.username = usernameInput.value.trim();
    this.#registrationData.password = passwordInput.value;
    this.saveProgress(this.#registrationData).then(() => {
      this.simulateServerSubmission(this.#registrationData);
    });
  }

  simulateServerSubmission(data: RegistrationData) {
    setTimeout(() => {
      alert("Registration successful! Data submitted asynchronously.");
      // Delete the saved registration data after a successful registration.
      this.deleteProgress()
        .then(() => {
          // Redirect to Login Page after deletion.
          const loginPage = new LoginPage();
          document.body.innerHTML = "";
          document.body.appendChild(loginPage.render());
        })
        .catch((err) => console.error("Failed to delete progress:", err));
    }, 1000);
  }
}
