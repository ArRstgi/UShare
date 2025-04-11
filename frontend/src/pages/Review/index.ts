import { BaseComponent } from "@/components/BaseComponent";

export class ReviewPage extends BaseComponent {
  #container: HTMLElement | null = null;

  constructor() {
    super();
    this.#initIndexedDB();
    this.loadCSS("src/pages/Review", "style");
  }

  async #initIndexedDB() {
    // Make dummy data
    const dummyReviewData = [
      {
        stars: 3,
        teacherName: "James",
        skill: "Singing",
        reviewerName: "David",
        date: "2/23/25",
        reviewText: "James was a great singing coach, although he was late to a few sessions.",
      },
      {
        stars: 5,
        teacherName: "Sarah",
        skill: "Dancing",
        reviewerName: "David",
        date: "3/16/25",
        reviewText: "Sarah was an amazing dance teacher, she was always on time and very patient.",
      },
      {
        stars: 4,
        teacherName: "John",
        skill: "Piano",
        reviewerName: "David",
        date: "3/12/25",
        reviewText: "John was a great piano teacher, he was always on time and very patient.",
      },
      {
        stars: 2,
        teacherName: "Emma",
        skill: "Violin",
        reviewerName: "David",
        date: "3/10/25",
        reviewText: "Emma could improve her punctuality but is very knowledgeable.",
      },
    ];
  
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open("UShareDB", 1);
  
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains("reviews")) {
          db.createObjectStore("reviews", { keyPath: "id", autoIncrement: true });
        }
      };
  
      request.onsuccess = () => {
        const db = request.result;
  
        // Start a new transaction for the refresh
        const tx = db.transaction("reviews", "readwrite");
        const store = tx.objectStore("reviews");
  
        // Clear existing data
        const clearRequest = store.clear();
  
        clearRequest.onsuccess = () => {
          const addRequests = dummyReviewData.map((item) => {
            return new Promise<void>((res, rej) => {
              const addReq = store.add(item);
              addReq.onsuccess = () => res();
              addReq.onerror = () => rej(addReq.error);
            });
          });
  
          Promise.all(addRequests)
            .then(() => resolve())
            .catch((err) => reject(err));
        };
  
        clearRequest.onerror = () => reject(clearRequest.error);
      };
  
      request.onerror = () => reject(request.error);
    });
  }

  

  render() {
    if (this.#container) {
      return this.#container;
    }

    this.#container = document.createElement("div");
    this.#container.classList.add("review-page");

    this.#setupContainerContent();
    
    return this.#container;
  }

  async #processNewReviewForm() {

    const modal = document.createElement("modal");
    modal.className = "modal";
    modal.innerHTML = `
    <div class="modal-content">
      <span class="close-btn">&times;</span>
      <h2>Leave a Review</h2>
      <form id="review-form">
        <label for="teacherName">Teacher Name:</label>
        <input type="text" id="teacherName" name="teacherName" required />

        <label for="skill">Skill:</label>
        <input type="text" id="skill" name="skill" required />

        <label for="stars">Stars (1-5):</label>
        <select id="stars" name="stars" required>
          <option value="" disabled selected>Select stars</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
          <option value="5">5</option>
        </select>

        <label for="reviewText">Review:</label>
        <textarea id="reviewText" name="reviewText" rows="4" required></textarea>

        <button type="submit" class="submit-btn">Submit</button>
      </form>
    </div>
  `;


    this.#container?.appendChild(modal);
    const closeBtn = modal.querySelector(".close-btn");
    closeBtn?.addEventListener("click", () => modal.remove());
    const submitBtn = modal.querySelector(".submit-btn");
    submitBtn?.addEventListener("click", async () => {

      const stars = (modal.querySelector("#stars") as HTMLSelectElement).value;
      const teacherName = (modal.querySelector("#teacherName") as HTMLInputElement).value.trim();
      const skill = (modal.querySelector("#skill") as HTMLInputElement).value.trim();
      const reviewText = (modal.querySelector("#reviewText") as HTMLTextAreaElement).value.trim();

      // Validate fields
      if (!stars || !teacherName || !skill || !reviewText) {
        alert("Please fill out all fields before submitting the review.");
        return;
      }


      const reviewData = {
        stars,
        teacherName,
        skill,
        reviewerName: "David", // Replace with actual reviewer name
        date: new Date().toLocaleDateString(),
        reviewText,
      };
      modal.remove();


      // Add review data to IndexedDB
      try {
        const db = await new Promise<IDBDatabase>((resolve, reject) => {
          const request = indexedDB.open("UShareDB", 1);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
  
        const tx = db.transaction("reviews", "readwrite");
        const store = tx.objectStore("reviews");
  
        await new Promise<void>((resolve, reject) => {
          const addRequest = store.add(reviewData);
          
          
          addRequest.onsuccess = () => {
            console.log("Data added successfully:", reviewData);
            resolve(); 
          };
          
          
          addRequest.onerror = () => {
            console.error("Failed to add data:", addRequest.error);
            reject(addRequest.error);
          };
        });
  
        console.log("Review added successfully:", reviewData);
        await this.#updateReviewCards();
      } catch (error) {
        console.error("Error adding review:", error);
      }
    });
    


  }

  async #updateReviewCards() {

    const reviews = document.createElement("div");
    reviews.className = "reviews";
    reviews.id = "reviewsContainer";

    try {
      // Open IndexedDB
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open("UShareDB", 1);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
  
      // Start a transaction to the reviews object store
      const transaction = db.transaction(["reviews"], "readonly");
      const store = transaction.objectStore("reviews");
  
      // Fetch all reviews
      const reviewsData = await new Promise<any[]>((resolve, reject) => {
        const getAllRequest = store.getAll();
        getAllRequest.onsuccess = () => resolve(getAllRequest.result);
        getAllRequest.onerror = () => reject(getAllRequest.error);
      });
  
  
      // Loop through the fetched reviews and create cards
      for (const { stars, teacherName, skill, reviewerName, date, reviewText } of reviewsData) {
        const reviewCard = document.createElement("div");
        reviewCard.className = "review-card";
  
        const starContainer = document.createElement("div");
        starContainer.className = "star-container";
  
        // Add stars to the star container
        for (let i = 1; i <= 5; i++) {
          const star = document.createElement("span");
          star.className = "star" + (i <= stars ? "" : " empty");
          star.textContent = "★";
          starContainer.appendChild(star);
        }
  
        const deleteBtn = document.createElement("button");
        deleteBtn.className = "delete-btn";
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.onclick = () => {
          this.#deleteReview(reviewCard, reviewText);
        };
  
        reviewCard.innerHTML = `
          <link
            href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"
            rel="stylesheet"
          />
          <div class="review-header">
            ${starContainer.outerHTML}
            <div>
              <p class="teacher-name">Teacher: ${teacherName}</p>
              <p class="skill">Skill: ${skill}</p>
            </div>
          </div>
          <div class="review-body">
            <div class="reviewer-info">
              <div class="reviewer-profile-pic">👤</div>
              <div>
                <p class="reviewer-name">${reviewerName}</p>
                <p class="review-date">${date}</p>
              </div>
            </div>
            <p class="review-text">${reviewText}</p>
          </div>
        `;
  
        // Append the delete button and add to the container
        reviewCard.appendChild(deleteBtn);
        console.log("Review card created:", reviewCard);
        reviews.appendChild(reviewCard);
        reviews.innerHTML == '<p> review added</p>';
        console.log("Review card appended to container");
      }
      const main = this.#container?.querySelector("#mainContent");
      if (main) {
        const existingReviews = main.querySelector("#reviewsContainer");
        if (existingReviews) {
          main.replaceChild(reviews, existingReviews);
        } else {
          main.appendChild(reviews);
        }
      }
    } catch (error) {
      console.error("Failed to update review cards:", error);
    }
  }
  

  async #deleteReview(reviewCard: HTMLElement, reviewText: string) {
    try {
      // Open IndexedDB
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open("UShareDB", 1);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
  
      // Start a transaction to the reviews object store
      const transaction = db.transaction(["reviews"], "readwrite");
      const store = transaction.objectStore("reviews");
  
      // Use a cursor to find and delete the matching review by reviewText
      await new Promise<void>((resolve, reject) => {
        const cursorRequest = store.openCursor();
        cursorRequest.onsuccess = (event) => {
          const cursor = cursorRequest.result;
          if (cursor) {
            if (cursor.value.reviewText === reviewText) {
              cursor.delete();
              resolve();
            } else {
              cursor.continue();
            }
          } else {
            // If no matching review is found
            reject(new Error("Review not found in database"));
          }
        };
        cursorRequest.onerror = () => reject(cursorRequest.error);
      });
  
      // Remove the review card from the DOM
      reviewCard.remove();
      console.log("Review successfully deleted");
    } catch (error) {
      console.error("Failed to delete review:", error);
    }
  }

  async #setupContainerContent() {
    if (!this.#container) return;

    // Main content
    const main = document.createElement("main");
    main.className = "main-content";
    main.id = "mainContent";

    // Leave Review Button
    const leaveReviewBtn = document.createElement("button");
    leaveReviewBtn.className = "leave-review-btn";
    leaveReviewBtn.textContent = "Leave Review";
    leaveReviewBtn.onclick = async () => {
      // Handle leave review button click
      // Open card to fill in fields for new review
       await this.#processNewReviewForm();

    };
    main.appendChild(leaveReviewBtn);
    this.#container.appendChild(main);

    // Load reviews from IndexedDB
    await this.#updateReviewCards();
    

  }

    
}
