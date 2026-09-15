import { type JSX } from "react";
import saveAs from "file-saver";
import { useTranslation } from "react-i18next";
import { ImageIcon } from "../icons";
import { diameter } from "../../constants";

// Collects the id/class selectors of an element and all of its descendants.
const collectSelectors = (parentElement: Element): string[] => {
  const selectorTextArr: string[] = [];

  if (parentElement.id) {
    selectorTextArr.push("#" + parentElement.id);
  }
  for (const className of Array.from(parentElement.classList)) {
    if (!selectorTextArr.includes("." + className)) {
      selectorTextArr.push("." + className);
    }
  }

  const nodes = parentElement.getElementsByTagName("*");
  for (let i = 0; i < nodes.length; i++) {
    const id = nodes[i].id;
    if (id && !selectorTextArr.includes("#" + id)) {
      selectorTextArr.push("#" + id);
    }

    for (const className of Array.from(nodes[i].classList)) {
      if (!selectorTextArr.includes("." + className)) {
        selectorTextArr.push("." + className);
      }
    }
  }

  return selectorTextArr;
}

// Extracts the CSS rules whose selector matches one of the collected
// selectors, from every accessible stylesheet (cross-origin sheets are
// skipped, their cssRules access throws a SecurityError).
const getCSSStyles = (parentElement: Element): string => {
  const selectorTextArr = collectSelectors(parentElement);

  let extractedCSSText = "";
  for (let i = 0; i < document.styleSheets.length; i++) {
    const s = document.styleSheets[i];

    let rules: CSSRuleList;
    try {
      rules = s.cssRules;
    } catch (e) {
      if ((e as DOMException).name !== "SecurityError") throw e; // for Firefox
      continue;
    }

    for (let r = 0; r < rules.length; r++) {
      const rule = rules[r];
      if (rule instanceof CSSStyleRule && selectorTextArr.includes(rule.selectorText)) {
        extractedCSSText += rule.cssText;
      }
    }
  }

  return extractedCSSText;
}

const appendCSS = (cssText: string, element: SVGSVGElement): void => {
  const styleElement = document.createElementNS("http://www.w3.org/2000/svg", "style");
  styleElement.textContent = cssText;
  const refNode = element.hasChildNodes() ? element.children[0] : null;
  element.insertBefore(styleElement, refNode);
}

const getSVGString = (svgNode: SVGSVGElement): string => {
  svgNode.setAttribute("xmlns:xlink", "http://www.w3.org/2000/xlink");
  const cssStyleText = getCSSStyles(svgNode);
  appendCSS(cssStyleText, svgNode);

  const serializer = new XMLSerializer();
  let svgString = serializer.serializeToString(svgNode);
  svgString = svgString.replace(/(\w+)?:?xlink=/g, "xmlns:xlink="); // Fix root xlink without namespace
  svgString = svgString.replace(/NS\d+:href/g, "xlink:href"); // Safari NS namespace fix

  return svgString;
}

const svgString2Image = (svgString: string, width: number, height: number, callback: (blob: Blob) => void): void => {
  const imgsrc = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgString))); // Convert SVG string to data URL

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  canvas.width = width;
  canvas.height = height;

  if (!context) return;

  const image = new Image();
  image.onload = () : void => {
    context.clearRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    canvas.toBlob(blob => {
      if (blob) callback(blob);
    });
  };

  image.src = imgsrc;
}

const ExportAsImageButton = () : JSX.Element => {
  const { t } = useTranslation();

  const exportAsImage = () : void => {
    const original = document.getElementById("smorgasbordImage");
    if (!original) return;

    // deep clone the image and process to hide not-defined elements
    const nodes = original.cloneNode(true) as SVGSVGElement;

    nodes.querySelectorAll("path[data-status='0']").forEach(path => {
      path.setAttribute("fill-opacity", "0");
      const label = path.parentNode?.querySelector("text");
      if (label) {
        label.setAttribute("fill-opacity", "0");
      }
    });

    const svgString = getSVGString(nodes);

    svgString2Image(svgString, 2 * diameter, 2 * diameter, blob => saveAs(blob, "smorkinkboard.png"));
  }

  return (
    <button className="outline is-action" onClick={exportAsImage}>
      <ImageIcon />
      <span>{t("button.download_image")}</span>
    </button>
  );
}

export default ExportAsImageButton;
