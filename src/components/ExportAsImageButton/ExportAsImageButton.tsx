import { type JSX } from "react";
import saveAs from "file-saver";
import { useTranslation } from "react-i18next";
import { ImageIcon } from "../icons";

const ExportAsImageButton = () : JSX.Element => {
  const { t } = useTranslation();

  const exportAsImage = () : void => {
    // deep clone the image and process to hide not-defined elements
    const nodes = document.getElementById("smorgasbordImage").cloneNode(true) as any;

    // Drop the mobile zoom transform so the export always shows the full board.
    nodes.querySelectorAll(".board-zoom-layer").forEach(function(layer) {
      layer.removeAttribute("style");
    });

    nodes.querySelectorAll("path[data-status='0']").forEach(function(path) {
      path.setAttribute("fill-opacity", "0");
      (path as Node).parentNode.querySelector("text").setAttribute("fill-opacity", "0");
    });

    const svgString = getSVGString(nodes);

    svgString2Image(svgString, 2 * 1152, 2 * 1152, save);
  }
  
  const save = (dataBlob) : void => {
    saveAs(dataBlob, "smorkinkboard.png");
  }

  const getCSSStyles = (parentElement) : string => {
    const selectorTextArr = [];

    // Add Parent element Id and Classes to the list
    selectorTextArr.push("#" + parentElement.id);
    for (let c = 0; c < parentElement.classList.length; c++)
      if (!contains("." + parentElement.classList[c], selectorTextArr))
        selectorTextArr.push("." + parentElement.classList[c]);

    // Add Children element Ids and Classes to the list
    const nodes = parentElement.getElementsByTagName("*");
    for (let i = 0; i < nodes.length; i++) {
      const id = nodes[i].id;
      if (!contains("#" + id, selectorTextArr))
        selectorTextArr.push("#" + id);

      const classes = nodes[i].classList;
      for (let c = 0; c < classes.length; c++)
        if (!contains("." + classes[c], selectorTextArr))
          selectorTextArr.push("." + classes[c]);
    }

    // Extract CSS Rules
    let extractedCSSText = "";
    for (let i = 0; i < document.styleSheets.length; i++) {
      const s = document.styleSheets[i];

      try {
        if (!s.cssRules) continue;
      } catch (e) {
        if (e.name !== "SecurityError") throw e; // for Firefox
        continue;
      }

      const cssRules = s.cssRules as any;
      for (let r = 0; r < cssRules.length; r++) {
        if (contains(cssRules[r].selectorText, selectorTextArr))
          extractedCSSText += cssRules[r].cssText;
      }
    }

    return extractedCSSText;

  }
  
  const contains = (str, arr) : boolean => {
    return arr.indexOf(str) === -1 ? false : true;
  }

  const getSVGString = (svgNode) : string => {
    svgNode.setAttribute("xlink", "http://www.w3.org/2000/xlink");
    const cssStyleText = getCSSStyles(svgNode);
    appendCSS(cssStyleText, svgNode);

    const serializer = new XMLSerializer();
    let svgString = serializer.serializeToString(svgNode);
    svgString = svgString.replace(/(\w+)?:?xlink=/g, "xmlns:xlink="); // Fix root xlink without namespace
    svgString = svgString.replace(/NS\d+:href/g, "xlink:href"); // Safari NS namespace fix

    return svgString;
  }

  const appendCSS = (cssText, element) : void => {
    const styleElement = document.createElement("style");
    styleElement.setAttribute("type", "text/css");
    styleElement.innerHTML = cssText;
    const refNode = element.hasChildNodes() ? element.children[0] : null;
    element.insertBefore(styleElement, refNode);
  }

  const svgString2Image = (svgString, width, height, callback) : void => {
    const imgsrc = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgString))); // Convert SVG string to data URL

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    canvas.width = width;
    canvas.height = height;

    const image = new Image();
    image.onload = () : void => {
      context.clearRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);

      canvas.toBlob((blob: any) => {
        const filesize = Math.round(blob.length / 1024) + " KB";
        if (callback) callback(blob, filesize);
      });
    };

    image.src = imgsrc;
  }

  return (
    <button className="button is-action" onClick={exportAsImage}>
      <ImageIcon />
      <span>{t("button.download_image")}</span>
    </button>
  );
}

export default ExportAsImageButton;
