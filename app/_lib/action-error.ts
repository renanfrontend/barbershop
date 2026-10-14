import { z } from "zod";

/** Only deliberately authored validation messages may reach the browser. */
export class ActionError extends Error {}

export function actionErrorMessage(error: unknown, fallback: string) {
  if (error instanceof z.ZodError) return error.issues[0]?.message ?? fallback;
  return error instanceof ActionError ? error.message : fallback;
}
