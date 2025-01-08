import { NodeRef } from './script/lib/Node_Utility.js';

const marker_x = NodeRef(document.querySelector('#marker-editor #x')).as(HTMLInputElement);
const marker_y = NodeRef(document.querySelector('#marker-editor #y')).as(HTMLInputElement);
const marker_r = NodeRef(document.querySelector('#marker-editor #r')).as(HTMLInputElement);

const marker_1 = NodeRef(document.getElementById('marker-1')).as(SVGCircleElement);

marker_x.addEventListener('input', () => {
  if (Number.isNaN(Number.parseFloat(marker_x.value)) === false) {
    marker_1.setAttribute('cx', marker_x.value);
  }
});
marker_y.addEventListener('input', () => {
  if (Number.isNaN(Number.parseFloat(marker_y.value)) === false) {
    marker_1.setAttribute('cy', marker_y.value);
  }
});
marker_r.addEventListener('input', () => {
  if (Number.isNaN(Number.parseFloat(marker_r.value)) === false) {
    marker_1.setAttribute('r', marker_r.value);
  }
});
