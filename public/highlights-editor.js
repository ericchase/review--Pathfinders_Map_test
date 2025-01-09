import { NodeListRef, NodeRef } from './script/lib/Node_Utility.js';
import { getEditor, SVGCircleEditor, SVGPolygonEditor, SVGRectEditor } from './script/SVGEditor.js';

const container = NodeRef(document.getElementById('highlight-container')).as(SVGElement);
/**
 * @type {Set<SVGElement>}
 */
const element_set = new Set();

export async function setupHighlights() {
  try {
    const response = await fetch('./highlights.svg');
    container.insertAdjacentHTML('beforeend', await response.text());
    for (const child of NodeListRef([...container.children]).as(SVGElement)) {
      child.style.setProperty('pointer-events', 'auto');
      element_set.add(child);
    }
  } catch (error) {
    console.log(error);
  }
}

/** @type {SVGElement} */
let selected = undefined;
/** @type {SVGCircleEditor|SVGRectEditor|SVGPolygonEditor} */
let editor = undefined;
let dash_offset = 0;
let timer = setTimeout(null, 0);

/**
 * @param {SVGElement=} element
 */
export function changeSelectedHighlight(element) {
  if (selected) {
    clearTimeout(timer);
    selected.style.removeProperty('stroke-dasharray');
    selected.style.removeProperty('stroke-dashoffset');
  }
  if (element === undefined || selected === element) {
    selected = undefined;
    editor = undefined;
  } else {
    selected = element;
    editor = getEditor(element);

    // move to top
    container.appendChild(element);

    // make element look like it was selected
    selected.style.setProperty('stroke-dasharray', '10,10');
    selected.style.setProperty('stroke-dashoffset', `${dash_offset}`);
    setTimeout(() => {
      dash_offset = dash_offset < -10 ? 0 : dash_offset - 5;
      selected.style.setProperty('stroke-dashoffset', `${dash_offset}`);
      timer = setInterval(() => {
        dash_offset = dash_offset < -10 ? 0 : dash_offset - 5;
        selected.style.setProperty('stroke-dashoffset', `${dash_offset}`);
      }, 500);
    }, 25);
  }
}

/**
 * @param {*} object
 * @return {object is SVGElement}
 */
export function isHighlight(object) {
  return object instanceof SVGElement && element_set.has(object);
}

/**
 * @param {*} object
 * @return {object is SVGElement}
 */
export function isSelectedHighlight(object) {
  return selected === object;
}

/**
 * @param {{x:number;y:number;}} delta
 */
export function dragSelectedHighlight(delta) {
  editor.move(delta);
}
