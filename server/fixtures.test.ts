import { describe, expect, it } from "vitest";
import { appRouter, fixtureCreateInput } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createUserContext(role: AuthenticatedUser["role"]): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "fixture-test-user",
    email: "fixture@example.com",
    name: "Fixture Test User",
    loginMethod: "test",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("fixtures", () => {
  it("accepts an upcoming fixture with optional matchday details", () => {
    const result = fixtureCreateInput.safeParse({
      fixtureDate: "2026-09-20",
      fixtureTime: "15:00",
      team: "Senior",
      opponent: "Boom FC",
      venue: "NCC Ground",
      competition: "FKF County League",
      status: "Upcoming",
      scorers: [],
    });

    expect(result.success).toBe(true);
  });

  it("rejects malformed dates and unsupported statuses", () => {
    const result = fixtureCreateInput.safeParse({
      fixtureDate: "20/09/2026",
      fixtureTime: "3pm",
      team: "Senior",
      opponent: "Boom FC",
      venue: "NCC Ground",
      competition: "FKF County League",
      status: "Live",
    });

    expect(result.success).toBe(false);
  });

  it("blocks regular users from creating fixtures", async () => {
    const caller = appRouter.createCaller(createUserContext("user"));

    await expect(caller.fixtures.create({
      fixtureDate: "2026-09-20",
      fixtureTime: "15:00",
      team: "Senior",
      opponent: "Boom FC",
      venue: "NCC Ground",
      competition: "FKF County League",
      status: "Upcoming",
      scorers: [],
    })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
