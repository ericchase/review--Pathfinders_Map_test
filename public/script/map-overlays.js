import { toFloat } from './CoordinateSpaceContainer.js';
import { NodeRef } from './lib/Node_Utility.js';

export class Marker {
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

  getData() {
    this.data.x = toFloat(this.element.style.left, 0);
    this.data.y = toFloat(this.element.style.top, 0);
    return this.data;
  }
}

const highlightContainer = NodeRef(document.getElementById('overlay-container-0')).as(SVGElement);
const markerContainer = NodeRef(document.getElementById('marker-container-0')).as(HTMLElement);

/** @type {Set<Element>} */
const element_set = new Set();
/** @type {Set<Marker>} */
const marker_set = new Set();

export async function loadOverlays() {
  // load highlights
  try {
    const response = await fetch('./map-highlights.svg');
    highlightContainer.insertAdjacentHTML('beforeend', await response.text());
  } catch (error) {
    console.error(error);
  }
  // add to element set
  for (const child of highlightContainer.children) {
    element_set.add(child);
  }

  // load markers
  try {
    const response = await fetch('./map-markers.json');
    for (const data of await response.json()) {
      const marker = new Marker(data);
      marker_set.add(marker);
      markerContainer.appendChild(marker.element);
      element_set.add(marker.element);
    }
  } catch (error) {
    console.error(error);
  }
}

export function getOverlayMarkers() {
  return marker_set;
}

/**
 * @param {*} element
 * @return {element is Element}
 */
export function isOverlayElement(element) {
  return element instanceof Element && element_set.has(element);
}
