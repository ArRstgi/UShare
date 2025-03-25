import { Events, EventHub } from "@/lib/eventhub";
import { BaseComponent } from "@/components/BaseComponent";

export class TaskInputComponent extends BaseComponent {
  #container: HTMLElement | null = null;

  constructor() {
    super();
    this.loadCSS("src/components/TaskInputComponent", "styles");
  }

  render() {
    if (this.#container) {
      return this.#container;
    }

    this.#container = document.createElement("div");
    this.#container.classList.add("task-input");
    this.#container.innerHTML = this.#getTemplate();
    
    this.#attachEventListeners();
    return this.#container;
  }

  #getTemplate() {
    // Returns the HTML template for the component
    return `
      <input type="text" id="taskInput" placeholder="Enter task">
      <input type="file" id="fileInput">
      <button id="addTaskBtn">Add Task</button>
    `;
  }

  #attachEventListeners() {
    if (!this.#container) return;
    // Attach event listeners to the input and button elements
    const addTaskBtn = this.#container.querySelector("#addTaskBtn");
    const taskInput = this.#container.querySelector(
      "#taskInput",
    ) as HTMLInputElement;
    const fileInput = this.#container.querySelector(
      "#fileInput",
    ) as HTMLInputElement;

    addTaskBtn?.addEventListener("click", () =>
      this.#handleAddTask(taskInput, fileInput),
    );

    // Add a keypress event listener to the task input. If the user presses
    // the 'Enter' key, the task will be added. This is a nice usability
    // feature for users who prefer using the keyboard.
    taskInput?.addEventListener("keypress", (event) => {
      if (event.key === "Enter") {
        this.#handleAddTask(taskInput, fileInput);
      }
    });
  }

  #handleAddTask(
    taskInput: HTMLInputElement | null,
    fileInput: HTMLInputElement | null,
  ) {
    const task = taskInput?.value;
    const file = fileInput?.files?.[0];

    if (!task) {
      alert("Please enter a task.");
      return;
    }

    // Publish a 'NewTask' event with the task and file data
    this.#publishNewTask(task, file);

    // Clear inputs
    this.#clearInputs(taskInput, fileInput);
  }

  #publishNewTask(task: string, file?: File) {
    const hub = EventHub.getInstance();
    hub.publish(Events.NewTask, { task, file });
    hub.publish(Events.StoreTask, { task, file });
  }

  #clearInputs(
    taskInput: HTMLInputElement | null,
    fileInput: HTMLInputElement | null,
  ) {
    if (taskInput) {
      taskInput.value = "";
    }
    if (fileInput) {
      fileInput.value = "";
    }
  }
}
