import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { z } from "zod";
import { createFixture, createSeniorPlayer, createTrialRegistration, deleteFixture, deleteSeniorPlayer, listFixtures, listSeniorPlayers } from "./db";
import { forwardTrialRegistrationToGoogleWorkspace } from "./googleWorkspace";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { storagePut } from "./storage";

export const trialRegistrationInput = z.object({
  player: z.string().trim().min(2).max(160),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  category: z.string().trim().min(2).max(40),
  parent: z.string().trim().min(2).max(160),
  phone: z.string().trim().min(7).max(40),
  email: z.string().trim().email().max(320).optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
  website: z.string().max(200).optional(),
});

const DEFAULT_SENIOR_SEASON = "2026/27";

const seniorSeasonInput = z.string().trim().min(4).max(20);
const seniorPlayerImageInput = z.string().trim().regex(/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=\s]+$/).max(7_000_000);

export const fixtureCreateInput = z.object({
  fixtureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fixtureTime: z.string().regex(/^\d{2}:\d{2}$/),
  team: z.string().trim().min(2).max(40),
  opponent: z.string().trim().min(2).max(160),
  venue: z.string().trim().min(2).max(80),
  competition: z.string().trim().min(2).max(120),
  status: z.enum(["Upcoming", "FT", "Postponed"]).default("Upcoming"),
  score: z.string().trim().max(20).optional().or(z.literal("")),
  scorers: z.array(z.string().trim().min(1).max(120)).max(12).default([]),
});

export const seniorPlayerCreateInput = z.object({
  season: seniorSeasonInput.default(DEFAULT_SENIOR_SEASON),
  playerName: z.string().trim().min(2).max(160),
  position: z.string().trim().min(2).max(60),
  displayOrder: z.number().int().min(0).max(999).default(0),
  imageData: seniorPlayerImageInput,
});

function slugifyPlayerName(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "player";
}

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  seniorPlayers: router({
    list: publicProcedure
      .input(z.object({ season: seniorSeasonInput.default(DEFAULT_SENIOR_SEASON) }))
      .query(({ input }) => listSeniorPlayers(input.season, true)),
    adminList: adminProcedure
      .input(z.object({ season: seniorSeasonInput.default(DEFAULT_SENIOR_SEASON) }))
      .query(({ input }) => listSeniorPlayers(input.season, false)),
    create: adminProcedure
      .input(seniorPlayerCreateInput)
      .mutation(async ({ input }) => {
        const match = input.imageData.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
        if (!match) {
          throw new Error("Upload a JPEG, PNG, or WebP image.");
        }

        const mimeType = match[1];
        const imageBuffer = Buffer.from(match[2], "base64");
        if (imageBuffer.byteLength > 5 * 1024 * 1024) {
          throw new Error("Player images must be 5 MB or smaller.");
        }

        const extension = mimeType === "image/jpeg" ? "jpg" : mimeType.slice("image/".length);
        const upload = await storagePut(
          `senior-players/${input.season}/${slugifyPlayerName(input.playerName)}.${extension}`,
          imageBuffer,
          mimeType,
        );

        return createSeniorPlayer({
          season: input.season,
          playerName: input.playerName,
          position: input.position,
          imageKey: upload.key,
          imageUrl: upload.url,
          displayOrder: input.displayOrder,
          isPublished: 1,
        });
      }),
    remove: adminProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(({ input }) => deleteSeniorPlayer(input.id)),
  }),

  fixtures: router({
    list: publicProcedure.query(async () => {
      const rows = await listFixtures();
      return rows.map((row) => ({
        ...row,
        scorers: row.scorers ? JSON.parse(row.scorers) : [],
      }));
    }),
    create: adminProcedure
      .input(fixtureCreateInput)
      .mutation(({ input }) => createFixture({
        fixtureDate: input.fixtureDate,
        fixtureTime: input.fixtureTime,
        team: input.team,
        opponent: input.opponent,
        venue: input.venue,
        competition: input.competition,
        status: input.status,
        score: input.score || null,
        scorers: JSON.stringify(input.scorers),
      })),
    remove: adminProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(({ input }) => deleteFixture(input.id)),
  }),

  trials: router({
    submit: publicProcedure
      .input(trialRegistrationInput)
      .mutation(async ({ input }) => {
        if (input.website) {
          return { success: true as const };
        }

        const registration = await createTrialRegistration({
          playerName: input.player,
          dateOfBirth: input.dob,
          category: input.category,
          guardianName: input.parent,
          phone: input.phone,
          email: input.email || null,
          message: input.message || null,
        });

        const emailForwarded = await forwardTrialRegistrationToGoogleWorkspace({
          player: input.player,
          dob: input.dob,
          category: input.category,
          parent: input.parent,
          phone: input.phone,
          email: input.email || undefined,
          message: input.message || undefined,
        });

        if (!emailForwarded) {
          console.warn("[Trials] Stored registration but Gmail forwarding was unavailable");
        }

        return { success: true as const, notificationSent: false, emailForwarded };
      }),
  }),
});

export type AppRouter = typeof appRouter;
