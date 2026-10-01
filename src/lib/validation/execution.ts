import { z } from "zod";

import { MAX_REQUEST_BODY_BYTES } from "../request-executor/limits";
import { assertionsInputSchema } from "./assertions";
import { HTTP_METHODS, requestHeaderInputSchema } from "./phase2";

const executionRowSchema = z
  .object({
    key: z.string().trim().min(1).max(128),
    value: z.string().max(2_048),
    enabled: z.boolean(),
  })
  .strict();

const executionUrlSchema = z
  .string()
  .trim()
  .min(1, "Request URL is required.")
  .max(4_096, "Request URL must be 4,096 characters or fewer.")
  .superRefine((value, context) => {
    try {
      const url = new URL(value);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        context.addIssue({ code: "custom", message: "Request URL must use HTTP or HTTPS." });
      }
      if (url.username || url.password) {
        context.addIssue({
          code: "custom",
          message: "Credentials are not allowed in request URLs.",
        });
      }
    } catch {
      context.addIssue({ code: "custom", message: "Enter a valid absolute request URL." });
    }
  });

const executionBodySchema = z.preprocess(
  (value) => value ?? "",
  z
    .string()
    .refine(
      (value) => Buffer.byteLength(value, "utf8") <= MAX_REQUEST_BODY_BYTES,
      "JSON body must be 1 MB or smaller.",
    )
    .transform((value) => value.trim() || null)
    .superRefine((value, context) => {
      if (!value) return;
      try {
        JSON.parse(value);
      } catch {
        context.addIssue({ code: "custom", message: "Request body must contain valid JSON." });
      }
    }),
);

export const executionRequestSchema = z
  .object({
    endpointId: z.string().trim().min(1).max(191).nullable().optional().default(null),
    method: z.enum(HTTP_METHODS),
    url: executionUrlSchema,
    queryParameters: z.array(executionRowSchema).max(50),
    headers: z.array(requestHeaderInputSchema).max(50),
    body: executionBodySchema,
    assertions: assertionsInputSchema.default([]),
  })
  .strict();

export type ValidatedExecutionRequest = z.output<typeof executionRequestSchema>;

