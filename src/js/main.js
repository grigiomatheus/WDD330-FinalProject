import { App } from "./app/App.js";

const root = document.querySelector("#app");

if (!root) {
  throw new Error("Root element #app was not found.");
}

const app = new App(root);
app.render();
app.init();