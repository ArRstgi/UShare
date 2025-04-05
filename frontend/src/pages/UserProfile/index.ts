import { BaseComponent } from "@/components/BaseComponent";

interface ProfileDetails {
  skillsTeach: string;
  skillsLearn: string;
  availability: string;
}

export class UserProfilePage extends BaseComponent {
  #container: HTMLElement | null = null;
  #db?: IDBDatabase;
  #profilePhotoData: string | null = null;
  #uploadAreaVisible: boolean = false;
  #profileDetails: ProfileDetails = {
    skillsTeach: "Music production, Singing, Badminton, Math",
    skillsLearn: "Snowboarding, Skating, Juggling, Web Development",
    availability: "Mondays - Fridays: 2:00 PM to 4:00 PM; Saturday - Sunday: 2:00 PM to 7:00 PM"
  };
  #editDetailsMode: boolean = false;

  constructor() {
    super();
    this.loadCSS("src/pages/UserProfile", "styles");
    this.initIndexedDB();
  }

  
  initIndexedDB() {
    const request = indexedDB.open("UShareDB", 3);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("userProfilePhoto")) {
        db.createObjectStore("userProfilePhoto");
      }
      if (!db.objectStoreNames.contains("userProfileDetails")) {
        db.createObjectStore("userProfileDetails");
      }
    };
    request.onsuccess = () => {
      this.#db = request.result;
      this.loadFinalPhoto();
      this.loadProfileDetails();
    };
    request.onerror = () => console.error("IndexedDB error:", request.error);
  }

  // Photo methods
  loadFinalPhoto(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.#db) { reject("DB not initialized"); return; }
      const tx = this.#db.transaction("userProfilePhoto", "readonly");
      const store = tx.objectStore("userProfilePhoto");
      const getRequest = store.get("userPhoto");
      getRequest.onsuccess = () => {
        if (getRequest.result) {
          this.#profilePhotoData = getRequest.result;
          const profilePhotoEl = this.#container?.querySelector(".profile-photo") as HTMLElement;
          if (profilePhotoEl) {
            profilePhotoEl.style.backgroundImage = `url(${this.#profilePhotoData})`;
          }
        }
        resolve();
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  saveFinalPhoto(data: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.#db) { reject("DB not initialized"); return; }
      const tx = this.#db.transaction("userProfilePhoto", "readwrite");
      const store = tx.objectStore("userProfilePhoto");
      const putRequest = store.put(data, "userPhoto");
      putRequest.onsuccess = () => {
        console.log("Final photo saved to IndexedDB");
        resolve();
      };
      putRequest.onerror = () => reject(putRequest.error);
    });
  }

  // Save temporary photo as soon as file is dropped/selected
  saveTempPhoto(data: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.#db) { reject("DB not initialized"); return; }
      const tx = this.#db.transaction("userProfilePhoto", "readwrite");
      const store = tx.objectStore("userProfilePhoto");
      const putRequest = store.put(data, "tempUserPhoto");
      putRequest.onsuccess = () => {
        console.log("Temp photo saved to IndexedDB.");
        resolve();
      };
      putRequest.onerror = () => reject(putRequest.error);
    });
  }

  loadTempPhoto(): Promise<string | null> {
    return new Promise((resolve, reject) => {
      if (!this.#db) { reject("DB not initialized"); return; }
      const tx = this.#db.transaction("userProfilePhoto", "readonly");
      const store = tx.objectStore("userProfilePhoto");
      const getRequest = store.get("tempUserPhoto");
      getRequest.onsuccess = () => {
        resolve(getRequest.result || null);
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  deleteTempPhoto(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.#db) { reject("DB not initialized"); return; }
      const tx = this.#db.transaction("userProfilePhoto", "readwrite");
      const store = tx.objectStore("userProfilePhoto");
      const deleteRequest = store.delete("tempUserPhoto");
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    });
  }

  // Profile Details methods
  loadProfileDetails(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.#db) { reject("DB not initialized"); return; }
      const tx = this.#db.transaction("userProfileDetails", "readonly");
      const store = tx.objectStore("userProfileDetails");
      const getRequest = store.get("profileDetails");
      getRequest.onsuccess = () => {
        if (getRequest.result) {
          this.#profileDetails = getRequest.result;
        }
        resolve();
        this.updateLeftContent();
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  saveProfileDetails(details: ProfileDetails): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.#db) { reject("DB not initialized"); return; }
      const tx = this.#db.transaction("userProfileDetails", "readwrite");
      const store = tx.objectStore("userProfileDetails");
      const putRequest = store.put(details, "profileDetails");
      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
    });
  }

  // Render method
  render(): HTMLElement {
    if (this.#container) return this.#container;
    this.#container = document.createElement("div");
    this.#container.classList.add("user-profile-page");
    this.#setupContainerContent();
    return this.#container;
  }

  // Set up the main container content
  #setupContainerContent() {
    if (!this.#container) return;
    this.#container.innerHTML = "";

    const header = document.createElement("header");

    const mainContent = document.createElement("main");
    mainContent.classList.add("main-content");

    // Left content: profile details
    const leftContent = document.createElement("div");
    leftContent.classList.add("left-content");
    leftContent.innerHTML = "";
    leftContent.appendChild(this.createDetailsSection());

    // Right content: photo and upload
    const rightContent = document.createElement("div");
    rightContent.classList.add("right-content");

    const profilePhoto = document.createElement("div");
    profilePhoto.classList.add("profile-photo");
    if (this.#profilePhotoData) {
      profilePhoto.style.backgroundImage = `url(${this.#profilePhotoData})`;
    }

    const editPhotoButton = document.createElement("button");
    editPhotoButton.classList.add("edit-button");
    editPhotoButton.innerText = "Edit photo";
    editPhotoButton.addEventListener("click", () => {
      this.toggleUploadArea();
    });

    rightContent.appendChild(profilePhoto);
    rightContent.appendChild(editPhotoButton);

    // Upload area container (initially hidden)
    let uploadAreaContainer = this.#container.querySelector(".upload-area-container") as HTMLElement;
    if (!uploadAreaContainer) {
      uploadAreaContainer = document.createElement("div");
      uploadAreaContainer.classList.add("upload-area-container");
      uploadAreaContainer.style.display = "none";
      rightContent.appendChild(uploadAreaContainer);
    }

    mainContent.appendChild(leftContent);
    mainContent.appendChild(rightContent);

    this.#container.appendChild(header);
    this.#container.appendChild(mainContent);
  }

  // Create the left panel details section (view or edit mode)
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
      const editBtn = document.createElement("button");
      editBtn.innerText = "Edit Details";
      editBtn.addEventListener("click", () => {
        this.toggleEditDetails();
      });
      section.appendChild(editBtn);
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
      const saveBtn = document.createElement("button");
      saveBtn.innerText = "Save";
      saveBtn.addEventListener("click", () => {
        const skillsTeach = (section.querySelector("#skillsTeach") as HTMLInputElement).value;
        const skillsLearn = (section.querySelector("#skillsLearn") as HTMLInputElement).value;
        const availability = (section.querySelector("#availability") as HTMLInputElement).value;
        const updatedDetails: ProfileDetails = { skillsTeach, skillsLearn, availability };
        this.saveProfileDetails(updatedDetails)
          .then(() => {
            this.#profileDetails = updatedDetails;
            this.#editDetailsMode = false;
            this.updateLeftContent();
            alert("Profile details updated successfully!");
          })
          .catch((err) => console.error("Error saving details:", err));
      });
      section.appendChild(saveBtn);
      const cancelBtn = document.createElement("button");
      cancelBtn.innerText = "Cancel";
      cancelBtn.addEventListener("click", () => {
        this.#editDetailsMode = false;
        this.updateLeftContent();
      });
      section.appendChild(cancelBtn);
    }
    return section;
  }

  toggleEditDetails() {
    this.#editDetailsMode = true;
    this.updateLeftContent();
  }

  updateLeftContent() {
    const leftContent = this.#container?.querySelector(".left-content") as HTMLElement;
    if (leftContent) {
      leftContent.innerHTML = "";
      leftContent.appendChild(this.createDetailsSection());
    }
  }


  // Toggle the upload area visibility; if showing, create fresh upload area
  toggleUploadArea() {
    let container = this.#container?.querySelector(".upload-area-container") as HTMLElement;
    if (!container) {
      container = document.createElement("div");
      container.classList.add("upload-area-container");
      container.style.display = "block";
      const rightContent = this.#container?.querySelector(".right-content");
      if (rightContent) {
        rightContent.appendChild(container);
      }
      container.appendChild(this.createUploadArea());
      this.#uploadAreaVisible = true;
    } else {
      this.#uploadAreaVisible = !this.#uploadAreaVisible;
      if (this.#uploadAreaVisible) {
        container.innerHTML = "";
        container.style.display = "block";
        container.appendChild(this.createUploadArea());
      } else {
        container.style.display = "none";
      }
    }
  }

  // Create the drag-and-drop upload area with preview and confirmation
  createUploadArea(): HTMLElement {
    const area = document.createElement("div");
    area.classList.add("upload-area");
    area.innerHTML = `
      <p>Drag and drop your photo here, or click to select a file.</p>
      <div class="preview-container" style="display: none;">
        <img class="preview-image" src="" alt="Preview" style="max-width:100%; max-height:300px;"/>
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

    area.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "P" || target.classList.contains("upload-area")) {
        fileInput.click();
      }
    });

    area.addEventListener("dragover", (e) => {
      e.preventDefault();
      area.classList.add("drag-over");
    });
    area.addEventListener("dragleave", (e) => {
      e.preventDefault();
      area.classList.remove("drag-over");
    });
    area.addEventListener("drop", (e) => {
      e.preventDefault();
      area.classList.remove("drag-over");
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        this.processFile(file, area);
      }
    });

    fileInput.addEventListener("change", (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        this.processFile(target.files[0], area);
      }
    });

    area.querySelector(".confirm-upload")?.addEventListener("click", (evt) => {
      evt.stopPropagation();
      this.loadTempPhoto()
        .then((tempData) => {
          if (tempData) {
            const profilePhotoEl = this.#container?.querySelector(".profile-photo") as HTMLElement;
            if (profilePhotoEl) {
              profilePhotoEl.style.backgroundImage = `url(${tempData})`;
            }
            return this.saveFinalPhoto(tempData)
              .then(() => this.deleteTempPhoto())
              .then(() => {
                this.#profilePhotoData = tempData;
                alert("Photo uploaded and saved successfully!");
                this.clearUploadArea(area);
              });
          } else {
            alert("No photo found in temporary storage");
          }
        })
        .catch((err) => console.error("Error during confirm:", err));
    });

    area.querySelector(".cancel-upload")?.addEventListener("click", (evt) => {
      evt.stopPropagation();
      this.deleteTempPhoto()
        .then(() => {
          this.clearUploadArea(area);
        })
        .catch((err) => console.error("Error during cancel:", err));
    });

    return area;
  }

  //save it immediately as temporary data and update preview using the stored value
  processFile(file: File, area: HTMLElement) {
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      this.saveTempPhoto(result)
        .then(() => this.loadTempPhoto())
        .then((tempData) => {
          if (tempData) {
            const previewContainer = area.querySelector(".preview-container") as HTMLElement;
            const previewImage = area.querySelector(".preview-image") as HTMLImageElement;
            if (previewContainer && previewImage) {
              previewImage.src = tempData;
              previewContainer.style.display = "block";
            }
          }
        })
        .catch((err) => console.error("Error processing file:", err));
    };
    reader.readAsDataURL(file);
  }

  // Clear preview and hide the upload area
  clearUploadArea(area: HTMLElement) {
    const previewContainer = area.querySelector(".preview-container") as HTMLElement;
    if (previewContainer) {
      previewContainer.style.display = "none";
      const previewImage = area.querySelector(".preview-image") as HTMLImageElement;
      if (previewImage) previewImage.src = "";
    }
    const container = area.closest(".upload-area-container") as HTMLElement;
    if (container) {
      container.style.display = "none";
    }
    this.#uploadAreaVisible = false;
  }

  // Simulate asynchronous upload
  simulatePhotoUpload(data: string): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 1000);
    });
  }
}
