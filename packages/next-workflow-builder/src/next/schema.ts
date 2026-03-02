import { z } from "zod";

export const NextWorkflowBuilderConfigSchema = z.strictObject({
  /** Enable debug logging. */
  debug: z.boolean().optional(),
  /** Set Better Auth options (must be JSON-serializable). */
  authOptions: z.record(z.string(), z.unknown()).optional(),
});
