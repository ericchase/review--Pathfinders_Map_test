import { scalePoint } from './CoordinateSpaceContainer.js';
import { setupPointerEvents } from './PointerEvents.js';

class VisualElementEditorHandle {
  size = 30;

  /**
   * @param {VisualElementEditor} editor
   * @this VisualElementEditorHandle
   */
  constructor(editor) {
    this.editor = editor;
    this.element = document.createElement('div');
    this.element.classList.add('visual-element-editor-handle');
    this.element.setAttribute('style', `width:${this.size}px; height:${this.size}px; left:0; top:0;`);
    this.cleanupEvents = () => {};
  }

  /**
   * @this VisualElementEditorHandle
   */
  hide() {
    this.element.remove();
    this.cleanupEvents();
    this.cleanupEvents = () => {};
  }

  /**
   * @this VisualElementEditorHandle
   */
  show() {
    const self = this;
    document.body.appendChild(this.element);
    this.cleanupEvents = setupPointerEvents(this.element, {
      onDrag(event, delta, setCapture) {
        setCapture(self.element);
        self.editor.resizeSelectedElementBy(delta);
      },
    });
    this.update();
  }

  /**
   * @this VisualElementEditorHandle
   */
  update() {
    const rect = this.editor.getSelectedElementRect();
    if (rect) {
      this.element.style.left = `${rect.x + rect.width + this.size}px`;
      this.element.style.top = `${rect.y + rect.height / 2 - this.size / 2}px`;
    }
  }
}

export class VisualElementEditor {
  /** @type Element= */
  activeElement;

  /** @type Set<VisualElementEditorHandle> */
  handleSet = new Set();

  /**
   * @this VisualElementEditor
   */
  constructor() {
    this.scale = 1;
    this.sizeHandle = new VisualElementEditorHandle(this);
    this.handleSet.add(this.sizeHandle);
  }

  /**
   * @returns previously active element
   * @this VisualElementEditor
   */
  deselectElement() {
    const element = this.activeElement;
    element?.classList.remove('selected');
    this.activeElement = undefined;
    for (const handle of this.handleSet) {
      handle.hide();
    }
    return element;
  }

  /**
   * @param {Element} element
   * @this VisualElementEditor
   */
  selectElement(element) {
    if (this.deselectElement() !== element) {
      this.activeElement = element;
      element.classList.add('selected');
      // move to top of container
      element.parentElement?.appendChild(element);
      for (const handle of this.handleSet) {
        handle.show();
      }
    }
  }

  /**
   * @param {Element} element
   * @this VisualElementEditor
   */
  isSelected(element) {
    return element && this.activeElement === element;
  }

  /**
   * @this VisualElementEditor
   */
  getSelectedElementRect() {
    return this.activeElement?.getBoundingClientRect();
  }

  /**
   * @param {object} delta
   * @param {number} delta.x
   * @param {number} delta.y
   * @this VisualElementEditor
   */
  moveSelectedElementBy(delta) {
    delta = scalePoint(this.scale, delta);

    if (this.activeElement instanceof SVGCircleElement) {
      this.activeElement.cx.baseVal.value += delta.x;
      this.activeElement.cy.baseVal.value += delta.y;
    }
    if (this.activeElement instanceof SVGRectElement) {
      this.activeElement.x.baseVal.value += delta.x;
      this.activeElement.y.baseVal.value += delta.y;
    }
    if (this.activeElement instanceof SVGPolygonElement) {
      for (const point of this.activeElement.points) {
        point.x += delta.x;
        point.y += delta.y;
      }
    }

    for (const handle of this.handleSet) {
      handle.update();
    }
  }

  /**
   * @param {object} delta
   * @param {number} delta.x
   * @param {number} delta.y
   * @this VisualElementEditor
   */
  resizeSelectedElementBy(delta) {
    delta = scalePoint(this.scale, delta);

    if (this.activeElement instanceof SVGCircleElement) {
      this.activeElement.r.baseVal.value += delta.x;
    }
    if (this.activeElement instanceof SVGRectElement) {
      this.activeElement.width.baseVal.value += delta.x;
      this.activeElement.height.baseVal.value += delta.y;
    }
    if (this.activeElement instanceof SVGPolygonElement) {
      // for (const point of this.activeElement.points) {
      // }
    }

    for (const handle of this.handleSet) {
      handle.update();
    }
  }

  /**
   * @param {number} scale
   * @this VisualElementEditor
   */
  setScale(scale) {
    this.scale = scale;
  }
}
