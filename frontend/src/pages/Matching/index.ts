import { BaseComponent } from "@/components/BaseComponent";

const DB_VERSION = 1; // Bump this version to force upgrade and store creation

export class Matching extends BaseComponent {
  #container: HTMLElement | null = null;
  #searchBar: HTMLInputElement | null = null;

  constructor() {
    super();
    this.loadCSS("src/pages/Matching", "styles");
    this.#initIndexedDB();
  }

  #initIndexedDB() {
    return new Promise<void>((resolve, reject) => {
      // Fetch profiles from the backend
      fetch("http://localhost:3000/matching/getProfiles")
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Failed to fetch profiles: ${response.status}`);
          }
          return response.json();
        })
        .then((profiles) => {
          // Open IndexedDB
          const request = indexedDB.open("UShareDB", DB_VERSION);

          request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains("search")) {
              db.createObjectStore("search");
            }
            if (!db.objectStoreNames.contains("cards")) {
              db.createObjectStore("cards", { keyPath: "id" });
            }
            if (!db.objectStoreNames.contains("userProfilePhoto")) {
              db.createObjectStore("userProfilePhoto");
            }
            if (!db.objectStoreNames.contains("userProfileDetails")) {
              db.createObjectStore("userProfileDetails");
            }
            if (!db.objectStoreNames.contains("registration")) {
              db.createObjectStore("registration");
            }
            if (!db.objectStoreNames.contains("reviews")) {
              db.createObjectStore("reviews", { keyPath: "id", autoIncrement: true });
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
              const addRequests = profiles.map((profile: any) => {
                return new Promise<void>((res, rej) => {
                  const addReq = store.add(profile);
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
        })
        .catch((err) => {
          console.error("Error fetching profiles:", err);
          reject(err);
        });
    });
  }

  #loadSearchQuery(): Promise<string> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("UShareDB", DB_VERSION);
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
    const request = indexedDB.open("UShareDB", DB_VERSION);
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

    // Wait for IndexedDB initialization before setting up content
    this.#initIndexedDB()
      .then(() => this.#setupContainerContent())
      .catch((err) => {
        console.error("Failed to initialize IndexedDB:", err);
        // Optionally show an error message in the UI
      });

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
    closeButton.innerText = "X";
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
    const createCardElement = (cardData: any, matched: Set<number>) => {
      const card = document.createElement("div");
      card.classList.add("card");

      const cardHeader = document.createElement("div");
      cardHeader.style.display = "flex";
      cardHeader.style.alignItems = "center";

      const profilePic = document.createElement("div");
      profilePic.classList.add("profile-pic");
      if (cardData.photoUrl) {
          profilePic.style.backgroundImage = `url(${cardData.photoUrl})`;
          profilePic.style.backgroundSize = "cover";
          profilePic.style.backgroundColor = "";
      } else {
          profilePic.style.backgroundImage = `url("https://img.freepik.com/free-vector/isolated-young-handsome-man-different-poses-white-background-illustration_632498-859.jpg?semt=ais_hybrid")`;
          profilePic.style.backgroundSize = "80px";
          profilePic.style.backgroundColor = "#ccc";
      }

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

      // Check if the card is matched
      if (matched.has(cardData.id)) {
        matchButton.innerText = "Unmatch";
        matchButton.style.backgroundColor = "red";
      } else {
        matchButton.innerText = "Match";
        matchButton.style.backgroundColor = "green";
      }

      const moreButton = document.createElement("button");
      moreButton.classList.add("more-btn");
      moreButton.innerText = "More";

      buttons.appendChild(matchButton);
      buttons.appendChild(moreButton);

      card.appendChild(cardHeader);
      card.appendChild(image);
      card.appendChild(description);
      card.appendChild(buttons);

      // Add event listener to the Match button
      matchButton.addEventListener("click", () => {
        if (matchButton.innerText === "Match") {
          // Call the API to match the card ID with user ID 1
          fetch(`http://localhost:3000/matching/1/match/${cardData.id}`, {
            method: "POST",
          })
            .then((response) => {
              if (!response.ok) {
                throw new Error(`Failed to match: ${response.status}`);
              }
              return response.json();
            })
            .then(() => {
              // Change the button to "Unmatch"
              matchButton.innerText = "Unmatch";
              matchButton.style.backgroundColor = "red";

              // Update the matched list in IndexedDB
              this.#updateMatchedList(cardData.id, true)
                .then(() => console.log("Matched list updated in IndexedDB."))
                .catch((err) => console.error("Error updating matched list:", err));
            })
            .catch((err) => {
              console.error("Error matching:", err);
            });
        } else {
          // Call the API to unmatch the card ID with user ID 1
          fetch(`http://localhost:3000/matching/1/unmatch/${cardData.id}`, {
            method: "POST",
          })
            .then((response) => {
              if (!response.ok) {
                throw new Error(`Failed to unmatch: ${response.status}`);
              }
              return response.json();
            })
            .then(() => {
              // Change the button back to "Match"
              matchButton.innerText = "Match";
              matchButton.style.backgroundColor = "green";

              // Update the matched list in IndexedDB
              this.#updateMatchedList(cardData.id, false)
                .then(() => console.log("Matched list updated in IndexedDB."))
                .catch((err) => console.error("Error updating matched list:", err));
            })
            .catch((err) => {
              console.error("Error unmatching:", err);
            });
        }
      });

      // Add event listener to the "More" button
      moreButton.addEventListener("click", () => {
        // Clear and build expanded view
        expandedCard.innerHTML = "";
        expandedCard.appendChild(closeButton); // Add back the close button
    
        const detailedUsername = document.createElement("h2");
        detailedUsername.innerText = cardData.username;
    
        const detailedImage = document.createElement("img");
        // Use photoUrl for the expanded view image
        detailedImage.src = cardData.photoUrl || 'src/assets/placeholder.jpg'; // Use photoUrl or placeholder
        detailedImage.alt = cardData.description || cardData.username; // Better alt text
        detailedImage.style.width = "100%";
        detailedImage.style.maxWidth = "300px"; // Optional: constrain size
        detailedImage.style.height = "auto";
        detailedImage.style.borderRadius = "8px"; // Optional: style it
    
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
    const renderCards = (filteredCards: any[], matched: Set<number>) => {
      const currentCards = Array.from(cardContainer.children);
      
      // Update or add cards
      filteredCards.forEach((cardData, index) => {
        if (index < currentCards.length) {
          // Update existing card
          const existingCard = currentCards[index] as HTMLElement;
          existingCard.querySelector("h4")!.textContent = cardData.username;
          existingCard.querySelector(".description")!.textContent = cardData.description;
          (existingCard.querySelector("img") as HTMLImageElement).src = cardData.image;

          // Update profile pic background
          const existingPic = existingCard.querySelector(".profile-pic") as HTMLElement;
          if (cardData.photoUrl) {
              existingPic.style.backgroundImage = `url(${cardData.photoUrl})`;
              existingPic.style.backgroundSize = "cover";
              existingPic.style.backgroundColor = "";
          } else {
              existingPic.style.backgroundImage = `url("https://img.freepik.com/free-vector/isolated-young-handsome-man-different-poses-white-background-illustration_632498-859.jpg?semt=ais_hybrid")`;
              existingPic.style.backgroundSize = "80px";
              existingPic.style.backgroundColor = "#ccc";
          }

          // Update main image src
          const existingImage = existingCard.querySelector("img") as HTMLImageElement;
          existingImage.src = cardData.image || "src/assets/swimmer.jpg"; // Adjust as needed
          // Or if using photoUrl: existingImage.src = cardData.photoUrl || 'src/assets/placeholder.jpg';

        } else {
          // Add new card
          cardContainer.appendChild(createCardElement(cardData, matched));
        }
      });

      // Remove extra cards if filtered set is smaller
      while (cardContainer.children.length > filteredCards.length) {
        cardContainer.removeChild(cardContainer.lastChild!);
      }
    };

    // Initial load
    allCards = await this.#getCardsFromDB();
    const { cards, matched } = allCards;

    // Load previous search query and apply filtering
    let savedQuery = "";
    try {
      savedQuery = await this.#loadSearchQuery();
      this.#searchBar.value = savedQuery;
    } catch (err) {
      console.error("Error loading saved search query:", err);
    }

    const filteredCards = savedQuery
      ? cards.filter(card =>
          card.description.toLowerCase().includes(savedQuery.toLowerCase()) ||
          card.username.toLowerCase().includes(savedQuery.toLowerCase())
        )
      : cards;

    renderCards(filteredCards, matched);


    // Debounced search handler
    this.#searchBar.addEventListener("input", () => {
      const searchTerm = this.#searchBar!.value;
      this.#saveSearchQuery(searchTerm);

      // Clear previous debounce timer
      clearTimeout(debounceTimer);

      // Set new debounce timer
      debounceTimer = setTimeout(() => {
        const filteredCards = searchTerm
          ? cards.filter(card =>
              card.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
              card.username.toLowerCase().includes(searchTerm.toLowerCase())
            )
          : cards;

        requestAnimationFrame(() => {
          renderCards(filteredCards, matched);
        });
      }, 150); // 150ms debounce delay
    });


    // Add "Show Matches" button
    const showMatchesButton = document.createElement("button");
    showMatchesButton.innerText = "Show Matches";
    showMatchesButton.classList.add("show-matches-btn");
    showMatchesButton.style.backgroundColor = "#4CAF50";
    showMatchesButton.style.color = "white";
    showMatchesButton.style.padding = "5px 5px";
    showMatchesButton.style.margin = "5px";
    showMatchesButton.style.border = "none";
    showMatchesButton.style.borderRadius = "8px";
    showMatchesButton.style.fontSize = "12px";
    showMatchesButton.style.cursor = "pointer";
    showMatchesButton.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
    showMatchesButton.style.transition = "background-color 0.3s ease, transform 0.2s ease";
    // Modify "Show Matches" button to fetch and display a list of matches
    showMatchesButton.addEventListener("click", async () => {
      const popupCard = document.createElement("div");
      popupCard.classList.add("popup-card");

      // Style the popup card
      popupCard.style.position = "fixed";
      popupCard.style.top = "50%";
      popupCard.style.left = "50%";
      popupCard.style.transform = "translate(-50%, -50%)";
      popupCard.style.padding = "20px 25px";
      popupCard.style.backgroundColor = "white";
      popupCard.style.border = "1px solid #ddd"; // Softer border
      popupCard.style.borderRadius = "12px";     // Rounded corners
      popupCard.style.boxShadow = "0 8px 16px rgba(0, 0, 0, 0.15)"; // Softer, deeper shadow
      popupCard.style.zIndex = "1000";

      // Fetch matches from the API
      try {
        const response = await fetch("http://localhost:3000/matching/getMatches/1");
        if (!response.ok) {
          throw new Error(`Failed to fetch matches: ${response.status}`);
        }
        const matches = await response.json();

        // Create a list to display matches
        const matchList = document.createElement("ul");
        matches.forEach((match: string) => {
          const listItem = document.createElement("li");
          listItem.innerText = match;
          matchList.appendChild(listItem);
        });
        popupCard.appendChild(matchList);
      } catch (error) {
        console.error("Error fetching matches:", error);
        popupCard.innerText = "Failed to load matches.";
      }

      // Add a close button
      const closeButton = document.createElement("button");
      closeButton.innerText = "Close";
      closeButton.style.marginTop = "10px";
      closeButton.style.backgroundColor = "#f44336"; // Red background
      closeButton.style.color = "white";
      closeButton.style.padding = "5px 5px";
      closeButton.style.margin = "5px";
      closeButton.style.marginTop = "10px";
      closeButton.style.border = "none";
      closeButton.style.borderRadius = "8px";
      closeButton.style.fontSize = "12px";
      closeButton.style.cursor = "pointer";
      closeButton.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
      closeButton.style.transition = "background-color 0.3s ease, transform 0.2s ease";
      closeButton.addEventListener("click", () => {
        popupCard.remove();
      });

      popupCard.appendChild(closeButton);
      document.body.appendChild(popupCard);
    });

    searchContainer.appendChild(showMatchesButton);

    // Assemble the UI
    containerWrapper.appendChild(cardContainer);
    this.#container.appendChild(searchContainer);
    this.#container.appendChild(containerWrapper);
  }

  // Helper method to fetch cards from IndexedDB
  async #getCardsFromDB(): Promise<{ cards: any[], matched: Set<number> }> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("UShareDB", DB_VERSION);

      request.onsuccess = () => {
        const db = request.result;

        // Fetch cards
        const txCards = db.transaction("cards", "readonly");
        const storeCards = txCards.objectStore("cards");
        const getAllCardsRequest = storeCards.getAll();

        // Fetch matched list
        const txMatched = db.transaction("registration", "readonly");
        const storeMatched = txMatched.objectStore("registration");
        const getMatchedRequest = storeMatched.get(1); // Assuming user ID 1

        Promise.all([
          new Promise<any[]>((res, rej) => {
            getAllCardsRequest.onsuccess = () => res(getAllCardsRequest.result);
            getAllCardsRequest.onerror = () => rej(getAllCardsRequest.error);
          }),
          new Promise<Set<number>>((res, rej) => {
            getMatchedRequest.onsuccess = () => {
              const matchedList = getMatchedRequest.result?.matched || [];
              res(new Set(matchedList));
            };
            getMatchedRequest.onerror = () => rej(getMatchedRequest.error);
          }),
        ])
          .then(([cards, matched]) => resolve({ cards, matched }))
          .catch(reject);
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Add a helper method to update the matched list in IndexedDB
  #updateMatchedList(cardId: number, isMatched: boolean): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("UShareDB", DB_VERSION);

      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction("registration", "readwrite");
        const store = tx.objectStore("registration");

        const getRequest = store.get(1); // Assuming user ID 1
        getRequest.onsuccess = () => {
          const userData = getRequest.result || { matched: [] };
          const matchedList = new Set(userData.matched);

          if (isMatched) {
            matchedList.add(cardId);
          } else {
            matchedList.delete(cardId);
          }

          userData.matched = Array.from(matchedList);

          const putRequest = store.put(userData, 1);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        };

        getRequest.onerror = () => reject(getRequest.error);
      };

      request.onerror = () => reject(request.error);
    });
  }
}