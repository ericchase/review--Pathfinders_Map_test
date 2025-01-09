import { CNodeRef, NodeRef } from './lib/Node_Utility.js';

/**
 * @param {string} string
 * @param {number} default_value
 */
export function toInt(string, default_value) {
  const v = Number.parseInt(string);
  return Number.isNaN(v) ? default_value : v;
}

/**
 * @param {string} string
 * @param {number} default_value
 */
export function toFloat(string, default_value) {
  const v = Number.parseFloat(string);
  return Number.isNaN(v) ? default_value : v;
}

/**
 * @param {object} from_point
 * @param {number} from_point.x
 * @param {number} from_point.y
 * @param {object} to_point
 * @param {number} to_point.x
 * @param {number} to_point.y
 */
export function getDelta(from_point, to_point) {
  return toPoint(
    to_point.x - from_point.x,
    to_point.y - from_point.y,
    //
  );
}

/**
 * @param {number} scale
 * @param {object} point
 * @param {number} point.x
 * @param {number} point.y
 */
export function scalePoint(scale, point) {
  return toPoint(
    scale * point.x,
    scale * point.y,
    //
  );
}

/**
 * @param {number} x
 * @param {number} y
 */
export function toPoint(x, y) {
  return { x, y };
}

export class CoordinateSpaceContainer {
  /**
   * @type { HTMLElement }
   */
  container;
  /**
   * @type { Map<CNodeRef, HTMLElement> }
   */
  children = new Map();

  constructor(container) {
    this.container = NodeRef(container).as(HTMLElement);
  }
  addChild(child) {
    const ref = NodeRef(child);
    this.children.set(ref, ref.as(HTMLElement));
    return ref;
  }

  /**
   * @param {HTMLElement} child
   * @memberof CordinateSpaceContainer
   */
  deltaChildCenterToContainerCenter(child) {
    return getDelta(
      this.childPointToContainerPoint(child, this.childPercentagesToChildPoint(child, toPoint(0.5, 0.5))),
      this.containerPercentagesToContainerPoint(toPoint(0.5, 0.5)),
      //
    );
  }

  /**
   * @param {HTMLElement} child
   * @param {object} point
   * @param {number} point.x
   * @param {number} point.y
   * @memberof CordinateSpaceContainer
   */
  deltaChildPointToContainerCenter(child, point) {
    return getDelta(
      this.childPointToContainerPoint(child, point),
      this.containerPercentagesToContainerPoint(toPoint(0.5, 0.5)),
      //
    );
  }

  /**
   * @param {object} point
   * @param {number} point.x
   * @param {number} point.y
   * @memberof CordinateSpaceContainer
   */
  deltaGlobalPointToContainerCenter(point) {
    return getDelta(
      point,
      this.containerPercentagesToContainerPoint(toPoint(0.5, 0.5)),
      //
    );
  }

  /**
   * @param {object} global_point
   * @param {number} global_point.x
   * @param {number} global_point.y
   * @param {object} container_point
   * @param {number} container_point.x
   * @param {number} container_point.y
   * @memberof CordinateSpaceContainer
   */
  deltaGlobalPointToContainerPoint(global_point, container_point) {
    return getDelta(
      global_point,
      this.containerPointToGlobalPoint(container_point),
      //
    );
  }

  /**
   * @param {HTMLElement} child
   * @param {object} point
   * @param {number} point.x
   * @param {number} point.y
   * @memberof CordinateSpaceContainer
   */
  childPointToChildPercentages(child, point) {
    const rect = child.getBoundingClientRect();
    return toPoint(
      point.x / rect.width,
      point.y / rect.height,
      //
    );
  }

  /**
   * @param {HTMLElement} child
   * @param {object} percentage
   * @param {number} percentage.x as a decimal
   * @param {number} percentage.y as a decimal
   * @memberof CordinateSpaceContainer
   */
  childPercentagesToChildPoint(child, percentage) {
    const rect = child.getBoundingClientRect();
    return toPoint(
      percentage.x * rect.width,
      percentage.y * rect.height,
      //
    );
  }

  /**
   * @param {HTMLElement} child
   * @param {object} point
   * @param {number} point.x
   * @param {number} point.y
   */
  childPointToContainerPoint(child, point) {
    return toPoint(
      toFloat(child.style.left, 0) + point.x,
      toFloat(child.style.top, 0) + point.y,
      //
    );
  }

  /**
   * @param {HTMLElement} child
   * @param {object} point
   * @param {number} point.x
   * @param {number} point.y
   * @memberof CordinateSpaceContainer
   */
  childPointToGlobalPoint(child, point) {
    return this.containerPointToGlobalPoint(this.childPointToContainerPoint(child, point));
  }

  /**
   * @param {object} point
   * @param {number} point.x
   * @param {number} point.y
   * @memberof CordinateSpaceContainer
   */
  containerPointToContainerPercentages(point) {
    const rect = this.container.getBoundingClientRect();
    return toPoint(
      point.x / rect.width,
      point.y / rect.height,
      //
    );
  }

  /**
   * @param {object} percentage
   * @param {number} percentage.x as a decimal
   * @param {number} percentage.y as a decimal
   * @memberof CordinateSpaceContainer
   */
  containerPercentagesToContainerPoint(percentage) {
    const rect = this.container.getBoundingClientRect();
    return toPoint(
      percentage.x * rect.width,
      percentage.y * rect.height,
      //
    );
  }

  /**
   * @param {object} point
   * @param {number} point.x
   * @param {number} point.y
   * @memberof CordinateSpaceContainer
   */
  containerPointToGlobalPoint(point) {
    const rect = this.container.getBoundingClientRect();
    return toPoint(
      rect.x + point.x,
      rect.y + point.y,
      //
    );
  }

  /**
   * @param {HTMLElement} child
   * @param {object} point
   * @param {number} point.x
   * @param {number} point.y
   * @memberof CordinateSpaceContainer
   */
  globalPointToChildPoint(child, point) {
    const container = this.globalPointToContainerPoint(point);
    return toPoint(
      container.x - toFloat(child.style.left, 0),
      container.y - toFloat(child.style.top, 0),
      //
    );
  }

  /**
   * @param {object} point
   * @param {number} point.x
   * @param {number} point.y
   * @memberof CordinateSpaceContainer
   */
  globalPointToContainerPoint(point) {
    const rect = this.container.getBoundingClientRect();
    return toPoint(
      point.x - rect.x,
      point.y - rect.y,
      //
    );
  }
}
