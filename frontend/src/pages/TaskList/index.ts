import { BaseComponent } from "@/components/BaseComponent";
import { EventHub } from "@/lib/eventhub/EventHub.js";
import { Events } from "@/lib/eventhub/Events.js";
import { TaskData } from "@/lib/models/task";
import { TaskInputComponent } from "@/components/TaskInputComponent";
import { TaskListComponent } from "@/components/TaskListComponent";

export class TaskListPage extends BaseComponent {
  #container: HTMLElement | null = null;
  #taskInput: TaskInputComponent;
  #taskList: TaskListComponent;

  constructor() {
    super();
    this.loadCSS("src/pages/TaskList", "styles");
    this.#taskInput = new TaskInputComponent();
    this.#taskList = new TaskListComponent();
  }

  render() {
    if (this.#container) {
      return this.#container;
    }

    this.#container = document.createElement("div");
    this.#container.classList.add("task-page");
    this.#setupContainerContent();
    this.#attachEventListeners();

    return this.#container;
  }

  #setupContainerContent() {
    if (!this.#container) return;
    
    // Create a header section
    const header = document.createElement("header");
    header.innerHTML = `<h1>Task Manager</h1>`;
    
    // Create main content section
    const mainContent = document.createElement("main");
    
    // Add components to the main content
    mainContent.appendChild(this.#taskInput.render());
    mainContent.appendChild(this.#taskList.render());
    
    // Add sections to container
    this.#container.appendChild(header);
    this.#container.appendChild(mainContent);
  }

  #attachEventListeners() {
    const hub = EventHub.getInstance();
    
    // Subscribe to relevant events if needed
    hub.subscribe(Events.TasksLoaded, (tasks: TaskData[]) => {
      this.setTasks(tasks);
    });
  }

  // Method to set initial tasks (if needed)
  setTasks(tasks: TaskData[]) {
    tasks.forEach(task => {
      const hub = EventHub.getInstance();
      hub.publish(Events.NewTask, task);
    });
  }
}