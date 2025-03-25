export abstract class BaseComponent {
  cssLoaded: boolean;
  parent: HTMLElement;

  constructor() {
    this.cssLoaded = false;
    this.parent = document.createElement("div");
  }

  /**
   * This is an abstract method that must be implemented by child classes.
   * It must return an HTMLElement object.
   * @abstract
   */
  render(): HTMLElement {
    throw new Error("render method not implemented");
  }

  loadCSS(path: string, fileName: string) {
    if (this.cssLoaded) return;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.type = "text/css";
    link.href = `${path}/${fileName}.css`;
    document.head.appendChild(link);
    this.cssLoaded = true;
  }

  dispatchCustomEvent(eventName: string, detail = {}) {
    const event = new CustomEvent(eventName, { detail });
    this.parent.dispatchEvent(event);
  }

  listenToEvent(
    eventName: string,
    callback: EventListenerOrEventListenerObject,
  ) {
    this.parent.addEventListener(eventName, callback);
  }
}
