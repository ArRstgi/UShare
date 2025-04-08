import {
  DB_NAME,
  DB_VERSION,
  USERS_STORE,
  MESSAGES_STORE,
} from "../pages/Chat/constants";

/**
 * Service class to manage IndexedDB interactions.
 * (Similar to previous multi-file version, ensuring User store includes preview fields)
 */
export class DatabaseService {
  #db: IDBDatabase | null = null;
  #initPromise: Promise<void> | null = null;

  constructor() {
    this.#initialize();
  }
  ready(): Promise<void> {
    return this.#initPromise!;
  }

  #initialize(): void {
    this.#initPromise = new Promise((resolve, reject) => {
      if (!("indexedDB" in window))
        return reject(new Error("IndexedDB not supported"));
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () =>
        reject(new Error(`DB error: ${request.error?.message}`));
      request.onupgradeneeded = (_) => this.#upgradeSchema(request.result);
      request.onsuccess = () => {
        this.#db = request.result;
        console.log("DB opened.");
        resolve();
      };
    });
    this.#initPromise.catch((error) => console.error("DB Init failed:", error));
  }

  #upgradeSchema(db: IDBDatabase): void {
    // Ensure USER store exists (keyPath: 'name'). No specific indexes needed for preview fields.
    if (!db.objectStoreNames.contains(USERS_STORE)) {
      db.createObjectStore(USERS_STORE, { keyPath: "name" });
      console.log(`Created object store: ${USERS_STORE}`);
    }
    // Ensure MESSAGES store exists with needed indexes
    if (!db.objectStoreNames.contains(MESSAGES_STORE)) {
      const messageStore = db.createObjectStore(MESSAGES_STORE, {
        keyPath: "id",
        autoIncrement: true,
      });
      messageStore.createIndex("receiverTimestampIdx", [
        "receiver",
        "timestamp",
      ]);
      messageStore.createIndex("senderTimestampIdx", ["sender", "timestamp"]);
      console.log(`Created object store: ${MESSAGES_STORE}`);
    }
  }

  // Helper Methods
  async #getTransaction(
    storeNames: string | string[],
    mode: IDBTransactionMode
  ): Promise<IDBTransaction> {
    await this.ready();
    if (!this.#db) throw new Error("DB not initialized");
    return this.#db.transaction(storeNames, mode);
  }
  #wrapRequest<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () =>
        reject(request.error ?? new Error("Request failed"));
    });
  }

  // --- Public DB Methods ---
  async put<T>(storeName: string, data: T): Promise<IDBValidKey> {
    const transaction = await this.#getTransaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.put(data);
    // Use promise that resolves on transaction complete for writes
    return new Promise((resolve, reject) => {
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => resolve(request.result);
      transaction.onerror = () => reject(transaction.error);
    });
  }
  async get<T>(storeName: string, key: IDBValidKey): Promise<T | null> {
    const transaction = await this.#getTransaction(storeName, "readonly");
    const request = transaction.objectStore(storeName).get(key);
    return this.#wrapRequest(request).then(
      (result) => (result as T | undefined) ?? null
    );
  }
  async getAll<T>(storeName: string): Promise<T[]> {
    const transaction = await this.#getTransaction(storeName, "readonly");
    const request = transaction.objectStore(storeName).getAll();
    return this.#wrapRequest(request).then((result) => (result as T[]) ?? []);
  }
  async count(storeName: string): Promise<number> {
    const transaction = await this.#getTransaction(storeName, "readonly");
    const request = transaction.objectStore(storeName).count();
    return this.#wrapRequest(request);
  }
  async queryIndex<T>(
    storeName: string,
    indexName: string,
    query: IDBValidKey | IDBKeyRange | null
  ): Promise<T[]> {
    const transaction = await this.#getTransaction(storeName, "readonly");
    const request = transaction
      .objectStore(storeName)
      .index(indexName)
      .getAll(query);
    return this.#wrapRequest(request).then((result) => (result as T[]) ?? []);
  }
}
