import { NodeRef } from './script/lib/Node_Utility.js';

const ruler_h = NodeRef(document.getElementById('ruler-h')).as(HTMLElement);
const ruler_v = NodeRef(document.getElementById('ruler-v')).as(HTMLElement);

/**
 * @param {number} scale
 * @param {object} point
 * @param {number} point.x
 * @param {number} point.y
 */
export function updateRulers(scale, point) {
  const secondary_scale = Math.min(scale, 0.5);

  ruler_h.style.left = `${point.x}px`;
  // ruler_h.style.transform = `scale(${scale})`;
  ruler_h.style.transform = `scale(${scale},${secondary_scale})`;

  ruler_v.style.top = `${point.y}px`;
  // ruler_v.style.transform = `scale(${scale})`;
  ruler_v.style.transform = `scale(${secondary_scale},${scale})`;
}

export function getRulerHRect() {
  return ruler_h.getBoundingClientRect();
}

export function getRulerVRect() {
  return ruler_v.getBoundingClientRect();
}
