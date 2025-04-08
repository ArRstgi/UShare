import { BaseComponent } from "@/components/BaseComponent";

export class Matching extends BaseComponent {
  #container: HTMLElement | null = null;
  #searchBar: HTMLInputElement | null = null;

  constructor() {
    super();
    this.loadCSS("src/pages/Matching", "styles");
    this.#initIndexedDB();
  }


  #initIndexedDB() {

    const dummyData = [
      {
        id: 1,
        username: "SwimPro",
        description: "Hi, I'm a former NCAA Division I competitive swimmer with over 8 years of experience in the pool. I now offer private swimming lessons tailored to all age groups and skill levels—from water safety basics for kids to advanced technique refinement for adults. I specialize in freestyle and butterfly strokes and focus on building confidence, improving form, and boosting endurance through personalized training sessions.",
        image: "src/assets/swimmer.jpg"
      },
      {
        id: 2,
        username: "MathTutor_42",
        description: "With a PhD in Mathematics and over 10 years of tutoring experience, I provide comprehensive support for high school and college-level math courses. Whether you need help understanding algebraic concepts, solving calculus problems, or analyzing data in statistics, I tailor each session to your learning style. I’ve helped countless students boost their grades and gain confidence in their math skills.",
        image: "src/assets/swimmer.jpg"
      },
      {
        id: 3,
        username: "GuitarMaster",
        description: "I'm a professional guitarist and music teacher with more than a decade of experience helping students of all ages master the instrument. My lessons cover everything from the basics of finger placement and rhythm to advanced soloing and improvisation. Whether you're looking to strum your favorite pop songs or dive deep into music theory, I’ll help you hit the right notes—literally!",
        image: "src/assets/swimmer.jpg"
      },
      {
        id: 4,
        username: "YogaWithMe",
        description: "As a certified yoga instructor trained in Hatha and Vinyasa styles, I offer virtual and in-person yoga sessions focused on flexibility, balance, and mental clarity. My classes are beginner-friendly and emphasize mindfulness and breathwork. I aim to create a peaceful space where you can unwind, stretch your limits (literally and figuratively), and reconnect with your body and mind.",
        image: "src/assets/swimmer.jpg"
      },
      {
        id: 5,
        username: "SpanishTutor",
        description: "¡Hola! I'm a native Spanish speaker with over 6 years of tutoring experience. I offer engaging and interactive lessons for learners of all levels. From casual conversational practice to intensive grammar drills and pronunciation coaching, I customize lessons to help you build real-world fluency and confidence in speaking Spanish.",
        image: "src/assets/swimmer.jpg"
      },
      {
        id: 6,
        username: "CodeMentor",
        description: "I'm a senior software engineer with over 7 years of industry experience, currently working at a major tech company. I specialize in teaching practical programming skills in JavaScript and Python through project-based learning. Whether you're building your first app or preparing for technical interviews, I can help you master coding fundamentals and real-world development workflows.",
        image: "src/assets/swimmer.jpg"
      },
      {
        id: 7,
        username: "ChefBaker",
        description: "Bonjour! I’m a professional pastry chef trained in classic French techniques. I offer baking classes that range from beginner-friendly cookies and muffins to artisan breads and elegant plated desserts. Whether you're preparing for a bake-off or just love creating sweet treats, I’ll help you level up your baking game with hands-on instruction and plenty of delicious tips.",
        image: "src/assets/swimmer.jpg"
      },
      {
        id: 8,
        username: "ArtTeacher",
        description: "I hold an MFA in Fine Arts and have taught drawing and painting for over 12 years. My classes focus on building foundational skills in pencil, charcoal, acrylic, and oil painting. Whether you're just picking up a brush or prepping your portfolio for art school, I provide thoughtful feedback and personalized guidance to help your artistic vision come to life.",
        image: "src/assets/swimmer.jpg"
      },
      {
        id: 9,
        username: "PianoLessons",
        description: "I'm a classically trained pianist with over 15 years of teaching experience. I offer lessons for both children and adults, focusing on technique, sight-reading, and music theory. I believe learning piano should be fun and enriching, and I tailor each lesson to the student's goals—whether you're aiming to play Beethoven or just want to accompany your favorite songs.",
        image: "src/assets/swimmer.jpg"
      },
      {
        id: 10,
        username: "ScienceTutor",
        description: "As a certified high school science teacher with a master's degree in education, I offer tutoring in Biology, Chemistry, and Physics. I specialize in helping students understand complex scientific concepts and prepare effectively for exams such as the SAT, AP, and IB. My sessions are interactive and focused on building both knowledge and confidence.",
        image: "src/assets/swimmer.jpg"
      },
      {
        id: 11,
        username: "PhotographyPro",
        description: "I’m a full-time professional photographer with over a decade of experience shooting portraits, landscapes, and commercial projects. I offer hands-on photography classes covering DSLR camera basics, composition techniques, natural and studio lighting, and post-processing. Whether you're a beginner or looking to go pro, my sessions will help you take your photography to the next level.",
        image: "src/assets/swimmer.jpg"
      },
      {
        id: 12,
        username: "FrenchCoach",
        description: "Bonjour! I'm originally from Paris and have been teaching French as a second language for over 8 years. My lessons blend formal instruction with casual conversation practice, making them perfect for travelers, students, or anyone looking to immerse themselves in French culture. You'll gain confidence in speaking, listening, and pronunciation in no time!",
        image: "src/assets/swimmer.jpg"
      },
      {
        id: 13,
        username: "FitnessTrainer",
        description: "I'm a NASM-certified personal trainer with a focus on strength training, muscle toning, and functional fitness. Whether you're new to the gym or looking to optimize your workout plan, I create personalized programs that align with your fitness goals. I also provide nutrition tips and progress tracking to help you stay on target and feel your best.",
        image: "src/assets/swimmer.jpg"
      },
      {
        id: 14,
        username: "HistoryBuff",
        description: "I’m a college professor with a PhD in History, specializing in American and World History. I offer tutoring for students from middle school through college, helping them understand historical contexts, analyze primary sources, and write compelling essays. My sessions also include tips for studying effectively and preparing for standardized exams.",
        image: "src/assets/swimmer.jpg"
      },
      {
        id: 15,
        username: "DanceInstructor",
        description: "I’m a professional dancer with a background in contemporary, jazz, and ballet. I've performed on international stages and now teach dance to students of all levels. Whether you're just starting or preparing for an audition, I offer private or group sessions focused on technique, choreography, and performance expression.",
        image: "src/assets/swimmer.jpg"
      }
    ];
    

    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open("UShareDB", 1);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains("search")) {
          db.createObjectStore("search");
        }
        if (!db.objectStoreNames.contains("cards")) {
          db.createObjectStore("cards", { keyPath: "id" });
        }
      };
  
      request.onsuccess = () => {
        const db = request.result;
        
        // Start a new transaction for the refresh
        const tx = db.transaction(["cards"], "readwrite");
        const store = tx.objectStore("cards");
        
        // Clear existing data
        const clearRequest = store.clear();
        
        clearRequest.onsuccess = () => {
          
          const addRequests = dummyData.map(item => {
            return new Promise<void>((res, rej) => {
              const addReq = store.add(item);
              addReq.onsuccess = () => res();
              addReq.onerror = () => rej(addReq.error);
            });
          });
          
          Promise.all(addRequests)
            .then(() => resolve())
            .catch(err => reject(err));
        };
        
        clearRequest.onerror = () => reject(clearRequest.error);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  #loadSearchQuery(): Promise<string> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("UShareDB", 1);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction("search", "readonly");
        const store = tx.objectStore("search");
        const getRequest = store.get("matchingSearch");
        getRequest.onsuccess = () => resolve(getRequest.result ?? "");
        getRequest.onerror = () => reject(getRequest.error);
      };
      request.onerror = () => reject(request.error);
    });
  }

  #saveSearchQuery(query: string): void {
    const request = indexedDB.open("UShareDB", 1);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction("search", "readwrite");
      const store = tx.objectStore("search");
      store.put(query, "matchingSearch");
    };
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

  async #setupContainerContent() {
    if (!this.#container) return;

    const logo = document.createElement("div");
    logo.classList.add("logo");

    // Search Bar Setup
    const searchContainer = document.createElement("div");
    searchContainer.classList.add("search-container");

    this.#searchBar = document.createElement("input");
    this.#searchBar.type = "text";
    this.#searchBar.classList.add("search-bar");
    this.#searchBar.placeholder = "Search...";

    // Load previous search query
    try {
      const savedQuery = await this.#loadSearchQuery();
      this.#searchBar.value = savedQuery;
    } catch (err) {
      console.error("Error loading saved search query:", err);
    }

    searchContainer.appendChild(this.#searchBar);

    // Card Container Setup
    const containerWrapper = document.createElement("div");
    containerWrapper.classList.add("container-wrapper");

    const cardContainer = document.createElement("div");
    cardContainer.classList.add("card-container");

    // Create overlay for expanded card
    const expandedViewOverlay = document.createElement("div");
    expandedViewOverlay.classList.add("expanded-overlay");
    expandedViewOverlay.style.display = "none"; // initially hidden

    const expandedCard = document.createElement("div");
    expandedCard.classList.add("expanded-card");

    // Close button
    const closeButton = document.createElement("button");
    closeButton.innerText = "Close";
    closeButton.classList.add("close-btn");
    closeButton.addEventListener("click", () => {
      expandedViewOverlay.style.display = "none";
    });

    expandedCard.appendChild(closeButton);
    expandedViewOverlay.appendChild(expandedCard);
    this.#container!.appendChild(expandedViewOverlay);

    // Cache for all cards and debounce timer
    let allCards: any[] = [];
    let debounceTimer: NodeJS.Timeout;

    // Function to create card element (reusable)
    const createCardElement = (cardData: any) => {
      const card = document.createElement("div");
      card.classList.add("card");

      const cardHeader = document.createElement("div");
      cardHeader.style.display = "flex";
      cardHeader.style.alignItems = "center";

      const profilePic = document.createElement("div");
      profilePic.classList.add("profile-pic");

      const username = document.createElement("h4");
      username.innerText = cardData.username;

      cardHeader.appendChild(profilePic);
      cardHeader.appendChild(username);

      const image = document.createElement("img");
      image.src = cardData.image || "src/assets/swimmer.jpg";
      image.alt = cardData.description || "User Activity";

      const description = document.createElement("div");
      description.classList.add("description");
      description.innerText = cardData.description;

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

      moreButton.addEventListener("click", () => {
        // Clear and build expanded view
        expandedCard.innerHTML = "";
        expandedCard.appendChild(closeButton); // Add back the close button
    
        const detailedUsername = document.createElement("h2");
        detailedUsername.innerText = cardData.username;
    
        const detailedImage = document.createElement("img");
        detailedImage.src = cardData.image;
        detailedImage.alt = cardData.description;
        detailedImage.style.width = "100%";
    
        const detailedDescription = document.createElement("p");
        detailedDescription.innerText = cardData.description;
        detailedDescription.style.textAlign = "left"
    
        expandedCard.appendChild(detailedUsername);
        expandedCard.appendChild(detailedImage);
        expandedCard.appendChild(detailedDescription);
    
        expandedViewOverlay.style.display = "flex";
      });
    

      return card;
    };

    // Optimized card rendering with DOM diffing
    const renderCards = (filteredCards: any[]) => {
      const currentCards = Array.from(cardContainer.children);
      
      // Update or add cards
      filteredCards.forEach((cardData, index) => {
        if (index < currentCards.length) {
          // Update existing card
          const existingCard = currentCards[index] as HTMLElement;
          existingCard.querySelector("h4")!.textContent = cardData.username;
          existingCard.querySelector(".description")!.textContent = cardData.description;
          (existingCard.querySelector("img") as HTMLImageElement).src = cardData.image;
        } else {
          // Add new card
          cardContainer.appendChild(createCardElement(cardData));
        }
      });

      // Remove extra cards if filtered set is smaller
      while (cardContainer.children.length > filteredCards.length) {
        cardContainer.removeChild(cardContainer.lastChild!);
      }
    };

    // Initial load
    allCards = await this.#getCardsFromDB();

    // Load previous search query and apply filtering
    let savedQuery = "";
    try {
      savedQuery = await this.#loadSearchQuery();
      this.#searchBar.value = savedQuery;
    } catch (err) {
      console.error("Error loading saved search query:", err);
    }

    const filteredCards = savedQuery
      ? allCards.filter(card =>
          card.description.toLowerCase().includes(savedQuery.toLowerCase()) ||
          card.username.toLowerCase().includes(savedQuery.toLowerCase())
        )
      : allCards;

    renderCards(filteredCards);


    // Debounced search handler
    this.#searchBar.addEventListener("input", () => {
      const searchTerm = this.#searchBar!.value;
      this.#saveSearchQuery(searchTerm);

      // Clear previous debounce timer
      clearTimeout(debounceTimer);

      // Set new debounce timer
      debounceTimer = setTimeout(() => {
        const filteredCards = searchTerm
          ? allCards.filter(card =>
              card.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
              card.username.toLowerCase().includes(searchTerm.toLowerCase())
            )
          : allCards;

        requestAnimationFrame(() => {
          renderCards(filteredCards);
        });
      }, 150); // 150ms debounce delay
    });

    // Assemble the UI
    containerWrapper.appendChild(cardContainer);
    this.#container.appendChild(searchContainer);
    this.#container.appendChild(containerWrapper);
  }

  // Helper method to fetch cards from IndexedDB
  async #getCardsFromDB(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("UShareDB", 1);
      
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction("cards", "readonly");
        const store = tx.objectStore("cards");
        const getAllRequest = store.getAll();
        
        getAllRequest.onsuccess = () => resolve(getAllRequest.result);
        getAllRequest.onerror = () => reject(getAllRequest.error);
      };
      
      request.onerror = () => reject(request.error);
    });
  }
}