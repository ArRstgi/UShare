import { BaseComponent } from "@/components/BaseComponent";

interface ProfileDetails {
  skillsTeach: string;
  skillsLearn: string;
  availability: string;
}

export class UserProfilePage extends BaseComponent {
  #container: HTMLElement | null = null;
  // TODO: replace this with real (per‑user) ID once we add authentication
  #profileId = "1";

  #profilePhotoUrl: string | null = null;
  #profileDetails: ProfileDetails = {
    skillsTeach: "",
    skillsLearn: "",
    availability: ""
  };

  #editDetailsMode = false;
  #uploadAreaVisible = false;
  #selectedFile: File | null = null;

  constructor() {
    super();
    this.loadCSS("src/pages/UserProfile", "styles");
  }

  render(): HTMLElement {
    if (this.#container) return this.#container;
    this.#container = document.createElement("div");
    this.#container.classList.add("user-profile-page");
    this.#setupContainerContent();
    this.loadProfile();
    return this.#container;
  }

  // Fetch the profile from the Express backend
  async loadProfile(): Promise<void> {
    try {
      const res = await fetch(`http://localhost:3000/profile/${this.#profileId}`);
      // if it's not found, auto-create a brand‑new profile
      if (res.status === 404) {
        const createRes = await fetch(`http://localhost:3000/profile`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            skillsTeach: "",
            skillsLearn: "",
            availability: ""
          })
        });
        if (!createRes.ok) throw new Error(`Create failed ${createRes.status}`);
        const created = await createRes.json();
        // get real id
        this.#profileId = created.id;
        // reload with the fresh profile
        return this.loadProfile();
      }
      if (!res.ok) throw new Error(`GET failed ${res.status}`);
  
      const data = await res.json();
      this.#profileDetails = {
        skillsTeach: data.skillsTeach,
        skillsLearn: data.skillsLearn,
        availability: data.availability
      };
      this.#profilePhotoUrl = data.photoUrl || null;
      this.updateLeftContent();
      this.updatePhoto();
    } catch (err) {
      console.error("Failed to load or create profile:", err);
    }
  }

  updatePhoto() {
    const el = this.#container?.querySelector(".profile-photo") as HTMLElement;
    if (el && this.#profilePhotoUrl) {
      el.style.backgroundImage = `url(${this.#profilePhotoUrl})`;
    }
  }

  #setupContainerContent() {
    if (!this.#container) return;
    this.#container.innerHTML = "";

    const header = document.createElement("header");

    const main = document.createElement("main");
    main.classList.add("main-content");

    // Left: details
    const left = document.createElement("div");
    left.classList.add("left-content");
    left.appendChild(this.createDetailsSection());

    // Right: photo + edit
    const right = document.createElement("div");
    right.classList.add("right-content");

    const photo = document.createElement("div");
    photo.classList.add("profile-photo");
    right.appendChild(photo);

    const editBtn = document.createElement("button");
    editBtn.classList.add("edit-button");
    editBtn.innerText = "Edit photo";
    editBtn.addEventListener("click", () => this.toggleUploadArea());
    right.appendChild(editBtn);

    // container for upload area (hidden by default)
    const uploadContainer = document.createElement("div");
    uploadContainer.classList.add("upload-area-container");
    uploadContainer.style.display = "none";
    right.appendChild(uploadContainer);

    main.append(left, right);
    this.#container.append(header, main);
  }

  createDetailsSection(): HTMLElement {
    const section = document.createElement("div");
    section.classList.add("profile-details");

    if (!this.#editDetailsMode) {
      section.innerHTML = `
        <h1>Username: James</h1>
        <p>UMass Amherst Student</p>
        <div>
          <strong>Skills I can teach:</strong>
          <p>${this.#profileDetails.skillsTeach}</p>
        </div>
        <div>
          <strong>Skills I want to learn:</strong>
          <p>${this.#profileDetails.skillsLearn}</p>
        </div>
        <div>
          <strong>Availability:</strong>
          <p>${this.#profileDetails.availability}</p>
        </div>
      `;
      const btn = document.createElement("button");
      btn.innerText = "Edit Details";
      btn.addEventListener("click", () => {
        this.#editDetailsMode = true;
        this.updateLeftContent();
      });
      section.appendChild(btn);
    } else {
      section.innerHTML = `
        <h1>Edit Profile Details</h1>
        <div>
          <label>Skills I can teach:</label>
          <input type="text" id="skillsTeach" value="${this.#profileDetails.skillsTeach}" />
        </div>
        <div>
          <label>Skills I want to learn:</label>
          <input type="text" id="skillsLearn" value="${this.#profileDetails.skillsLearn}" />
        </div>
        <div>
          <label>Availability:</label>
          <input type="text" id="availability" value="${this.#profileDetails.availability}" />
        </div>
      `;
      const save = document.createElement("button");
      save.innerText = "Save";
      save.addEventListener("click", () => this.handleSaveDetails(section));
      const cancel = document.createElement("button");
      cancel.innerText = "Cancel";
      cancel.addEventListener("click", () => {
        this.#editDetailsMode = false;
        this.updateLeftContent();
      });
      section.append(save, cancel);
    }

    return section;
  }

  updateLeftContent() {
    const left = this.#container?.querySelector(".left-content") as HTMLElement;
    if (left) {
      left.innerHTML = "";
      left.appendChild(this.createDetailsSection());
    }
  }

  async handleSaveDetails(section: HTMLElement) {
    const skillsTeach = (section.querySelector("#skillsTeach") as HTMLInputElement).value;
    const skillsLearn = (section.querySelector("#skillsLearn") as HTMLInputElement).value;
    const availability = (section.querySelector("#availability") as HTMLInputElement).value;

    try {
      const res = await fetch(`http://localhost:3000/profile/${this.#profileId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillsTeach, skillsLearn, availability })
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const updated = await res.json();
      this.#profileDetails = {
        skillsTeach: updated.skillsTeach,
        skillsLearn: updated.skillsLearn,
        availability: updated.availability
      };
      this.#editDetailsMode = false;
      this.updateLeftContent();
      alert("Profile details updated");
    } catch (err) {
      console.error("Failed to save details:", err);
      alert("Could not save profile details");
    }
  }

  toggleUploadArea() {
    const container = this.#container!.querySelector(
      ".upload-area-container"
    ) as HTMLElement;
    if (this.#uploadAreaVisible) {
      container.style.display = "none";
    } else {
      container.style.display = "block";
      container.innerHTML = "";
      container.appendChild(this.createUploadArea());
    }
    this.#uploadAreaVisible = !this.#uploadAreaVisible;
  }

  createUploadArea(): HTMLElement {
    const area = document.createElement("div");
    area.classList.add("upload-area");
    area.innerHTML = `
      <p>Drag & drop your photo here or click to select</p>
      <div class="preview-container" style="display:none;">
        <img class="preview-image" alt="Preview" style="max-width:100%;max-height:300px;"/>
        <div class="preview-buttons">
          <button class="confirm-upload">Confirm</button>
          <button class="cancel-upload">Cancel</button>
        </div>
      </div>
    `;
  
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.style.display = "none";
    area.appendChild(fileInput);
  
    
    area.addEventListener("click", () => fileInput.click());
  
    // drag feedback
    area.addEventListener("dragover", e => {
      e.preventDefault();
      area.classList.add("drag-over");
    });
    area.addEventListener("dragleave", e => {
      e.preventDefault();
      area.classList.remove("drag-over");
    });
    area.addEventListener("drop", e => {
      e.preventDefault();
      area.classList.remove("drag-over");
      if (e.dataTransfer?.files[0]) this.processFile(e.dataTransfer.files[0], area);
    });
  
    // when you pick a file via the picker
    fileInput.addEventListener("change", () => {
      if (fileInput.files?.[0]) this.processFile(fileInput.files[0], area);
    });
  
    // confirm button: STOP the click from bubbling back up to 'area'
    const confirmBtn = area.querySelector(".confirm-upload")!;
    confirmBtn.addEventListener("click", evt => {
      evt.stopPropagation();
      this.handleUploadConfirm(area);
    });
  
    // cancel button: likewise stop propagation
    const cancelBtn = area.querySelector(".cancel-upload")!;
    cancelBtn.addEventListener("click", evt => {
      evt.stopPropagation();
      this.clearUploadArea(area);
    });
  
    return area;
  }

  processFile(file: File, area: HTMLElement) {
    this.#selectedFile = file;
    const previewC = area.querySelector(".preview-container") as HTMLElement;
    const img = area.querySelector(".preview-image") as HTMLImageElement;
    img.src = URL.createObjectURL(file);
    previewC.style.display = "block";
  }

  async handleUploadConfirm(area: HTMLElement) {
    if (!this.#selectedFile) {
      alert("No file chosen");
      return;
    }
    const fd = new FormData();
    fd.append("photo", this.#selectedFile);
  
    try {
      const res = await fetch(
        `http://localhost:3000/profile/${this.#profileId}/photo`,
        { method: "POST", body: fd }
      );
      if (!res.ok) throw new Error(`Status ${res.status}`);
      // we don’t even need the JSON here—just reload the profile
      await this.loadProfile();
  
      alert("Photo uploaded!");
      this.clearUploadArea(area);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Could not upload photo");
    }
  }

  clearUploadArea(area: HTMLElement) {
    this.#selectedFile = null;
    const p = area.querySelector(".preview-container") as HTMLElement;
    p.style.display = "none";
    (p.querySelector(".preview-image") as HTMLImageElement).src = "";
    this.toggleUploadArea();
  }
}
