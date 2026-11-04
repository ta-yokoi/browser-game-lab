import { names } from "./catalog.js?v=4";
const sprite = new URL("../assets/pictures.svg", import.meta.url).href;
export function art(id, className = "") {
  return `<svg class="picture ${className}" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><use href="${sprite}#${id}"></use></svg>`;
}
export function pictureLabel(id) {
  return names[id];
}
