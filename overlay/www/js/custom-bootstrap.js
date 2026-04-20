import { initCustomFeatures } from "./custom.js";

function init() {
  initCustomFeatures(window.customConfig || null);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
