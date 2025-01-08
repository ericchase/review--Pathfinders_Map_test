import { NodeRef } from './script/lib/Node_Utility.js';
import { ZoomController } from './script/ZoomController.js';

const container = document.getElementById('map-container');
const child = document.getElementById('map');

// custom curve function for smooth zooming
function zoomCurve(scale) {
  const exponential_base = 1 / 2;
  const input_min = 0.1;
  const input_max = 2;
  const output_min = 0.01;
  const output_max = 0.5;
  const EB_IM = Math.pow(exponential_base, input_min);
  return Math.max(output_min, output_min + ((output_max - output_min) * (Math.pow(exponential_base, scale) - EB_IM)) / (Math.pow(exponential_base, input_max) - EB_IM));
}

const zoomController = new ZoomController(container, child, {
  enable_edge_clamping: false,
  zoom_max: 4,
  zoom_delta_function: zoomCurve,
});

// update the floating rulers
const ruler_h = NodeRef(document.getElementById('ruler-h')).as(HTMLElement);
const ruler_v = NodeRef(document.getElementById('ruler-v')).as(HTMLElement);
const legend = NodeRef(document.getElementById('legend')).as(HTMLElement);
const marker_container = NodeRef(document.getElementById('marker-container')).as(SVGElement);

zoomController.onTransform((scale, point) => {
  ruler_h.style.left = `${point.x}px`;
  ruler_h.style.transform = `scale(${scale})`;

  ruler_v.style.top = `${point.y}px`;
  ruler_v.style.transform = `scale(${scale})`;

  legend.style.left = `${10 + ruler_v.getBoundingClientRect().width}px`;
  legend.style.top = `${10 + ruler_h.getBoundingClientRect().height}px`;

  marker_container.style.left = `${point.x}px`;
  marker_container.style.top = `${point.y}px`;
  marker_container.style.transform = `scale(${scale})`;
});

zoomController.init();
// zoomController.setScale(1);
// zoomController.centerChild();
// zoomController.setPosition(toPoint(zoomController.parse_x(), 10));

// marker editor
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
