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
        description: "Former competitive swimmer offering private lessons for all ages. Specializing in freestyle and butterfly techniques.",
        image: "src/assets/swimmer.jpg"
      },
      {
        id: 2,
        username: "MathTutor_42",
        description: "PhD in Mathematics available for high school and college level tutoring. Algebra, Calculus, and Statistics.",
        image: "src/assets/swimmer.jpg"
      },
      {
        id: 3,
        username: "GuitarMaster",
        description: "Professional guitarist with 10+ years experience teaching beginners. Learn chords, scales, and your favorite songs!",
        image: "src/assets/swimmer.jpg"
      },
      {
        id: 4,
        username: "YogaWithMe",
        description: "Certified yoga instructor offering virtual sessions. Beginners welcome! Focus on flexibility and mindfulness.",
        image: "src/assets/swimmer.jpg"
      },
      {
        id: 5,
        username: "SpanishTutor",
        description: "Native Spanish speaker offering conversational practice and grammar lessons. All levels welcome.",
        image: "src/assets/swimmer.jpg"
      },
      {
        id: 6,
        username: "CodeMentor",
        description: "Senior software engineer teaching JavaScript and Python. Project-based learning for practical skills.",
        image: "src/assets/swimmer.jpg"
      },
      {
        id: 7,
        username: "ChefBaker",
        description: "Professional pastry chef offering baking classes. Learn cakes, breads, and dessert plating techniques.",
        image: "src/assets/swimmer.jpg"
      },
      {
        id: 8,
        username: "ArtTeacher",
        description: "MFA graduate teaching drawing and painting fundamentals. Portfolio preparation available.",
        image: "src/assets/swimmer.jpg"
      },
      {
        id: 9,
        username: "PianoLessons",
        description: "Classically trained pianist teaching children and adults. Learn proper technique and music theory.",
        image: "src/assets/swimmer.jpg"
      },
      {
        id: 10,
        username: "ScienceTutor",
        description: "High school science teacher offering tutoring in Biology, Chemistry, and Physics. Test prep available.",
        image: "src/assets/swimmer.jpg"
      },
      {
        id: 11,
        username: "PhotographyPro",
        description: "Professional photographer teaching camera basics, lighting, and composition. Bring your DSLR!",
        image: "src/assets/swimmer.jpg"
      },
      {
        id: 12,
        username: "FrenchCoach",
        description: "Paris native offering French language lessons. Focus on pronunciation and everyday conversation.",
        image: "src/assets/swimmer.jpg"
      },
      {
        id: 13,
        username: "FitnessTrainer",
        description: "Certified personal trainer creating customized workout plans. Specializing in strength training.",
        image: "src/assets/swimmer.jpg"
      },
      {
        id: 14,
        username: "HistoryBuff",
        description: "College professor available for history tutoring. World history, American history, and political science.",
        image: "src/assets/swimmer.jpg"
      },
      {
        id: 15,
        username: "DanceInstructor",
        description: "Professional dancer teaching contemporary and jazz styles. Group or private lessons available.",
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
    renderCards(allCards);

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