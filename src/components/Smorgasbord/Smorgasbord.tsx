import React, { useState, type JSX } from "react";
import { useTranslation } from "react-i18next";

import * as d3 from "d3";
import "./Smorgasbord.css";
import type { Practice } from "../../interfaces";
import { hierarchicalNodesAtom } from "../../states/hierarchicalNodes.atom";
import { useAtomValue } from "jotai";
import { padding, diameter, radius, STATUSES } from "../../constants";
import { FitIcon } from "../icons";

interface SmorgasbordProps {
  onElementClick: (uuid: string) => void;
  onElementRightClick: (uuid: string) => void;
}

// Touch devices have no right-click: holding the finger still opens the context overlay.
const LONG_PRESS_MS = 500;
// A pending long press is cancelled as soon as the finger moves this far (rotation starts).
const DRAG_THRESHOLD_PX = 10;

// Mobile detail view: double-tapping a slice zooms the wheel in around it so
// labels and tap targets become phone-sized. Double-tap background / fit button
// goes back to the overview.
const MOBILE_ZOOM = 2.5;
const DOUBLE_TAP_MS = 300;
const DOUBLE_TAP_MAX_DIST_PX = 40;
const MOBILE_MEDIA_QUERY = "(max-width: 767.98px)";

// True on small screens (same breakpoint as the CSS layout).
const useIsMobile = () : boolean => {
  const [ isMobile, setIsMobile ] = React.useState<boolean>(() =>
    typeof window.matchMedia === "function" ? window.matchMedia(MOBILE_MEDIA_QUERY).matches : false);

  React.useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const mql = window.matchMedia(MOBILE_MEDIA_QUERY);
    const onChange = (e: MediaQueryListEvent) : void => { setIsMobile(e.matches); };
    mql.addEventListener("change", onChange);
    return () => { mql.removeEventListener("change", onChange); };
  }, []);

  return isMobile;
};

interface ZoomState {
  z: number;      // scale factor
  tx: number;     // screen-space translation (SVG user units)
  ty: number;
  offset: number; // extra rotation (deg) applied on top of the global rotation
}

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
  
  const [ dragSubject, setDragSubject ] = useState<d3.HierarchyRectangularNode<Practice>>(null);
  const [ globalRotation, setGlobalRotation ] = useState(0.0);
  const [ previousRotation, setPreviousRotation ] = useState(0.0);
  const [ dragStart, setDragStart ] = useState({x: null, y: null});
  const [ zoom, setZoom ] = useState<ZoomState | null>(null);

  const isMobile = useIsMobile();

  const longPressTimer = React.useRef<number | null>(null);
  const longPressFired = React.useRef(false);
  const lastTap = React.useRef<{ time: number; x: number; y: number } | null>(null);
  const backgroundLastTap = React.useRef<{ time: number; x: number; y: number } | null>(null);
  const pendingTapTimer = React.useRef<number | null>(null);

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
      if (pendingTapTimer.current !== null) {
        window.clearTimeout(pendingTapTimer.current);
      }
    };
  }, []);

  // Zoom in centered on a slice: the slice's midpoint (mid angle, mid radius)
  // is mapped to the screen center, rotated to the 12 o'clock position.
  const zoomToNode = (d: d3.HierarchyRectangularNode<Practice>) : void => {
    if (!isMobile || !d.depth) return;

    const midAngleRad = (d.x0 + d.x1) / 2;
    const midRadius = (d.y0 + d.y1) / 2;
    const offset = -midAngleRad * 180 / Math.PI;

    // World-space midpoint, then rotated by the total rotation at entry.
    const theta = (globalRotation + offset) * Math.PI / 180;
    const wx = midRadius * Math.sin(midAngleRad);
    const wy = -midRadius * Math.cos(midAngleRad);
    const rx = wx * Math.cos(theta) - wy * Math.sin(theta);
    const ry = wx * Math.sin(theta) + wy * Math.cos(theta);

    setZoom({ z: MOBILE_ZOOM, tx: -MOBILE_ZOOM * rx, ty: -MOBILE_ZOOM * ry, offset });
  };

  const zoomOut = () : void => {
    if (!zoom) return;
    // Fold the zoom rotation into the global rotation so the wheel keeps its
    // orientation while the scale animates back to the overview.
    setGlobalRotation(g => g + zoom.offset);
    setZoom(null);
  };

  // One tap cycles the status, but on mobile we wait for the double-tap window
  // so a double tap can zoom instead. (Desktop taps stay instant.)
  // Event.timeStamp uses the same clock as performance.now().
  const handleTap = (d: d3.HierarchyRectangularNode<Practice>, e: React.PointerEvent) : void => {
    if (!isMobile) {
      onElementClick(d.data.uuid);
      return;
    }

    const now = e.timeStamp;
    const prev = lastTap.current;
    lastTap.current = { time: now, x: e.clientX, y: e.clientY };
    const isDoubleTap = !!prev
      && now - prev.time <= DOUBLE_TAP_MS
      && Math.hypot(e.clientX - prev.x, e.clientY - prev.y) <= DOUBLE_TAP_MAX_DIST_PX;

    if (isDoubleTap) {
      if (pendingTapTimer.current !== null) {
        window.clearTimeout(pendingTapTimer.current);
        pendingTapTimer.current = null;
      }
      lastTap.current = null;
      zoomToNode(d);
    } else {
      pendingTapTimer.current = window.setTimeout(() : void => {
        pendingTapTimer.current = null;
        onElementClick(d.data.uuid);
      }, DOUBLE_TAP_MS);
    }
  };

  // Double-tapping empty board space (or the root) zooms back out.
  const handleBackgroundTap = (e: React.PointerEvent<SVGSVGElement>) : void => {
    if (!isMobile || e.target !== e.currentTarget) return;

    const now = e.timeStamp;
    const prev = backgroundLastTap.current;
    backgroundLastTap.current = { time: now, x: e.clientX, y: e.clientY };
    if (prev && now - prev.time <= DOUBLE_TAP_MS
      && Math.hypot(e.clientX - prev.x, e.clientY - prev.y) <= DOUBLE_TAP_MAX_DIST_PX) {
      backgroundLastTap.current = null;
      zoomOut();
    }
  };
  
  // Construct an arc generator.
  const getArc = d3.arc<d3.HierarchyRectangularNode<Practice>>()
    .startAngle(d => d.x0)
    .endAngle(d => d.x1)
    .padAngle(d => Math.min((d.x1 - d.x0) / 2, 2 * padding / radius))
    .padRadius(radius / 2)
    .innerRadius(d => d.y0)
    .outerRadius(d => d.y1 - padding);

  // The zoom only applies on mobile; on larger screens the board always
  // shows the full overview. (The zoom state is kept, so rotating back to a
  // phone restores the previous detail view.)
  const activeZoom = isMobile ? zoom : null;

  // Total on-screen rotation: user drag plus the zoom's centering rotation.
  const totalRotation = globalRotation + (activeZoom?.offset ?? 0);

  const getTextTransform = (d: d3.HierarchyRectangularNode<Practice>) : string => {
    if (!d.depth) return;

    const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
    const y = (d.y0 + d.y1) / 2;
    const flip = ((x + totalRotation + 360) % 360) < 180;
    return `rotate(${x - 90}) translate(${y}, 0) rotate(${flip ? 0 : 180})`;
  }

  const getColor = (d: d3.HierarchyRectangularNode<Practice>) : string => {
    if (!d.depth) { // root node is not clickable & blends into the page background
      return "#17131c";
    }
    return STATUSES[d.data.value ?? 0].color;
  }

  const getLabel = (d: d3.HierarchyRectangularNode<Practice>) : string => {
    const label = d.data.key ? t("practices." + d.data.key) : d.data.name;
    // Fields with context get an asterisk appended to their title.
    return d.data.note && d.data.note.trim() !== "" ? `${label}*` : label;
  }

  const calculateRotationFor = (clickX, clickY) : number => {
    const rootClientRect = document.getElementsByClassName("board-root-node")[0].getBoundingClientRect();
    const rootCenterX = rootClientRect.left + ((rootClientRect.right - rootClientRect.left) / 2);
    const rootCenterY = rootClientRect.top + ((rootClientRect.bottom - rootClientRect.top) / 2);

    const x = clickX - rootCenterX;
    const y = clickY - rootCenterY;

    const currentAngle = Math.atan2(y, x);
    const currentRotation = (180 / Math.PI * currentAngle) + 90;

    return currentRotation;
  }

  const startDrag = (e, d: d3.HierarchyRectangularNode<Practice>) : void => {
    if (e.button !== 0) return; // right-clicks open the context overlay instead

    const currentRotation = calculateRotationFor(e.clientX, e.clientY);

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

  const updateDrag = (e) : void => {
    if (dragSubject) {
      // Moving the finger cancels a pending long press.
      if (Math.hypot(e.clientX - dragStart.x, e.clientY - dragStart.y) > DRAG_THRESHOLD_PX) {
        cancelLongPress();
      }

      const currentRotation = calculateRotationFor(e.clientX, e.clientY);
      const diff = currentRotation - previousRotation;
      setPreviousRotation(currentRotation);
      setGlobalRotation(globalRotation + diff);
    }
  }

  const endDrag = (e, d: d3.HierarchyRectangularNode<Practice>) : void => {
    cancelLongPress();

    // The long press already opened the context overlay; don't also cycle the status.
    if (longPressFired.current) {
      longPressFired.current = false;
      setDragSubject(null);
      return;
    }

    if (d && d.depth && e.button === 0 && e.clientX === dragStart.x && e.clientY === dragStart.y) {
      handleTap(d, e);
    }

    setDragSubject(null);
  }

  // The zoom layer is animated via CSS so zoom in/out eases; the rotation
  // lives on a separate inner group (attribute transform) and updates
  // frame-by-frame while dragging.
  const zoomStyle = activeZoom ? {
    transform: `translate(${activeZoom.tx}px, ${activeZoom.ty}px) scale(${activeZoom.z}) rotate(${activeZoom.offset}deg)`,
    transition: "transform 200ms ease-out",
  } : undefined;

  return <div className="board-wrap">
    <svg
    xmlns="http://www.w3.org/2000/svg"
    ref={svgRef}
    width={diameter}
    height={diameter}
    viewBox="-576 -576 1152 1152"
    id='smorgasbordImage'
    // only listen to mouse move event; touch screen moves get confused between scrolling and rotating
    // TODO should implement a different gesture for mobile
    onMouseMove={(e) : void => { updateDrag(e) }} 
    onPointerUp={(e) : void => { endDrag(e, null); handleBackgroundTap(e) }}
    onPointerCancel={() : void => {
      // The browser took over the gesture (e.g. scrolling): no click, no long press.
      cancelLongPress();
      setDragSubject(null);
    }}
    onPointerLeave={(e) : void => { endDrag(e, null) }}>
    <g className="board-zoom-layer" style={zoomStyle}>
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
                d={getArc(d)}
                fill={getColor(d)}
                data-status={d.depth ? (d.data.value ?? 0) : undefined}
                fillOpacity="1.0">
              </path>
              <text
                transform={getTextTransform(d)}
                fill={textColorFor(getColor(d))}
                fillOpacity="1.0"
                dy="0.32em"
                style={{fontFamily: "sans-serif", fontSize: isMobile ? "17px" : "13px", textAnchor: "middle"}}>
                { getLabel(d) }
              </text>
            </g>
          ))}
      </g>
    </g>
    </svg>
    {activeZoom && (
      <button
        type="button"
        className="board-fit-button"
        aria-label={t("button.fit")}
        onClick={() : void => { zoomOut(); }}>
        <FitIcon size={20} />
      </button>
    )}
  </div>;
}

export default Smorgasbord;
