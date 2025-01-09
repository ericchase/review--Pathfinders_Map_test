export class SVGCircleEditor {
  /**
   * @type {SVGCircleElement}
   */
  element = undefined;
  /**
   * @param {{x:number;y:number;}} delta
   */
  move(delta) {
    this.element.cx.baseVal.value += delta.x;
    this.element.cy.baseVal.value += delta.y;
  }
}

export class SVGRectEditor {
  /**
   * @type {SVGRectElement} element
   */
  element = undefined;
  /**
   * @param {{x:number;y:number;}} delta
   */
  move(delta) {
    this.element.x.baseVal.value += delta.x;
    this.element.y.baseVal.value += delta.y;
  }
}

export class SVGPolygonEditor {
  /**
   * @type {SVGPolygonElement} element
   */
  element = undefined;
  /**
   * @param {{x:number;y:number;}} delta
   */
  move(delta) {
    for (const point of this.element.points) {
      point.x += delta.x;
      point.y += delta.y;
    }
  }
}

const circleEditor = new SVGCircleEditor();
const rectEditor = new SVGRectEditor();
const polygonEditor = new SVGPolygonEditor();

/**
 * @param {SVGElement} element
 */
export function getEditor(element) {
  if (element instanceof SVGCircleElement) {
    circleEditor.element = element;
    return circleEditor;
  }
  if (element instanceof SVGRectElement) {
    rectEditor.element = element;
    return rectEditor;
  }
  if (element instanceof SVGPolygonElement) {
    polygonEditor.element = element;
    return polygonEditor;
  }
}
