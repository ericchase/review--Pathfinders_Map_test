import { NodeRef } from './script/lib/Node_Utility.js';

class Marker {
  /**
   * Creates an instance of Marker.
   * @param {object} data
   * @param {string} data.title
   * @param {string} data.description
   * @param {number} data.x
   * @param {number} data.y
   * @this Marker
   */
  constructor(data) {
    this.data = data;
    this.element = document.createElement('img');
    this.element.draggable = false;
    this.element.src = './image/marker-icon.png';
    this.element.style.left = `${data.x}px`;
    this.element.style.top = `${data.y}px`;
  }
}

const highlight_container = NodeRef(document.getElementById('overlay-container-0')).as(SVGElement);
const marker_container = NodeRef(document.getElementById('marker-container-0')).as(HTMLElement);

/** @type {Set<Element>} */
const element_set = new Set();
/** @type {Set<Marker>} */
const marker_set = new Set();

export async function loadOverlays() {
  // load highlights
  try {
    const response = await fetch('./map-highlights.svg');
    highlight_container.insertAdjacentHTML('beforeend', await response.text());
  } catch (error) {
    console.error(error);
  }
  // add to element set
  for (const child of highlight_container.children) {
    element_set.add(child);
  }

  // load markers
  try {
    const response = await fetch('./map-markers.json');
    for (const data of await response.json()) {
      const marker = new Marker(data);
      marker_set.add(marker);
      marker_container.appendChild(marker.element);
      element_set.add(marker.element);
    }
  } catch (error) {
    console.error(error);
  }
}

export function saveOverlays() {
  {
    const body = JSON.stringify(highlight_container.innerHTML);
    fetch('/write/highlights', { method: 'POST', body });
  }
  {
    const marker_data_list = [];
    for (const marker of marker_set) {
      marker_data_list.push(marker.data);
    }
    const body = JSON.stringify(marker_data_list);
    fetch('/write/markers', { method: 'POST', body });
  }
}

/**
 * @param {*} element
 * @return {element is Element}
 */
export function isOverlayElement(element) {
  return element instanceof Element && element_set.has(element);
}
