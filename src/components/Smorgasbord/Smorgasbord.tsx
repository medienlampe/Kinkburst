import React, { useState, type JSX } from "react";
import { useTranslation } from "react-i18next";

import * as d3 from "d3";
import "./Smorgasbord.css";
import type { Practice } from "../../interfaces";
import { hierarchicalNodesAtom } from "../../states/hierarchicalNodes.atom";
import { useAtomValue } from "jotai";
import { padding, diameter, radius, STATUSES } from "../../constants";

interface SmorgasbordProps {
  onElementClick: (uuid: string) => void;
  onElementRightClick: (uuid: string) => void;
}

// Touch devices have no right-click: holding the finger still opens the context overlay.
const LONG_PRESS_MS = 500;
// A pending long press is cancelled as soon as the finger moves this far (rotation starts).
const DRAG_THRESHOLD_PX = 10;

// Pick a readable text color (black or white) for a given fill color.
const textColorFor = (fill: string): string => {
  const color = d3.rgb(fill);
  if (!color) return "#fff";

  const luminance = (0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b) / 255;
  return luminance > 0.5 ? "#000" : "#fff";
};

const Smorgasbord = ({ onElementClick, onElementRightClick } : SmorgasbordProps) : JSX.Element => {
  const { t } = useTranslation();

  const svgRef = React.useRef<SVGSVGElement>(null);
  
  const nodes = useAtomValue(hierarchicalNodesAtom);
  
  const [ dragSubject, setDragSubject ] = useState<d3.HierarchyRectangularNode<Practice> | null>(null);
  const [ globalRotation, setGlobalRotation ] = useState(0.0);
  const [ previousRotation, setPreviousRotation ] = useState(0.0);
  const [ dragStart, setDragStart ] = useState<{ x: number | null, y: number | null }>({x: null, y: null});

  const longPressTimer = React.useRef<number | null>(null);
  const longPressFired = React.useRef(false);
  // The pointer that started the current drag; other pointers (e.g. a second
  // finger while the page scrolls) are ignored.
  const activePointerId = React.useRef<number | null>(null);

  const cancelLongPress = () : void => {
    if (longPressTimer.current !== null) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // Clear pending timers if the component unmounts.
  React.useEffect(() => {
    return () => {
      if (longPressTimer.current !== null) {
        window.clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  // Construct an arc generator.
  const getArc = d3.arc<d3.HierarchyRectangularNode<Practice>>()
    .startAngle(d => d.x0)
    .endAngle(d => d.x1)
    .padAngle(d => Math.min((d.x1 - d.x0) / 2, 2 * padding / radius))
    .padRadius(radius / 2)
    .innerRadius(d => d.y0)
    .outerRadius(d => d.y1 - padding);

  const getTextTransform = (d: d3.HierarchyRectangularNode<Practice>) : string | undefined => {
    if (!d.depth) return;

    const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
    const y = (d.y0 + d.y1) / 2;
    const flip = ((x + globalRotation + 360) % 360) < 180;
    return `rotate(${x - 90}) translate(${y}, 0) rotate(${flip ? 0 : 180})`;
  }

  const getColor = (d: d3.HierarchyRectangularNode<Practice>) : string => {
    if (!d.depth) { // root node is not clickable; matches the Not Defined color
      return "#00151b";
    }
    return STATUSES[d.data.value ?? 0].color;
  }

  const getLabel = (d: d3.HierarchyRectangularNode<Practice>) : string => {
    const label = d.data.key ? t("practices." + d.data.key) : (d.data.name ?? "");
    // Fields with context get an asterisk appended to their title.
    return d.data.note && d.data.note.trim() !== "" ? `${label}*` : label;
  }

  const calculateRotationFor = (clickX: number, clickY: number) : number | null => {
    const rootNode = document.getElementsByClassName("board-root-node")[0];
    if (!rootNode) return null;

    const rootClientRect = rootNode.getBoundingClientRect();
    const rootCenterX = rootClientRect.left + ((rootClientRect.right - rootClientRect.left) / 2);
    const rootCenterY = rootClientRect.top + ((rootClientRect.bottom - rootClientRect.top) / 2);

    const x = clickX - rootCenterX;
    const y = clickY - rootCenterY;

    const currentAngle = Math.atan2(y, x);
    const currentRotation = (180 / Math.PI * currentAngle) + 90;

    return currentRotation;
  }

  const startDrag = (e: React.PointerEvent<SVGElement>, d: d3.HierarchyRectangularNode<Practice>) : void => {
    if (e.button !== 0) return; // right-clicks open the context overlay instead
    if (activePointerId.current !== null) return; // another pointer is already dragging

    const currentRotation = calculateRotationFor(e.clientX, e.clientY);
    if (currentRotation === null) return;

    activePointerId.current = e.pointerId;
    setDragSubject(d);
    setDragStart({x: e.clientX, y: e.clientY});
    setPreviousRotation(currentRotation);

    if (e.pointerType === "touch") {
      cancelLongPress();
      longPressTimer.current = window.setTimeout(() : void => {
        longPressTimer.current = null;
        longPressFired.current = true;
        setDragSubject(null);
        onElementRightClick(d.data.uuid);
      }, LONG_PRESS_MS);
    }
  }

  const updateDrag = (e: React.PointerEvent<SVGElement>) : void => {
    if (dragSubject && e.pointerId === activePointerId.current) {
      // Moving the finger cancels a pending long press.
      if (dragStart.x !== null && dragStart.y !== null
        && Math.hypot(e.clientX - dragStart.x, e.clientY - dragStart.y) > DRAG_THRESHOLD_PX) {
        cancelLongPress();
      }

      const currentRotation = calculateRotationFor(e.clientX, e.clientY);
      if (currentRotation === null) return;

      const diff = currentRotation - previousRotation;
      setPreviousRotation(currentRotation);
      setGlobalRotation(globalRotation + diff);
    }
  }

  const endDrag = (e: React.PointerEvent<SVGElement>, d: d3.HierarchyRectangularNode<Practice> | null) : void => {
    if (activePointerId.current !== e.pointerId) return; // not the pointer we track
    activePointerId.current = null;
    cancelLongPress();

    // The long press already opened the context overlay; don't also cycle the status.
    if (longPressFired.current) {
      longPressFired.current = false;
      setDragSubject(null);
      return;
    }

    if (d && d.depth && e.button === 0 && e.clientX === dragStart.x && e.clientY === dragStart.y) {
      onElementClick(d.data.uuid);
    }

    setDragSubject(null);
  }

  return <div className="board-wrap">
    <svg
    xmlns="http://www.w3.org/2000/svg"
    ref={svgRef}
    width={diameter}
    height={diameter}
    viewBox={`${-radius} ${-radius} ${diameter} ${diameter}`}
    id='smorgasbordImage'
    // Pointer events cover mouse and touch alike; with `touch-action: pan-y`
    // vertical swipes are taken over by the page (pointercancel) while
    // horizontal drags rotate the wheel.
    onPointerMove={(e) : void => { updateDrag(e) }}
    onPointerUp={(e) : void => { endDrag(e, null) }}
    onPointerCancel={() : void => {
      // The browser took over the gesture (e.g. scrolling): no click, no long press.
      activePointerId.current = null;
      cancelLongPress();
      setDragSubject(null);
    }}
    onPointerLeave={(e) : void => { endDrag(e, null) }}>
    <g transform={`rotate(${globalRotation})`}>
      {nodes
        .map((d) : JSX.Element => (
          <g key={d.data.uuid}
            onPointerDown={(e) : void => { startDrag(e, d) }}
            onPointerUp={(e) : void => { endDrag(e, d) }}
            onContextMenu={(e) : void => {
              e.preventDefault();
              if (d.depth) {
                onElementRightClick(d.data.uuid);
              }
            }}
            className={d.parent === null ? "board-root-node" : ""}>
            <path
              d={getArc(d) ?? undefined}
              fill={getColor(d)}
              data-status={d.depth ? (d.data.value ?? 0) : undefined}
              fillOpacity="1.0">
            </path>
            <text
              transform={getTextTransform(d)}
              fill={textColorFor(getColor(d))}
              fillOpacity="1.0"
              dy="0.32em"
              style={{fontFamily: "sans-serif", fontSize: "13px", textAnchor: "middle"}}>
              { getLabel(d) }
            </text>
          </g>
        ))}
    </g>
    </svg>
  </div>;
}

export default Smorgasbord;
