// Saves a blob as a file download using only native browser APIs (object URL +
// anchor), replacing the unmaintained file-saver package. The object URL is
// revoked on the next tick — after the browser has started the download — so
// it does not leak and cannot be reused by other code.
export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 0);
};
