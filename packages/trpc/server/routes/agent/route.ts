import { z } from "zod";
import { protectedProcedure, router } from "../../trpc";
import { inngest } from "@repo/services/inngest/index";
import { handleRouteError } from "../../utils/error";
import { clearChatMemory } from "@repo/services/redis/chatMemory";

export const agentRouter = router({
  /**
   * Triggers a marine agent run in the background via Inngest.
   * Returns a `runId` that the client uses to subscribe to Socket.IO events.
   */
  run: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1, "Query must not be empty").max(1000),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const runId = crypto.randomUUID();

        await inngest.send({
          name: "agent/run.requested",
          data: {
            runId,
            query: input.query,
            userId: ctx.user.id,
          },
        });

        return { runId };
      } catch (error) {
        handleRouteError(error);
        throw error; // ensure TypeScript knows this path never returns normally
      }
    }),

  /**
   * Clears the short-term Redis memory for the authenticated user.
   * Called when the user starts a new chat session.
   */
  clearMemory: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      await clearChatMemory(ctx.user.id);
      return { cleared: true };
    } catch (error) {
      handleRouteError(error);
      throw error;
    }
  }),
});
