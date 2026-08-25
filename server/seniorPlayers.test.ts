import { describe, expect, it } from "vitest";
import { seniorPlayerCreateInput } from "./routers";

describe("senior player validation", () => {
  it("accepts a complete next-season player entry", () => {
    const result = seniorPlayerCreateInput.safeParse({
      season: "2026/27",
      playerName: "Brian Otieno",
      position: "Midfielder",
      displayOrder: 2,
      imageData: `data:image/jpeg;base64,${"a".repeat(64)}`,
    });

    expect(result.success).toBe(true);
  });

  it("rejects unsupported image payloads", () => {
    const result = seniorPlayerCreateInput.safeParse({
      season: "2026/27",
      playerName: "Brian Otieno",
      position: "Midfielder",
      displayOrder: 2,
      imageData: "data:image/svg+xml;base64,unsafe",
    });

    expect(result.success).toBe(false);
  });
});
