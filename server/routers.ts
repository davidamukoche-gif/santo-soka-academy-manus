import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { z } from "zod";
import { createTrialRegistration } from "./db";
import { notifyOwner } from "./_core/notification";
import { publicProcedure, router } from "./_core/trpc";

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

        const notificationSent = await notifyOwner({
          title: "New Santo Soka Academy trial registration",
          content: [
            `Player: ${input.player}`,
            `Date of birth: ${input.dob}`,
            `Preferred age group: ${input.category}`,
            `Parent/guardian: ${input.parent}`,
            `Phone: ${input.phone}`,
            `Email: ${input.email || "Not provided"}`,
            `Message: ${input.message || "Not provided"}`,
            `Registration ID: ${registration.id}`,
            "Intended forwarding destination: mail@santossokaacademykenya.com",
          ].join("\n"),
        });

        return { success: true as const, notificationSent };
      }),
  }),
});

export type AppRouter = typeof appRouter;
