import { z } from "zod";

import { MAX_REQUEST_BODY_BYTES } from "../request-executor/limits";
import { HTTP_METHODS, isSensitiveHeaderName } from "./phase2";

const headerNamePattern = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;

const executionRowSchema = z
  .object({
    key: z.string().trim().min(1).max(128),
    value: z.string().max(2_048),
    enabled: z.boolean(),
  })
  .strict();

const executionHeaderSchema = z
  .object({
    key: z
      .string()
      .trim()
      .min(1, "Header names cannot be empty.")
      .max(128, "Header names must be 128 characters or fewer.")
      .regex(headerNamePattern, "Header names must use valid HTTP token characters."),
    value: z
      .string()
      .max(8_192, "Header values must be 8,192 characters or fewer.")
      .refine((value) => !/[\r\n]/.test(value), "Header values cannot contain line breaks."),
    enabled: z.boolean(),
    sensitive: z.boolean().default(false),
  })
  .strict()
  .superRefine((header, context) => {
    if ((header.sensitive || isSensitiveHeaderName(header.key)) && header.value) {
      context.addIssue({
        code: "custom",
        path: ["value"],
        message:
          "Sensitive header values cannot be used until encrypted secret handling is available.",
      });
    }
  });

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
    method: z.enum(HTTP_METHODS),
    url: executionUrlSchema,
    queryParameters: z.array(executionRowSchema).max(50),
    headers: z.array(executionHeaderSchema).max(50),
    body: executionBodySchema,
  })
  .strict();

export type ValidatedExecutionRequest = z.output<typeof executionRequestSchema>;

