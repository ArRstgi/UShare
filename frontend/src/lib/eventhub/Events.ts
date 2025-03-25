/**
 * An object containing various message types for task management.
 * Change this for your applications 
 */
export const Events = {
  NewTask: "NewTask",

  LoadTasks: "LoadTasks",
  LoadTasksSuccess: "LoadTasksSuccess",
  LoadTasksFailure: "LoadTasksFailure",

  StoreTask: "StoreTask",
  StoreTaskSuccess: "StoreTaskSuccess",
  StoreTaskFailure: "StoreTaskFailure",

  UnStoreTasks: "UnStoreTasks",
  UnStoreTasksSuccess: "UnStoreTasksSuccess",
  UnStoreTasksFailure: "UnStoreTasksFailure",
  TasksLoaded: "TasksLoaded",
  ClearTasks: "ClearTasks",
  TasksCleared: "TasksCleared",
  TaskError: "TaskError",
  
  // Pages switching events
  NavigateTo: "NavigateTo"
};
