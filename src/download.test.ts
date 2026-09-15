import { afterEach, describe, expect, it, vi } from "vitest";
import { downloadBlob } from "./download";

describe("downloadBlob", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("downloads the blob through a temporary anchor and revokes the object URL", async () => {
    const createObjectURL = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test-url");
    const revokeObjectURL = vi.spyOn(URL, "revokeObjectURL");
    const clicked: { href: string | null, download: string | null } = { href: null, download: null };
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      clicked.href = this.getAttribute("href");
      clicked.download = this.getAttribute("download");
    });

    const blob = new Blob(["# Smorkinkboard"], { type: "text/markdown" });
    downloadBlob(blob, "smorkinkboard.md");

    expect(createObjectURL).toHaveBeenCalledWith(blob);
    expect(clicked.href).toBe("blob:test-url");
    expect(clicked.download).toBe("smorkinkboard.md");
    // The temporary anchor is removed from the document again.
    expect(document.querySelectorAll("a[download='smorkinkboard.md']")).toHaveLength(0);

    // The URL is revoked on the next tick, after the download has started.
    expect(revokeObjectURL).not.toHaveBeenCalled();
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:test-url");
  });
});
