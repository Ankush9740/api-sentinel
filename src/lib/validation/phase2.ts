import { z } from "zod";

import { isSensitiveHeaderName } from "../security/sensitive-headers";
import { assertionsInputSchema } from "./assertions";

export { isSensitiveHeaderName } from "../security/sensitive-headers";

export const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

const identifierSchema = z.string().trim().min(1).max(191);

const optionalDescriptionSchema = z
  .string()
  .trim()
  .max(500, "Description must be 500 characters or fewer.")
  .transform((value) => value || null)
  .optional()
  .transform((value) => value ?? null);

export const collectionInputSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Collection name is required.")
      .max(80, "Collection name must be 80 characters or fewer."),
    description: optionalDescriptionSchema,
  })
  .strict();

export const collectionMutationSchema = collectionInputSchema.extend({
  id: identifierSchema,
});

export const collectionIdSchema = z
  .object({ id: identifierSchema })
  .strict();

const requestRowBaseSchema = z.object({
  key: z.string().trim(),
  value: z.string(),
  enabled: z.boolean(),
});

export const queryParameterInputSchema = requestRowBaseSchema
  .extend({
    key: z
      .string()
      .trim()
      .min(1, "Query parameter keys cannot be empty.")
      .max(128, "Query parameter keys must be 128 characters or fewer."),
    value: z
      .string()
      .max(2_048, "Query parameter values must be 2,048 characters or fewer."),
  })
  .strict();

const headerNamePattern = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;
export const requestHeaderInputSchema = requestRowBaseSchema
  .extend({
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
    sensitive: z.boolean().default(false),
  })
  .strict()
  .superRefine((header, context) => {
    if ((header.sensitive || isSensitiveHeaderName(header.key)) && header.value) {
      context.addIssue({
        code: "custom",
        path: ["value"],
        message:
          "Sensitive header values cannot be saved until encrypted storage is available.",
      });
    }
  });

const httpUrlSchema = z
  .string()
  .trim()
  .min(1, "Request URL is required.")
  .max(4_096, "Request URL must be 4,096 characters or fewer.")
  .superRefine((value, context) => {
    try {
      const url = new URL(value);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        context.addIssue({
          code: "custom",
          message: "Request URL must use HTTP or HTTPS.",
        });
      }
    } catch {
      context.addIssue({ code: "custom", message: "Enter a valid absolute request URL." });
    }
  });

const jsonBodySchema = z
  .string()
  .max(1_048_576, "JSON body must be 1 MB or smaller.")
  .transform((value) => value.trim() || null)
  .superRefine((value, context) => {
    if (!value) return;
    try {
      JSON.parse(value);
    } catch {
      context.addIssue({ code: "custom", message: "Request body must contain valid JSON." });
    }
  });

export const endpointInputSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Endpoint name is required.")
      .max(100, "Endpoint name must be 100 characters or fewer."),
    collectionId: identifierSchema,
    method: z.enum(HTTP_METHODS),
    url: httpUrlSchema,
    body: jsonBodySchema,
    queryParameters: z
      .array(queryParameterInputSchema)
      .max(50, "An endpoint can contain at most 50 query parameters."),
    headers: z
      .array(requestHeaderInputSchema)
      .max(50, "An endpoint can contain at most 50 headers."),
    assertions: assertionsInputSchema.default([]),
  })
  .strict();

export const endpointMutationSchema = endpointInputSchema.extend({
  id: identifierSchema,
});

export const endpointIdSchema = z
  .object({ id: identifierSchema })
  .strict();

export type CollectionInput = z.input<typeof collectionInputSchema>;
export type EndpointInput = z.input<typeof endpointInputSchema>;
export type ValidatedEndpointInput = z.output<typeof endpointInputSchema>;
