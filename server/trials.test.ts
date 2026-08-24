import { describe, expect, it } from "vitest";
import { trialRegistrationInput } from "./routers";

describe("trial registration validation", () => {
  it("accepts a complete registration", () => {
    const result = trialRegistrationInput.safeParse({
      player: "Brian Otieno",
      dob: "2014-06-12",
      category: "Under-12",
      parent: "Mary Otieno",
      phone: "0724325653",
      email: "parent@example.com",
      message: "Midfielder with weekend experience",
      website: "",
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid dates and malformed email addresses", () => {
    const result = trialRegistrationInput.safeParse({
      player: "Brian Otieno",
      dob: "12/06/2014",
      category: "Under-12",
      parent: "Mary Otieno",
      phone: "0724325653",
      email: "not-an-email",
      message: "",
      website: "",
    });

    expect(result.success).toBe(false);
  });

  it("allows the honeypot field through validation for server-side discard", () => {
    const result = trialRegistrationInput.safeParse({
      player: "Brian Otieno",
      dob: "2014-06-12",
      category: "Under-12",
      parent: "Mary Otieno",
      phone: "0724325653",
      email: "",
      message: "",
      website: "spam",
    });

    expect(result.success).toBe(true);
  });
});
