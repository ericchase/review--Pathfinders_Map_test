import { toInt } from './CoordinateSpaceContainer.js';
import { NodeRef } from './lib/Node_Utility.js';

const legend = NodeRef(document.getElementById('legend')).as(HTMLElement);
const toggle_legend_button = NodeRef(document.getElementById('toggle-legend')).as(HTMLButtonElement);

toggle_legend_button.addEventListener('click', () => {
  if (toInt(legend.style.height, 0) === 1) {
    legend.style.removeProperty('height');
    legend.style.removeProperty('overflow');
  } else {
    legend.style.height = '1em';
    legend.style.overflow = 'hidden';
  }
});

/**
 * @param {number} left
 * @param {number} top
 */
export function updateLegends(left, top) {
  legend.style.left = `${left}px`;
  legend.style.top = `${top}px`;
}
