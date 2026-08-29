import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const homepagePath = fileURLToPath(new URL("../client/index.html", import.meta.url));
const homepageHtml = readFileSync(homepagePath, "utf8");

describe("homepage SEO metadata and image alternatives", () => {
  it("keeps the meta keywords list within the required 3 to 8 range", () => {
    const content = homepageHtml.match(/<meta\s+name="keywords"\s+content="([^"]+)"\s*\/>/s)?.[1];
    expect(content).toBeTruthy();

    const keywords = content!
      .split(",")
      .map(keyword => keyword.trim())
      .filter(Boolean);

    expect(keywords).toHaveLength(6);
    expect(new Set(keywords).size).toBe(keywords.length);
  });

  it("gives every rendered homepage image a non-empty alt attribute", () => {
    const images = homepageHtml.match(/<img\b[^>]*>/g) ?? [];
    const missingAlt = images.filter(image => !/\balt="[^"]+"/.test(image));

    expect(images).toHaveLength(15);
    expect(missingAlt).toEqual([]);
  });
});
