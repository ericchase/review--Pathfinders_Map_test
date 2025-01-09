/**
 * @param {HTMLElement|SVGElement} element
 * @param {object} listeners
 * @param {(event:Event)=>void=} listeners.onContextMenu
 * @param {(event:Event,point:{x:number;y:number;})=>void=} listeners.onPointerDown
 * @param {(event:Event,point:{x:number;y:number;})=>void=} listeners.onPointerUp
 * @param {(event:Event,point:{x:number;y:number;})=>void=} listeners.onMiddleDown
 * @param {(event:Event,point:{x:number;y:number;})=>void=} listeners.onMiddleUp
 * @param {(event:Event,point:{x:number;y:number;})=>void=} listeners.onRightDown
 * @param {(event:Event,point:{x:number;y:number;})=>void=} listeners.onRightUp
 * @param {(event:Event,point:{x:number;y:number;})=>void=} listeners.onClick
 * @param {(event:Event,delta:{x:number;y:number;},setCapture:(element:HTMLElement|SVGElement)=>void)=>void=} listeners.onDrag
 * @param {(event:Event,delta:number,center:{x:number;y:number;})=>void=} listeners.onPinch
 * @param {(event:Event,delta:number,point:{x:number;y:number;})=>void=} listeners.onScroll
 */
export function setupPointerEvents(element, listeners) {
  let dragStart = { x: 0, y: 0 };
  let pinchStart = 0;

  /**
   * @type {Map<number,{x:number,y:number}>}
   */
  const pointers = new Map();
  /**
   * @param {PointerEvent} event
   */
  function pointersAdd(event) {
    pointersSet(event);
    element.removeEventListener('pointermove', dragHandler);
    element.removeEventListener('pointermove', pinchHandler);
    element.removeEventListener('pointerup', clickHandler);
    switch (pointers.size) {
      case 1:
        dragStart = { x: event.clientX, y: event.clientY };
        element.addEventListener('pointermove', dragHandler);
        element.addEventListener('pointerup', clickHandler);
        break;
      case 2:
        pinchStart = getPinchDistance();
        element.addEventListener('pointermove', pinchHandler);
        break;
    }
  }
  function pointersClear() {
    element.removeEventListener('pointermove', dragHandler);
    element.removeEventListener('pointermove', pinchHandler);
  }
  /**
   * @param {PointerEvent} event
   */
  function pointersDelete(event) {
    pointers.delete(event.pointerId);
    element.removeEventListener('pointermove', dragHandler);
    element.removeEventListener('pointermove', pinchHandler);
    switch (pointers.size) {
      case 1:
        element.addEventListener('pointermove', dragHandler);
        break;
      case 2:
        element.addEventListener('pointermove', pinchHandler);
        break;
    }
  }
  /**
   * @param {PointerEvent} event
   */
  function pointersSet(event) {
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  }
  function getPinchCenter() {
    const [pointer1, pointer2] = [...pointers.values()];
    // Calculate the center point between the two pointers
    const x = (pointer1.x + pointer2.x) / 2;
    const y = (pointer1.y + pointer2.y) / 2;
    return { x, y };
  }
  function getPinchDistance() {
    const [pointer1, pointer2] = [...pointers.values()];
    // Calculate the distance between the two pointers (pinch distance)
    const dx = pointer2.x - pointer1.x;
    const dy = pointer2.y - pointer1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * @param {PointerEvent} event
   */
  function clickHandler(event) {
    element.removeEventListener('pointerup', clickHandler);
    listeners.onClick?.(event, { x: event.clientX, y: event.clientY });
  }

  /**
   * @param {PointerEvent} event
   */
  function dragHandler(event) {
    element.removeEventListener('pointerup', clickHandler);
    pointersSet(event);
    const dragEnd = { x: event.clientX, y: event.clientY };
    const dragDelta = { x: dragEnd.x - dragStart.x, y: dragEnd.y - dragStart.y };
    listeners.onDrag?.(event, dragDelta, (element) => {
      element.setPointerCapture(event.pointerId);
    });
    dragStart = dragEnd;
  }

  /**
   * @param {PointerEvent} event
   */
  function pinchHandler(event) {
    pointersSet(event);
    const pinchDistance = getPinchDistance();
    listeners.onPinch?.(event, pinchDistance - pinchStart, getPinchCenter());
    pinchStart = pinchDistance;
  }

  /**
   * @param {PointerEvent} event
   */
  function downHandler(event) {
    if (event.pointerType === 'mouse') {
      switch (event.button) {
        case 1: // middle click
          listeners.onMiddleDown?.(event, { x: event.clientX, y: event.clientY });
          return;
        case 2: // right click
          listeners.onRightDown?.(event, { x: event.clientX, y: event.clientY });
          return;
      }
    }
    pointersAdd(event);
    listeners.onPointerDown?.(event, { x: event.clientX, y: event.clientY });
  }

  /**
   * @param {PointerEvent} event
   */
  function upHandler(event) {
    if (event.pointerType === 'mouse') {
      switch (event.button) {
        case 1: // middle click
          listeners.onMiddleUp?.(event, { x: event.clientX, y: event.clientY });
          return;
        case 2: // right click
          listeners.onRightUp?.(event, { x: event.clientX, y: event.clientY });
          return;
      }
    }
    pointersDelete(event);
    listeners.onPointerUp?.(event, { x: event.clientX, y: event.clientY });
  }

  /**
   * @param {PointerEvent} event
   */
  function cancelHandler(event) {
    pointersClear();
  }

  /**
   * @param {MouseEvent} event
   */
  function contextmenuHandler(event) {
    listeners.onContextMenu?.(event);
  }

  /**
   * @param {WheelEvent} event
   */
  function scrollHandler(event) {
    listeners.onScroll?.(event, event.deltaY, { x: event.clientX, y: event.clientY });
  }

  element.addEventListener('contextmenu', contextmenuHandler);
  element.addEventListener('pointerdown', downHandler);
  element.addEventListener('pointerup', upHandler);
  element.addEventListener('pointercancel', cancelHandler);
  element.addEventListener('wheel', scrollHandler);

  return () => {
    element.removeEventListener('contextmenu', contextmenuHandler);
    element.removeEventListener('pointercancel', cancelHandler);
    element.removeEventListener('pointerdown', downHandler);
    element.removeEventListener('pointermove', dragHandler);
    element.removeEventListener('pointermove', pinchHandler);
    element.removeEventListener('pointerup', clickHandler);
    element.removeEventListener('pointerup', upHandler);
    element.removeEventListener('wheel', scrollHandler);
  };
}
