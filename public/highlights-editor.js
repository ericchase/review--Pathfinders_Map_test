import { NodeRef } from './script/lib/Node_Utility.js';

const highlight_x = NodeRef(document.querySelector('#highlight-editor #x')).as(HTMLInputElement);
const highlight_y = NodeRef(document.querySelector('#highlight-editor #y')).as(HTMLInputElement);
const highlight_r = NodeRef(document.querySelector('#highlight-editor #r')).as(HTMLInputElement);

const highlight_1 = NodeRef(document.getElementById('highlight-1')).as(SVGCircleElement);

highlight_x.addEventListener('input', () => {
  if (Number.isNaN(Number.parseFloat(highlight_x.value)) === false) {
    highlight_1.setAttribute('cx', highlight_x.value);
  }
});
highlight_y.addEventListener('input', () => {
  if (Number.isNaN(Number.parseFloat(highlight_y.value)) === false) {
    highlight_1.setAttribute('cy', highlight_y.value);
  }
});
highlight_r.addEventListener('input', () => {
  if (Number.isNaN(Number.parseFloat(highlight_r.value)) === false) {
    highlight_1.setAttribute('r', highlight_r.value);
  }
});
