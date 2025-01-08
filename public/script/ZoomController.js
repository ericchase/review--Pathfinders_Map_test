import { CoordinateSpaceContainer, getDelta, scalePoint, toFloat, toPoint } from './CoordinateSpaceContainer.js';
import { NodeRef } from './lib/Node_Utility.js';

export class ZoomController {
  /**
   * @param {HTMLElement} container_element
   * @param {HTMLElement} child_element
   * @param {object} options
   * @param {boolean=} options.enable_edge_clamping false
   * @param {number=} options.zoom_min 0.1
   * @param {number=} options.zoom_max 2
   * @param {number=} options.zoom_delta 0.5
   * @param {(scale:number)=>number=} options.zoom_delta_function () => options.zoom_delta
   */
  constructor(container_element, child_element, options) {
    this.containerRef = NodeRef(container_element);
    this.container = this.containerRef.as(HTMLElement);
    this.childRef = NodeRef(child_element);
    this.child = this.childRef.as(HTMLElement);
    this.options = options;
    this.options.enable_edge_clamping ??= false;
    this.options.zoom_max ??= 2;
    this.options.zoom_min ??= 0.1;
    this.options.zoom_delta ??= 0.5;
    this.options.zoom_delta_function ??= () => options.zoom_delta;

    this.child_original_rectangle = this.child.getBoundingClientRect();

    // setup the coordinate space
    this.coordinateSpace = new CoordinateSpaceContainer(this.container);
    this.coordinateSpace.addChild(this.child);
  }

  // Event Subscriptions

  /**
   * @type {Set<(scale: number, point: { x: number, y: number }) => void>}
   */
  transform_subscribers = new Set();

  /**
   * @param {(scale: number, point: { x: number, y: number }) => void} fn
   * @this ZoomController
   */
  onTransform(fn) {
    this.transform_subscribers.add(fn);
    return () => {
      this.transform_subscribers.delete(fn);
    };
  }

  // Parse Values

  /**
   * @this ZoomController
   */
  parse_position() {
    return toPoint(this.parse_x(), this.parse_y());
  }

  /**
   * @this ZoomController
   */
  parse_scale() {
    const scaleIndex = this.child.style.transform.indexOf('scale(');
    if (scaleIndex !== -1) {
      const scaleStart = scaleIndex + 'scale('.length;
      const scaleEnd = this.child.style.transform.indexOf(')', scaleStart);
      const scaleText = this.child.style.transform.slice(scaleStart, scaleEnd).trim();
      return toFloat(scaleText, 1);
    }
    return 1;
  }

  /**
   * @this ZoomController
   */
  parse_x() {
    return toFloat(this.child.style.left, 0);
  }

  /**
   * @this ZoomController
   */
  parse_y() {
    return toFloat(this.child.style.top, 0);
  }

  // Transform Functions

  /**
   * @this ZoomController
   */
  centerChild() {
    this.setTransform(this.parse_scale(), this.coordinateSpace.deltaChildCenterToContainerCenter(this.child));
  }

  /**
   * @param {number} scale
   * @param {object} point
   * @param {number} point.x
   * @param {number} point.y
   * @this ZoomController
   */
  clampCoordinates(scale, point) {
    if (this.options.enable_edge_clamping === true) {
      const containerRect = this.container.getBoundingClientRect();

      const width = this.child_original_rectangle.width * scale;
      if (width > containerRect.width) {
        point.x = Math.min(0, Math.max(point.x, containerRect.width - width));
      } else {
        point.x = 0.5 * (containerRect.width - width);
      }

      const height = this.child_original_rectangle.height * scale;
      if (height > containerRect.height) {
        point.y = Math.min(0, Math.max(point.y, containerRect.height - height));
      } else {
        point.y = 0.5 * (containerRect.height - height);
      }
    }
    return point;
  }

  /**
   * @param {object} point
   * @param {number} point.x
   * @param {number} point.y
   * @this ZoomController
   */
  zoomIn(point) {
    const scale = this.parse_scale();
    const delta_zoom_clamped = this.options.zoom_delta_function(scale);
    const scale_clamped = Math.min(this.options.zoom_max, Math.max(scale + delta_zoom_clamped, this.options.zoom_min));
    this.zoomTo(scale_clamped, point);
  }

  /**
   * @param {object} point
   * @param {number} point.x
   * @param {number} point.y
   * @this ZoomController
   */
  zoomOut(point) {
    const scale = this.parse_scale();
    const delta_zoom_clamped = -1 * this.options.zoom_delta_function(scale);
    const scale_clamped = Math.min(this.options.zoom_max, Math.max(scale + delta_zoom_clamped, this.options.zoom_min));
    this.zoomTo(scale_clamped, point);
  }

  /**
   * @param {number} new_scale
   * @param {object} point
   * @param {number} point.x
   * @param {number} point.y
   * @this ZoomController
   */
  zoomTo(new_scale, point) {
    const scale = this.parse_scale();
    const x = this.parse_x();
    const y = this.parse_y();

    // current point > child point > scaled child point > scaled point
    const child_point = this.coordinateSpace.globalPointToChildPoint(this.child, point);
    const child_point_scaled = scalePoint(new_scale / scale, child_point);
    const point_scaled = this.coordinateSpace.childPointToGlobalPoint(this.child, child_point_scaled);

    // delta from scaled point to current point
    const delta_point = getDelta(point_scaled, point);

    this.setTransform(new_scale, toPoint(x + delta_point.x, y + delta_point.y));
  }

  /**
   * @param {object} delta_point
   * @param {number} delta_point.x
   * @param {number} delta_point.y
   * @this ZoomController
   */
  moveDelta(delta_point) {
    this.setTransform(this.parse_scale(), toPoint(this.parse_x() + delta_point.x, this.parse_y() + delta_point.y));
  }

  /**
   * @param {object} point
   * @param {number} point.x
   * @param {number} point.y
   * @this ZoomController
   */
  moveTo(point) {
    this.setTransform(this.parse_scale(), point);
  }

  /**
   * @param {number} scale
   * @this ZoomController
   */
  setScale(scale) {
    const scale_clamped = Math.min(this.options.zoom_max, Math.max(scale, this.options.zoom_min));
    this.setTransform(scale_clamped, this.parse_position());
  }

  /**
   * @param {object} point
   * @param {number} point.x
   * @param {number} point.y
   */
  setPosition(point) {
    this.setTransform(this.parse_scale(), point);
  }

  /**
   * @param {number} scale
   * @param {object} point
   * @param {number} point.x
   * @param {number} point.y
   * @this ZoomController
   */
  setTransform(scale, point) {
    const clamped_point = this.clampCoordinates(scale, point);
    this.child.style.left = `${clamped_point.x}px`;
    this.child.style.top = `${clamped_point.y}px`;
    this.child.style.transform = `scale(${scale})`;
    for (const fn of this.transform_subscribers) {
      fn(scale, clamped_point);
    }
  }

  /**
   * @this ZoomController
   */
  init() {
    SetupZoomControl(this);
  }
}

/**
 * @this {void}
 * @param {ZoomController} controller
 */
function SetupZoomControl(controller) {
  let isDragging = false;
  let dragStart = toPoint(0, 0);
  let oldContainerRect = controller.container.getBoundingClientRect();

  controller.setTransform(1, toPoint(0, 0));

  let activeTouches = new Set();

  controller.container.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'touch') {
      activeTouches.add(event.pointerId);
    }
    if (event.button === 1) {
      // middle click
      controller.moveDelta(controller.coordinateSpace.deltaGlobalPointToContainerCenter(toPoint(event.clientX, event.clientY)));
    } else if (event.button === 2) {
      // right click
    } else {
      isDragging = true;
      dragStart = toPoint(event.clientX, event.clientY);
      controller.child.setPointerCapture(event.pointerId);
    }
  });

  controller.container.addEventListener('pointerup', (event) => {
    isDragging = false;
    //   if (event.pointerType === 'touch') {
    activeTouches.delete(event.pointerId);
    //   }
  });

  controller.container.addEventListener('pointercancel', (event) => {
    isDragging = false;
    activeTouches.delete(event.pointerId);
  });

  controller.container.addEventListener('wheel', (event) => {
    event.preventDefault();
    if (event.deltaY < 0) {
      controller.zoomIn(toPoint(event.clientX, event.clientY));
    } else {
      controller.zoomOut(toPoint(event.clientX, event.clientY));
    }
  });

  document.addEventListener('pointermove', (event) => {
    if (activeTouches.size > 1) {
      event.preventDefault(); // disable pinch-to-zoom
    } else {
      if (isDragging) {
        controller.moveDelta(getDelta(dragStart, toPoint(event.clientX, event.clientY)));
        dragStart = toPoint(event.clientX, event.clientY);
      }
    }
  });

  window.addEventListener('resize', () => {
    const newContainerRect = controller.container.getBoundingClientRect();

    // this math took forever
    // basically, it's getting the centers of the old and new container sizes and
    // offsetting those distances to the map's left and top values

    const old_center = toPoint(0.5 * oldContainerRect.width, 0.5 * oldContainerRect.height);
    const new_center = toPoint(0.5 * newContainerRect.width, 0.5 * newContainerRect.height);
    controller.moveDelta(getDelta(old_center, new_center));

    oldContainerRect = newContainerRect;
  });
}
