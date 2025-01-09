import { NodeRef } from './script/lib/Node_Utility.js';
import { updateLegends } from './script/map-legends.js';
import { getOverlayMarkers, isOverlayElement, loadOverlays } from './script/map-overlays.js';
import { getRulerHRect, getRulerVRect, updateRulers } from './script/map-rulers.js';
import { VisualElementEditor } from './script/VisualElementEditor.js';
import { ZoomController } from './script/ZoomController.js';

loadOverlays();

const settings = loadSettings();

const zoomContainer = NodeRef(document.getElementById('zoom-container-0')).as(HTMLElement);
const zoomChild = NodeRef(document.getElementById('zoom-child-0')).as(HTMLElement);
const zoomController = new ZoomController(zoomContainer, zoomChild, {
  enable_edge_clamping: false,
  zoom_min: 0.05,
  zoom_max: 4,
  zoom_delta_function: zoomCurve,
});

const visualEditor = new VisualElementEditor({
  editorHandleContainer: zoomContainer,
  elementContainer: zoomChild,
  elementContainerCoordinateSpace: zoomController.coordinateSpace,
});

zoomController.setClickListener((event) => {
  if (isOverlayElement(event.target)) {
    visualEditor.selectElement(event.target);
  } else {
    visualEditor.deselectElement();
  }
});

zoomController.setDragListener((event, delta, consumeEvent) => {
  if (isOverlayElement(event.target) && visualEditor.isSelected(event.target)) {
    consumeEvent();
    visualEditor.moveSelectedElementBy(delta);
  }
});

zoomController.setTransformListener((scale, point) => {
  saveSettings({ scale, point });

  updateRulers(scale, point);
  updateLegends(10 + getRulerVRect().width, 10 + getRulerHRect().height);

  visualEditor.setScale(1 / scale);
  visualEditor.updateHandles();
});

// initialize the controller
zoomController.setupEvents();

if (settings) {
  zoomController.setTransform(settings.scale, settings.point);
} else {
  zoomController.setScale(0.1);
  zoomController.centerChild();
}

/**
 * Custom curve function for smooth zooming.
 * @param {number} scale
 */
function zoomCurve(scale) {
  const exponential_base = 1 / 2;
  const input_min = 0.1;
  const input_max = 2;
  const output_min = 0.01;
  const output_max = 0.5;
  const EB_IM = Math.pow(exponential_base, input_min);
  return Math.max(output_min, output_min + ((output_max - output_min) * (Math.pow(exponential_base, scale) - EB_IM)) / (Math.pow(exponential_base, input_max) - EB_IM));
}

function loadSettings() {
  const settings = localStorage.getItem('settings');
  return settings ? JSON.parse(settings) : undefined;
}

/**
 * @param {object} data
 */
function saveSettings(data) {
  localStorage.setItem('settings', JSON.stringify(data));
}

const highlightContainer = NodeRef(document.getElementById('overlay-container-0')).as(SVGElement);
const saveButton = NodeRef(document.getElementById('save')).as(HTMLButtonElement);

saveButton.addEventListener('click', () => {
  saveOverlays();
});

function saveOverlays() {
  {
    const children_html = [];
    const clone = NodeRef(highlightContainer.cloneNode(true)).as(SVGElement);
    for (const element of clone.children) {
      element.removeAttribute('class');
      children_html.push(element.outerHTML.trim());
    }
    fetch('/write/highlights', { method: 'POST', body: children_html.join('\n').trim() });
  }
  {
    const marker_data_list = [];
    for (const marker of getOverlayMarkers()) {
      marker_data_list.push(marker.getData());
    }
    fetch('/write/markers', { method: 'POST', body: JSON.stringify(marker_data_list) });
  }
}
