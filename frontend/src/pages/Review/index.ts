import { BaseComponent } from "@/components/BaseComponent";

export class ReviewPage extends BaseComponent {
  #container: HTMLElement | null = null;

  constructor() {
    super();
    this.loadCSS("src/pages/Review", "style");
  }

  async #updateReviewCards() {
    const reviews = document.createElement("div");
    reviews.className = "reviews";
    reviews.id = "reviewsContainer";

    try {
      const response = await fetch("reviews");
      if (!response.ok) throw new Error(`Failed to fetch reviews: ${response.statusText}`);
      const reviewsData = await response.json();

      if (!Array.isArray(reviewsData)) {
        console.error("Unexpected response format:", reviewsData);
        return;
      }

      for (const { stars, teacherName, skill, reviewerName, date, reviewText } of reviewsData) {
        const reviewCard = document.createElement("div");
        reviewCard.className = "review-card";

        const starContainer = document.createElement("div");
        starContainer.className = "star-container";

        for (let i = 1; i <= 5; i++) {
          const star = document.createElement("span");
          star.className = "star" + (i <= stars ? "" : " empty");
          star.textContent = "★";
          starContainer.appendChild(star);
        }

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "delete-btn";
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.onclick = () => this.#deleteReview(reviewCard, teacherName, reviewText);

        reviewCard.innerHTML = `
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

        reviewCard.appendChild(deleteBtn);
        reviews.appendChild(reviewCard);
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

    const form = modal.querySelector("#review-form");
    form?.addEventListener("submit", async (event) => {
      event.preventDefault();

      const stars = (modal.querySelector("#stars") as HTMLSelectElement).value;
      const teacherName = (modal.querySelector("#teacherName") as HTMLInputElement).value.trim();
      const skill = (modal.querySelector("#skill") as HTMLInputElement).value.trim();
      const reviewText = (modal.querySelector("#reviewText") as HTMLTextAreaElement).value.trim();

      if (!stars || !teacherName || !skill || !reviewText) {
        alert("Please fill out all fields before submitting the review.");
        return;
      }

      const reviewData = {
        stars: parseInt(stars),
        teacherName,
        skill,
        reviewerName: "David",
        date: new Date().toLocaleDateString(),
        reviewText,
      };

      try {
        const response = await fetch("reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(reviewData),
        });

        if (!response.ok) throw new Error(`Failed to add review: ${response.statusText}`);
        console.log("Review added successfully");
        await this.#updateReviewCards();
      } catch (error) {
        console.error("Error adding review:", error);
      } finally {
        modal.remove();
      }
    });
  }

  async #deleteReview(reviewCard: HTMLElement, teacherName: string, reviewText: string) {
    try {
      const response = await fetch(`/reviews/${teacherName}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewText }),
      });

      if (!response.ok) throw new Error(`Failed to delete review: ${response.statusText}`);
      reviewCard.remove();
      console.log("Review successfully deleted");
    } catch (error) {
      console.error("Failed to delete review:", error);
    }
  }

  async #setupContainerContent() {
    if (!this.#container) return;

    const main = document.createElement("main");
    main.className = "main-content";
    main.id = "mainContent";

    const leaveReviewBtn = document.createElement("button");
    leaveReviewBtn.className = "leave-review-btn";
    leaveReviewBtn.textContent = "Leave Review";
    leaveReviewBtn.onclick = async () => {
      await this.#processNewReviewForm();
    };
    main.appendChild(leaveReviewBtn);
    this.#container.appendChild(main);

    await this.#updateReviewCards();
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
}
