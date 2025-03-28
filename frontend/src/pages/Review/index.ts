import { BaseComponent } from "@/components/BaseComponent";

export class ReviewPage extends BaseComponent {
  #container: HTMLElement | null = null;

  constructor() {
    super();
    this.loadCSS("src/pages/Review", "style");
  }

  render() {
    if (this.#container) {
      return this.#container;
    }

    this.#container = document.createElement("div");
    this.#container.classList.add("review-page");
    this.#setupContainerContent();
    this.#attachEventListeners();

    return this.#container;
  }

  #attachEventListeners() {
    if (!this.#container) return;
    // Add any event listeners if needed
  }

  #setupContainerContent() {
    if (!this.#container) return;

    // Main content
    const main = document.createElement("main");
    main.className = "main-content";

    // Leave Review Button
    const leaveReviewBtn = document.createElement("button");
    leaveReviewBtn.className = "leave-review-btn";
    leaveReviewBtn.textContent = "Leave Review";
    main.appendChild(leaveReviewBtn);

    // Reviews Container
    const reviews = document.createElement("div");
    reviews.className = "reviews";

    // Example Reviews
    const reviewData = [
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

    reviewData.forEach(({ stars, teacherName, skill, reviewerName, date, reviewText }) => {
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

      reviewCard.innerHTML = `
        <div class="review-header">
          ${starContainer.outerHTML}
          <div>
            <p class="teacher-name"> Teacher: ${teacherName}</p>
            <p class="skill"> Skill: ${skill}</p>
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
      reviews.appendChild(reviewCard);
    });

    main.appendChild(reviews);
    this.#container.appendChild(main);
  }
}
