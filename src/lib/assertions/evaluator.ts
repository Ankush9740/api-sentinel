import type { ExecutionSuccess } from "../request-executor/types";
import { isSensitiveHeaderName } from "../security/sensitive-headers";
import { parseNumericRange } from "../validation/assertions";
import type {
  AssertionDefinition,
  AssertionEvaluationResult,
  AssertionOperatorValue,
  AssertionRunSummary,
} from "./types";
import { parseJsonPathSegments } from "./json-path";

type NormalizedResponse = ExecutionSuccess["response"];

interface JsonState {
  available: boolean;
  value: unknown;
  reason: string | null;
}

export function evaluateAssertions(
  response: NormalizedResponse,
  definitions: AssertionDefinition[],
): AssertionRunSummary {
  const enabled = definitions
    .map((definition, index) => ({ definition, index }))
    .filter(({ definition }) => definition.enabled);
  const jsonState = enabled.some(({ definition }) => definition.type === "JSON_PATH")
    ? parseResponseJson(response)
    : null;
  const results = enabled.map(({ definition, index }) =>
    evaluateAssertion(response, definition, index, jsonState),
  );
  const passed = results.filter((result) => result.passed).length;

  return {
    total: results.length,
    passed,
    failed: results.length - passed,
    results,
  };
}

function evaluateAssertion(
  response: NormalizedResponse,
  assertion: AssertionDefinition,
  index: number,
  jsonState: JsonState | null,
): AssertionEvaluationResult {
  if (assertion.type === "STATUS_CODE") {
    return evaluateNumber(
      assertion,
      index,
      response.status,
      "status code",
      String(response.status),
    );
  }
  if (assertion.type === "RESPONSE_TIME") {
    return evaluateNumber(
      assertion,
      index,
      response.durationMs,
      "response time",
      `${response.durationMs} ms`,
      " ms",
    );
  }
  if (assertion.type === "HEADER") {
    return evaluateHeader(response, assertion, index);
  }
  return evaluateJson(assertion, index, jsonState ?? parseResponseJson(response));
}

function evaluateNumber(
  assertion: AssertionDefinition,
  index: number,
  actualNumber: number,
  subject: string,
  actualLabel: string,
  unit = "",
) {
  const expected = assertion.expectedValue ?? "";
  let passed = false;
  let expectedLabel = expected;

  if (assertion.operator === "BETWEEN") {
    const range = parseNumericRange(expected);
    passed = Boolean(range && actualNumber >= range[0] && actualNumber <= range[1]);
    expectedLabel = range ? `${range[0]}–${range[1]}` : expected;
  } else {
    const expectedNumber = Number(expected);
    if (assertion.operator === "EQUALS") passed = actualNumber === expectedNumber;
    if (assertion.operator === "NOT_EQUALS") passed = actualNumber !== expectedNumber;
    if (assertion.operator === "LESS_THAN") passed = actualNumber < expectedNumber;
    if (assertion.operator === "GREATER_THAN") passed = actualNumber > expectedNumber;
  }

  const displayExpected = `${expectedLabel}${unit}`;
  const label = `${titleCase(subject)} ${operatorLabel(assertion.operator)} ${displayExpected}`;
  return result(assertion, index, passed, label, displayExpected, actualLabel,
    passed ? "Assertion passed." : `Expected ${subject} ${operatorSymbol(assertion.operator)} ${displayExpected}; received ${actualLabel}.`);
}

function evaluateHeader(
  response: NormalizedResponse,
  assertion: AssertionDefinition,
  index: number,
) {
  const target = assertion.target ?? "";
  const label = `Header ${target} ${operatorLabel(assertion.operator)}${assertion.expectedValue ? ` ${assertion.expectedValue}` : ""}`;
  if (isSensitiveHeaderName(target)) {
    return result(assertion, index, false, label, assertion.expectedValue, null,
      "Sensitive header values are not available to assertions.");
  }

  const values = response.headers
    .filter((header) => header.key.toLowerCase() === target.toLowerCase())
    .map((header) => header.value);
  const exists = values.length > 0;
  let passed = false;
  if (assertion.operator === "EXISTS") passed = exists;
  if (assertion.operator === "DOES_NOT_EXIST") passed = !exists;
  if (assertion.operator === "EQUALS") passed = values.some((value) => value === assertion.expectedValue);
  if (assertion.operator === "NOT_EQUALS") passed = exists && values.every((value) => value !== assertion.expectedValue);
  if (assertion.operator === "CONTAINS") passed = values.some((value) => value.includes(assertion.expectedValue ?? ""));

  const actual = exists ? truncate(values.join(", ")) : "Not present";
  const message = passed
    ? "Assertion passed."
    : exists
      ? `Header ${target} did not satisfy the expected comparison.`
      : `Response header ${target} was not present.`;
  return result(assertion, index, passed, label, assertion.expectedValue, actual, message);
}

function evaluateJson(
  assertion: AssertionDefinition,
  index: number,
  jsonState: JsonState,
) {
  const target = assertion.target ?? "";
  const label = `${target} ${operatorLabel(assertion.operator)}${assertion.expectedValue ? ` ${assertion.expectedValue}` : ""}`;
  if (!jsonState.available) {
    return result(assertion, index, false, label, assertion.expectedValue, null,
      jsonState.reason ?? "The response body was not valid JSON.");
  }

  const resolved = resolveJsonPath(jsonState.value, target);
  if (assertion.operator === "EXISTS") {
    return result(assertion, index, resolved.found, label, null,
      resolved.found ? safeValue(resolved.value) : "Not found",
      resolved.found ? "Assertion passed." : `JSON path ${target} was not found.`);
  }
  if (assertion.operator === "DOES_NOT_EXIST") {
    return result(assertion, index, !resolved.found, label, null,
      resolved.found ? safeValue(resolved.value) : "Not found",
      !resolved.found ? "Assertion passed." : `JSON path ${target} exists.`);
  }
  if (!resolved.found) {
    return result(assertion, index, false, label, assertion.expectedValue, "Not found",
      `JSON path ${target} was not found.`);
  }

  const expected = parseJsonLiteral(assertion.expectedValue ?? "");
  let passed = false;
  if (assertion.operator === "EQUALS") passed = Object.is(resolved.value, expected);
  if (assertion.operator === "NOT_EQUALS") passed = !Object.is(resolved.value, expected);
  if (assertion.operator === "GREATER_THAN") {
    passed = typeof resolved.value === "number" && typeof expected === "number" && resolved.value > expected;
  }
  if (assertion.operator === "LESS_THAN") {
    passed = typeof resolved.value === "number" && typeof expected === "number" && resolved.value < expected;
  }
  if (assertion.operator === "CONTAINS") {
    passed = typeof resolved.value === "string" && typeof expected === "string"
      ? resolved.value.includes(expected)
      : Array.isArray(resolved.value) && resolved.value.some((value) => Object.is(value, expected));
  }

  const actual = safeValue(resolved.value);
  return result(assertion, index, passed, label, assertion.expectedValue, actual,
    passed ? "Assertion passed." : `Expected ${target} ${operatorSymbol(assertion.operator)} ${assertion.expectedValue}; received ${actual}.`);
}

function parseResponseJson(response: NormalizedResponse): JsonState {
  if (response.bodyKind !== "json") {
    return {
      available: false,
      value: null,
      reason: `JSON assertions cannot run against a ${response.bodyKind} response body.`,
    };
  }
  try {
    return { available: true, value: JSON.parse(response.body) as unknown, reason: null };
  } catch {
    return {
      available: false,
      value: null,
      reason: "The response was identified as JSON but could not be parsed.",
    };
  }
}

export function resolveJsonPath(root: unknown, inputPath: string) {
  const directSegments = parseJsonPathSegments(inputPath);
  const direct = directSegments
    ? traverse(root, directSegments)
    : { found: false, value: undefined };
  if (direct.found || !inputPath.startsWith("body.")) return direct;
  const bodySegments = parseJsonPathSegments(inputPath.slice(5));
  return bodySegments
    ? traverse(root, bodySegments)
    : { found: false, value: undefined };
}

function traverse(root: unknown, segments: string[]) {
  let value = root;
  for (const segment of segments) {
    if ((typeof value !== "object" && !Array.isArray(value)) || value === null) {
      return { found: false, value: undefined };
    }
    if (!Object.prototype.hasOwnProperty.call(value, segment)) {
      return { found: false, value: undefined };
    }
    value = (value as Record<string, unknown>)[segment];
  }
  return { found: true, value };
}

function parseJsonLiteral(value: string) {
  return JSON.parse(value) as unknown;
}

function result(
  assertion: AssertionDefinition,
  index: number,
  passed: boolean,
  label: string,
  expected: string | null,
  actual: string | null,
  message: string,
): AssertionEvaluationResult {
  return {
    index,
    assertionId: assertion.id ?? null,
    type: assertion.type,
    operator: assertion.operator,
    target: assertion.target,
    expected,
    actual,
    passed,
    label,
    message,
  };
}

function operatorLabel(operator: AssertionOperatorValue) {
  return {
    EQUALS: "equals",
    NOT_EQUALS: "does not equal",
    EXISTS: "exists",
    DOES_NOT_EXIST: "does not exist",
    CONTAINS: "contains",
    GREATER_THAN: "is greater than",
    LESS_THAN: "is less than",
    BETWEEN: "is between",
  }[operator];
}

function operatorSymbol(operator: AssertionOperatorValue) {
  return {
    EQUALS: "=",
    NOT_EQUALS: "≠",
    EXISTS: "to exist",
    DOES_NOT_EXIST: "not to exist",
    CONTAINS: "to contain",
    GREATER_THAN: ">",
    LESS_THAN: "<",
    BETWEEN: "between",
  }[operator];
}

function safeValue(value: unknown) {
  const serialized = JSON.stringify(value);
  return truncate(serialized === undefined ? String(value) : serialized);
}

function truncate(value: string) {
  return value.length > 240 ? `${value.slice(0, 237)}…` : value;
}

function titleCase(value: string) {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}
