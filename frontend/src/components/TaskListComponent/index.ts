import { TaskData } from "@/lib/models/task.js";
import { Events, EventHub } from "@/lib/eventhub";
import { BaseComponent } from "@/components/BaseComponent";
import { TaskComponent } from "@/components/TaskComponent";

export class TaskListComponent extends BaseComponent {
  #container: HTMLElement | null = null; // Private variable to store the container element

  constructor() {
    super();
    this.loadCSS("src/components/TaskListComponent", "styles");
  }

  // Renders the component and returns the container element
  render() {
    if (this.#container) {
      return this.#container;
    }

    this.#container = document.createElement("div");
    this.#container.classList.add("task-list");
    this.#setupContainerContent();
    this.#attachEventListeners();

    return this.#container;
  }

  // Sets up the inner HTML of the container
  #setupContainerContent() {
    if (!this.#container) return;
    this.#container.innerHTML = `
      <h2>Task List</h2>
      <ul id="taskListWrapper"></ul>
      <button id="clearTasksBtn">Clear All Tasks</button>
    `;
  }

  // Attaches the event listeners for the component
  #attachEventListeners() {
    if (!this.#container) return;
    const hub = EventHub.getInstance();

    // Subscribe to the 'NewTask' event to add a new task
    hub.subscribe(Events.NewTask, (taskData: TaskData) => this.#addTaskToList(taskData));

    // Attach event listener for clearing tasks
    const clearTasksBtn = this.#container.querySelector("#clearTasksBtn");
    clearTasksBtn?.addEventListener("click", () => this.#clearTasks());
    hub.subscribe(Events.UnStoreTasks, () => {
      // Normally it would be some function dealing with the backend or the database, but for now...
      hub.publish(Events.UnStoreTasksSuccess, null)
    })

    // Subscribe to 'UnStoreTasksSuccess' to clear the task list
    hub.subscribe(Events.UnStoreTasksSuccess, () => this.#clearTaskList());
  }

  // Adds a task to the task list
  #addTaskToList(taskData: TaskData) {
    const taskList = this.#getTaskListElement();
    const taskContainer = document.createElement("li");

    // Create a new TaskComponent for each task
    const task = new TaskComponent(taskData);
    taskList?.appendChild(task.render());
  }

  // Retrieves the task list <ul> element
  #getTaskListElement(): HTMLUListElement | null {
    if (!this.#container) return null;
    return this.#container.querySelector("#taskListWrapper");
  }

  // Clears the tasks from the task list and publishes an event
  #clearTasks() {
    console.log("Clearing tasks");
    const hub = EventHub.getInstance();
    hub.publish(Events.UnStoreTasks, null);
  }

  // Clears the task list content when tasks are removed successfully
  #clearTaskList() {
    const taskList = this.#getTaskListElement();
    console.log("Clearing task list", taskList);
    if (!taskList) return;
    taskList.innerHTML = "";
  }

  getContainer() {
    return this.#container;
  }
}
