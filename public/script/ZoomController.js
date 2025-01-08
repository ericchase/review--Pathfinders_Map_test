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

    const new_scale_clamped = Math.min(this.options.zoom_max, Math.max(new_scale, this.options.zoom_min));

    // current point > child point > scaled child point > scaled point
    const child_point = this.coordinateSpace.globalPointToChildPoint(this.child, point);
    const child_point_scaled = scalePoint(new_scale_clamped / scale, child_point);
    const point_scaled = this.coordinateSpace.childPointToGlobalPoint(this.child, child_point_scaled);

    // delta from scaled point to current point
    const delta_point = getDelta(point_scaled, point);

    this.setTransform(new_scale_clamped, toPoint(x + delta_point.x, y + delta_point.y));
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
  let oldContainerRect = controller.container.getBoundingClientRect();

  controller.setTransform(1, toPoint(0, 0));

  let dragStart = toPoint(0, 0);
  let pinchStart = 0;

  /**
   * @type {Map<number,{clientX:number, clientY:number}>}
   */
  const pointers = new Map();

  function getPinchCenter() {
    const [pointer1, pointer2] = [...pointers.values()];
    // Calculate the center point between the two pointers
    const x = (pointer1.clientX + pointer2.clientX) / 2;
    const y = (pointer1.clientY + pointer2.clientY) / 2;
    return toPoint(x, y);
  }
  function getPinchDistance() {
    const [pointer1, pointer2] = [...pointers.values()];
    // Calculate the distance between the two pointers (pinch distance)
    const dx = pointer2.clientX - pointer1.clientX;
    const dy = pointer2.clientY - pointer1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  controller.container.addEventListener('pointerdown', (event) => {
    pointers.set(event.pointerId, { clientX: event.clientX, clientY: event.clientY });

    if (event.pointerType === 'mouse') {
      switch (event.button) {
        case 1:
          // middle click
          // center on point
          controller.moveDelta(controller.coordinateSpace.deltaGlobalPointToContainerCenter(toPoint(event.clientX, event.clientY)));
          return;
        case 2:
          // right click
          // do nothing
          isDragging = false;
          return;
      }
    }

    switch (pointers.size) {
      case 1:
        isDragging = true;
        dragStart = toPoint(event.clientX, event.clientY);
        controller.child.setPointerCapture(event.pointerId);
        break;
      case 2:
        pinchStart = getPinchDistance();
        break;
    }
  });

  controller.container.addEventListener('pointermove', (event) => {
    pointers.set(event.pointerId, { clientX: event.clientX, clientY: event.clientY });

    switch (pointers.size) {
      case 1:
        if (isDragging) {
          const dragDistance = toPoint(event.clientX, event.clientY);
          controller.moveDelta(getDelta(dragStart, dragDistance));
          dragStart = dragDistance;
        }
        break;
      case 2:
        {
          event.preventDefault(); // disable default pinch-to-zoom
          const pinchDistance = getPinchDistance();
          const deltaPinch = pinchDistance - pinchStart;
          if (deltaPinch < -1 || deltaPinch > 1) {
            fetch(`http://192.168.0.78:8000/${deltaPinch}`);
            // if (deltaPinch > 0.1 || deltaPinch < -0.1) {
            const targetScale = controller.parse_scale() + deltaPinch / 100;
            controller.zoomTo(targetScale, getPinchCenter());
            // }
          }
          pinchStart = getPinchDistance();
        }
        break;
    }
  });

  controller.container.addEventListener('pointerup', (event) => {
    pointers.delete(event.pointerId);
    isDragging = false;
  });

  controller.container.addEventListener('pointercancel', (event) => {
    pointers.delete(event.pointerId);
    isDragging = false;
  });

  controller.container.addEventListener('contextmenu', (event) => {
    event.preventDefault();
  });
  controller.container.addEventListener('wheel', (event) => {
    event.preventDefault();
    if (event.deltaY < 0) {
      controller.zoomIn(toPoint(event.clientX, event.clientY));
    } else if (event.deltaY > 0) {
      controller.zoomOut(toPoint(event.clientX, event.clientY));
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
