import { changeSelectedHighlight, dragSelectedHighlight, isHighlight, isSelectedHighlight, setupHighlights } from './highlights-editor.js';
import { scalePoint, toInt } from './script/CoordinateSpaceContainer.js';
import { NodeRef } from './script/lib/Node_Utility.js';
import { ZoomController } from './script/ZoomController.js';

const container = document.getElementById('zoom-container-0');
const child = document.getElementById('zoom-child-0');

const legend = NodeRef(document.getElementById('legend')).as(HTMLElement);
const toggle_legend = NodeRef(document.getElementById('toggle-legend')).as(HTMLButtonElement);
const ruler_h = NodeRef(document.getElementById('ruler-h')).as(HTMLElement);
const ruler_v = NodeRef(document.getElementById('ruler-v')).as(HTMLElement);

// viewer settings
function saveSettings(data) {
  localStorage.setItem('settings', JSON.stringify(data));
}
function loadSettings() {
  const settings = localStorage.getItem('settings');
  return settings ? JSON.parse(settings) : undefined;
}
// load settings before setting up zoom controller
const loaded_settings = loadSettings();

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
  zoom_min: 0.05,
  zoom_max: 4,
  zoom_delta_function: zoomCurve,
});

// update other elements on drag and zoom
zoomController.setTransformListener((scale, point) => {
  saveSettings({ scale, point });

  // const secondary_scale = Math.min(scale, 0.5);

  // move and scale the rulers
  ruler_h.style.left = `${point.x}px`;
  // ruler_h.style.transform = `scale(${scale},${secondary_scale})`;
  ruler_h.style.transform = `scale(${scale})`;
  ruler_v.style.top = `${point.y}px`;
  // ruler_v.style.transform = `scale(${secondary_scale},${scale})`;
  ruler_v.style.transform = `scale(${scale})`;

  // move the legend to clear the rulers
  legend.style.left = `${10 + ruler_v.getBoundingClientRect().width}px`;
  legend.style.top = `${10 + ruler_h.getBoundingClientRect().height}px`;
});

// initialize the controller
zoomController.setupEvents();

if (loaded_settings) {
  zoomController.setTransform(loaded_settings.scale, loaded_settings.point);
} else {
  zoomController.setScale(0.1);
  zoomController.centerChild();
  // zoomController.setPosition(toPoint(zoomController.parse_x(), 10));
}

// toggle legend contents
toggle_legend.addEventListener('click', () => {
  if (toInt(legend.style.height, 0) === 1) {
    legend.style.removeProperty('height');
    legend.style.removeProperty('overflow');
  } else {
    legend.style.height = '1em';
    legend.style.overflow = 'hidden';
  }
});

setupHighlights();
// setupMarkers();

zoomController.setClickListener((event) => {
  if (isHighlight(event.target)) {
    changeSelectedHighlight(event.target);
  } else {
    changeSelectedHighlight();
  }
});
zoomController.setDragListener((event, delta, setCapture, consumeEvent) => {
  if (isSelectedHighlight(event.target)) {
    consumeEvent();
    setCapture(event.target);
    dragSelectedHighlight(scalePoint(1 / zoomController.parse_scale(), delta));
  }
});
