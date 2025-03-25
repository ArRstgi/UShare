import App from "./App";
import { Events, EventHub } from "./lib/eventhub";
import "./style.css";

const app = new App();
const events = EventHub.getInstance();

// If user navigates to other pages using the browser's back/forward buttons
// or the URL bar, this will trigger the navigation event to render that page
document.addEventListener('DOMContentLoaded', () => {
  const url = new URL(window.location.href);
  const path = url.pathname + url.search;
  const rootContainer = document.getElementById("root");

  if (rootContainer) {
    rootContainer.appendChild(app.render());
  }

  events.publish(Events.NavigateTo, path);
});

window.addEventListener('popstate', () => {
  const url = new URL(window.location.href);
  const path = url.pathname + url.search;
  events.publish(Events.NavigateTo, path);
});
