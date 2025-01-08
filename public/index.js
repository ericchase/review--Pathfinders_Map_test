import { toPoint } from './script/CoordinateSpaceContainer.js';
import { NodeRef } from './script/lib/Node_Utility.js';
import { ZoomController } from './script/ZoomController.js';

const container = document.getElementById('map-container');
const child = document.getElementById('map');

// custom curve function for smooth zooming
function zoomCurve(value) {
  const exponential_base = 1 / 2;
  const input_min = 0.1;
  const input_max = 2;
  const output_min = 0.01;
  const output_max = 0.5;
  const EB_IM = Math.pow(exponential_base, input_min);
  return Math.max(output_min, output_min + ((output_max - output_min) * (Math.pow(exponential_base, value) - EB_IM)) / (Math.pow(exponential_base, input_max) - EB_IM));
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
zoomController.onTransform((scale, point) => {
  ruler_h.style.left = `${point.x}px`;
  ruler_h.style.transform = `scale(${scale})`;

  ruler_v.style.top = `${point.y}px`;
  ruler_v.style.transform = `scale(${scale})`;

  legend.style.left = `${10 + ruler_v.getBoundingClientRect().width}px`;
  legend.style.top = `${10 + ruler_h.getBoundingClientRect().height}px`;
});

zoomController.init();
zoomController.setScale(0.2);
zoomController.centerChild();
zoomController.setPosition(toPoint(zoomController.parse_x(), 10));
