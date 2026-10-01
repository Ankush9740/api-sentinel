import { z } from "zod";

import {
  ASSERTION_OPERATORS,
  ASSERTION_OPERATORS_BY_TYPE,
  ASSERTION_TYPES,
  type AssertionOperatorValue,
  type AssertionTypeValue,
} from "../assertions/types";
import { isSensitiveHeaderName } from "../security/sensitive-headers";
import { parseJsonPathSegments } from "../assertions/json-path";

export const MAX_ASSERTIONS_PER_REQUEST = 50;

const headerNamePattern = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;

export const assertionInputSchema = z
  .object({
    type: z.enum(ASSERTION_TYPES),
    operator: z.enum(ASSERTION_OPERATORS),
    target: z
      .string()
      .trim()
      .max(256, "Assertion targets must be 256 characters or fewer.")
      .nullable()
      .optional()
      .transform((value) => value || null),
    expectedValue: z
      .string()
      .trim()
      .max(1_024, "Expected values must be 1,024 characters or fewer.")
      .nullable()
      .optional()
      .transform((value) => value || null),
    enabled: z.boolean().default(true),
  })
  .strict()
  .superRefine((assertion, context) => validateAssertion({
    ...assertion,
    target: assertion.target ?? null,
    expectedValue: assertion.expectedValue ?? null,
  }, context));

export const assertionsInputSchema = z
  .array(assertionInputSchema)
  .max(
    MAX_ASSERTIONS_PER_REQUEST,
    `A request can contain at most ${MAX_ASSERTIONS_PER_REQUEST} assertions.`,
  );

export type ValidatedAssertionInput = z.output<typeof assertionInputSchema>;

function validateAssertion(
  assertion: {
    type: AssertionTypeValue;
    operator: AssertionOperatorValue;
    target: string | null;
    expectedValue: string | null;
  },
  context: z.RefinementCtx,
) {
  if (!ASSERTION_OPERATORS_BY_TYPE[assertion.type].includes(assertion.operator)) {
    context.addIssue({
      code: "custom",
      path: ["operator"],
      message: "That operator is not valid for this assertion type.",
    });
    return;
  }

  const needsTarget = assertion.type === "HEADER" || assertion.type === "JSON_PATH";
  if (needsTarget && !assertion.target) {
    context.addIssue({
      code: "custom",
      path: ["target"],
      message: assertion.type === "HEADER" ? "Enter a response header name." : "Enter a JSON property path.",
    });
  }
  if (!needsTarget && assertion.target) {
    context.addIssue({
      code: "custom",
      path: ["target"],
      message: "This assertion type does not use a target.",
    });
  }

  if (assertion.type === "HEADER" && assertion.target) {
    if (!headerNamePattern.test(assertion.target)) {
      context.addIssue({
        code: "custom",
        path: ["target"],
        message: "Enter a valid HTTP response header name.",
      });
    }
    if (isSensitiveHeaderName(assertion.target)) {
      context.addIssue({
        code: "custom",
        path: ["target"],
        message: "Sensitive header values cannot be used in assertions.",
      });
    }
  }

  if (assertion.type === "JSON_PATH" && assertion.target) {
    const path = assertion.target.startsWith("body.")
      ? assertion.target.slice(5)
      : assertion.target;
    if (!parseJsonPathSegments(path)) {
      context.addIssue({
        code: "custom",
        path: ["target"],
        message: "Use a path such as $.data.users[0].id (up to 32 segments).",
      });
    }
  }

  const needsExpected = assertion.operator !== "EXISTS" && assertion.operator !== "DOES_NOT_EXIST";
  if (needsExpected && assertion.expectedValue === null) {
    context.addIssue({
      code: "custom",
      path: ["expectedValue"],
      message: "Enter an expected value.",
    });
    return;
  }
  if (!needsExpected && assertion.expectedValue !== null) {
    context.addIssue({
      code: "custom",
      path: ["expectedValue"],
      message: "Existence assertions do not use an expected value.",
    });
    return;
  }
  if (!needsExpected || assertion.expectedValue === null) return;

  if (assertion.type === "STATUS_CODE") {
    validateNumberOrRange(assertion.expectedValue, assertion.operator, context, {
      minimum: 100,
      maximum: 599,
      integer: true,
      label: "status code",
    });
  }
  if (assertion.type === "RESPONSE_TIME") {
    validateNumberOrRange(assertion.expectedValue, assertion.operator, context, {
      minimum: 0,
      maximum: 600_000,
      integer: false,
      label: "duration",
    });
  }
  if (assertion.type === "JSON_PATH") {
    validateJsonExpected(assertion.expectedValue, assertion.operator, context);
  }
}

function validateNumberOrRange(
  input: string,
  operator: AssertionOperatorValue,
  context: z.RefinementCtx,
  limits: { minimum: number; maximum: number; integer: boolean; label: string },
) {
  if (operator === "BETWEEN") {
    const range = parseNumericRange(input);
    if (
      !range ||
      range[0] < limits.minimum ||
      range[1] > limits.maximum ||
      (limits.integer && range.some((value) => !Number.isInteger(value)))
    ) {
      context.addIssue({
        code: "custom",
        path: ["expectedValue"],
        message: `Enter a valid ${limits.label} range such as ${limits.minimum},${limits.maximum}.`,
      });
    }
    return;
  }

  const number = Number(input);
  if (
    !Number.isFinite(number) ||
    number < limits.minimum ||
    number > limits.maximum ||
    (limits.integer && !Number.isInteger(number))
  ) {
    context.addIssue({
      code: "custom",
      path: ["expectedValue"],
      message: `Enter a valid ${limits.label}.`,
    });
  }
}

function validateJsonExpected(
  input: string,
  operator: AssertionOperatorValue,
  context: z.RefinementCtx,
) {
  let value: unknown;
  try {
    value = JSON.parse(input) as unknown;
  } catch {
    context.addIssue({
      code: "custom",
      path: ["expectedValue"],
      message: 'Use a JSON literal such as "Ankush", 42, true, or null.',
    });
    return;
  }

  if (typeof value === "object" && value !== null) {
    context.addIssue({
      code: "custom",
      path: ["expectedValue"],
      message: "Expected JSON values must be a string, number, boolean, or null.",
    });
  }
  if ((operator === "GREATER_THAN" || operator === "LESS_THAN") && typeof value !== "number") {
    context.addIssue({
      code: "custom",
      path: ["expectedValue"],
      message: "Numeric comparisons require a JSON number.",
    });
  }
  if (operator === "CONTAINS" && typeof value === "object") {
    context.addIssue({
      code: "custom",
      path: ["expectedValue"],
      message: "Contains requires a scalar JSON value.",
    });
  }
}

export function parseNumericRange(input: string): [number, number] | null {
  const parts = input.split(",").map((part) => Number(part.trim()));
  if (parts.length !== 2 || parts.some((value) => !Number.isFinite(value))) return null;
  if (parts[0] > parts[1]) return null;
  return [parts[0], parts[1]];
}
