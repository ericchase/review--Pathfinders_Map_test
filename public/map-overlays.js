import { NodeRef } from './script/lib/Node_Utility.js';

const overlay_container = NodeRef(document.getElementById('overlay-container')).as(SVGElement);

/**
 * @type {Set<Element>}
 */
const element_set = new Set();

export async function loadOverlays() {
  // load highlights
  try {
    const response = await fetch('./map-highlights.svg');
    overlay_container.insertAdjacentHTML('beforeend', await response.text());
  } catch (error) {
    console.error(error);
  }

  // load markers

  // add to element set
  for (const child of overlay_container.children) {
    element_set.add(child);
  }
}

/**
 * @param {*} element
 * @return {element is Element}
 */
export function isOverlayElement(element) {
  return element instanceof Element && element_set.has(element);
}
