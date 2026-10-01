"use client";

import { CloseIcon, PlusIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  ASSERTION_OPERATORS_BY_TYPE,
  ASSERTION_TYPES,
  type AssertionOperatorValue,
  type AssertionTypeValue,
} from "@/lib/assertions/types";
import { parseJsonPathSegments } from "@/lib/assertions/json-path";
import { isSensitiveHeaderName } from "@/lib/security/sensitive-headers";
import { MAX_ASSERTIONS_PER_REQUEST } from "@/lib/validation/assertions";

export interface EditableAssertion {
  clientId: string;
  type: AssertionTypeValue;
  operator: AssertionOperatorValue;
  target: string;
  expectedValue: string;
  enabled: boolean;
}

interface AssertionBuilderProps {
  assertions: EditableAssertion[];
  setAssertions: (assertions: EditableAssertion[]) => void;
}

const typeLabels: Record<AssertionTypeValue, string> = {
  STATUS_CODE: "Status code",
  RESPONSE_TIME: "Response time",
  HEADER: "Response header",
  JSON_PATH: "JSON path",
};

const operatorLabels: Record<AssertionOperatorValue, string> = {
  EQUALS: "equals",
  NOT_EQUALS: "does not equal",
  EXISTS: "exists",
  DOES_NOT_EXIST: "does not exist",
  CONTAINS: "contains",
  GREATER_THAN: "greater than",
  LESS_THAN: "less than",
  BETWEEN: "between",
};

export function AssertionBuilder({ assertions, setAssertions }: AssertionBuilderProps) {
  function updateAssertion(clientId: string, patch: Partial<EditableAssertion>) {
    setAssertions(assertions.map((assertion) =>
      assertion.clientId === clientId ? { ...assertion, ...patch } : assertion,
    ));
  }

  function changeType(assertion: EditableAssertion, type: AssertionTypeValue) {
    const defaults = assertionDefaults(type);
    updateAssertion(assertion.clientId, {
      type,
      operator: defaults.operator,
      target: defaults.target,
      expectedValue: defaults.expectedValue,
    });
  }

  function changeOperator(assertion: EditableAssertion, operator: AssertionOperatorValue) {
    const usesExpected = operator !== "EXISTS" && operator !== "DOES_NOT_EXIST";
    updateAssertion(assertion.clientId, {
      operator,
      expectedValue: usesExpected
        ? assertion.expectedValue || defaultExpected(assertion.type, operator)
        : "",
    });
  }

  return (
    <div className="min-w-0">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-text-secondary">Response assertions</p>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-text-subtle">
            Assertions run on the server after every HTTP response. JSON comparisons are strict:
            use quoted text such as <code className="font-mono">&quot;active&quot;</code>, while
            numbers and booleans stay unquoted.
          </p>
        </div>
        <span className="font-mono text-[10px] text-text-subtle">
          {assertions.length}/{MAX_ASSERTIONS_PER_REQUEST}
        </span>
      </div>

      {assertions.length ? (
        <div className="space-y-2.5">
          {assertions.map((assertion, index) => {
            const error = getAssertionDraftError(assertion);
            const usesTarget = assertion.type === "HEADER" || assertion.type === "JSON_PATH";
            const usesExpected = assertion.operator !== "EXISTS" && assertion.operator !== "DOES_NOT_EXIST";
            return (
              <fieldset
                key={assertion.clientId}
                className="min-w-0 rounded-xl border border-border bg-surface p-2.5 sm:p-3"
              >
                <legend className="sr-only">Assertion {index + 1}</legend>
                <div className="grid min-w-0 grid-cols-[1.75rem_minmax(0,1fr)_2rem] gap-2 @min-[52rem]/request:grid-cols-[1.75rem_minmax(8.5rem,0.9fr)_minmax(8.5rem,0.9fr)_minmax(10rem,1.1fr)_minmax(9rem,1fr)_2rem]">
                  <label className="col-start-1 row-start-1 flex items-center justify-center self-center">
                    <span className="sr-only">Enable assertion {index + 1}</span>
                    <input
                      type="checkbox"
                      checked={assertion.enabled}
                      onChange={(event) => updateAssertion(assertion.clientId, { enabled: event.target.checked })}
                      className="size-4 accent-accent"
                    />
                  </label>
                  <Select
                    aria-label={`Assertion ${index + 1} type`}
                    value={assertion.type}
                    onChange={(event) => changeType(assertion, event.target.value as AssertionTypeValue)}
                    className="col-start-2 row-start-1 h-9 min-w-0 text-xs"
                  >
                    {ASSERTION_TYPES.map((type) => <option key={type} value={type}>{typeLabels[type]}</option>)}
                  </Select>
                  <Select
                    aria-label={`Assertion ${index + 1} operator`}
                    value={assertion.operator}
                    onChange={(event) => changeOperator(assertion, event.target.value as AssertionOperatorValue)}
                    className="col-span-3 row-start-2 h-9 min-w-0 text-xs @min-[52rem]/request:col-span-1 @min-[52rem]/request:col-start-3 @min-[52rem]/request:row-start-1"
                  >
                    {ASSERTION_OPERATORS_BY_TYPE[assertion.type].map((operator) => (
                      <option key={operator} value={operator}>{operatorLabels[operator]}</option>
                    ))}
                  </Select>
                  {usesTarget ? (
                    <Input
                      aria-label={`Assertion ${index + 1} target`}
                      value={assertion.target}
                      onChange={(event) => updateAssertion(assertion.clientId, { target: event.target.value })}
                      placeholder={assertion.type === "HEADER" ? "content-type" : "data.users.0.id"}
                      className="col-span-3 row-start-3 h-9 font-mono text-xs @min-[52rem]/request:col-span-1 @min-[52rem]/request:col-start-4 @min-[52rem]/request:row-start-1"
                      maxLength={256}
                    />
                  ) : (
                    <div className="col-span-3 row-start-3 hidden h-9 items-center rounded-lg border border-dashed border-border px-3 text-xs text-text-subtle @min-[52rem]/request:col-span-1 @min-[52rem]/request:col-start-4 @min-[52rem]/request:row-start-1 @min-[52rem]/request:flex">
                      Response value
                    </div>
                  )}
                  {usesExpected ? (
                    <Input
                      aria-label={`Assertion ${index + 1} expected value`}
                      value={assertion.expectedValue}
                      onChange={(event) => updateAssertion(assertion.clientId, { expectedValue: event.target.value })}
                      placeholder={expectedPlaceholder(assertion)}
                      className="col-span-3 row-start-4 h-9 font-mono text-xs @min-[52rem]/request:col-span-1 @min-[52rem]/request:col-start-5 @min-[52rem]/request:row-start-1"
                      maxLength={1_024}
                      inputMode={assertion.type === "STATUS_CODE" || assertion.type === "RESPONSE_TIME" ? "numeric" : undefined}
                    />
                  ) : (
                    <div className="col-span-3 row-start-4 hidden h-9 items-center rounded-lg border border-dashed border-border px-3 text-xs text-text-subtle @min-[52rem]/request:col-span-1 @min-[52rem]/request:col-start-5 @min-[52rem]/request:row-start-1 @min-[52rem]/request:flex">
                      No expected value
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setAssertions(assertions.filter((item) => item.clientId !== assertion.clientId))}
                    aria-label={`Remove assertion ${index + 1}`}
                    className="col-start-3 row-start-1 size-8 text-text-subtle hover:text-danger-soft @min-[52rem]/request:col-start-6"
                  >
                    <CloseIcon className="size-4" />
                  </Button>
                </div>
                {error ? <p role="alert" className="mt-2 pl-9 text-xs text-danger-soft">{error}</p> : null}
              </fieldset>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border-strong bg-surface/60 px-4 py-6 text-center">
          <p className="text-[13px] font-medium text-text-secondary">No assertions yet</p>
          <p className="mt-1 text-xs leading-5 text-text-muted">Add a rule to verify status, timing, headers, or JSON response values.</p>
        </div>
      )}

      <Button
        variant="ghost"
        size="sm"
        disabled={assertions.length >= MAX_ASSERTIONS_PER_REQUEST}
        onClick={() => setAssertions([...assertions, emptyAssertion()])}
        className="mt-3"
      >
        <PlusIcon className="size-4" /> Add assertion
      </Button>
      {assertions.length >= MAX_ASSERTIONS_PER_REQUEST ? (
        <p role="status" className="mt-2 text-xs text-text-subtle">The 50-assertion limit has been reached.</p>
      ) : null}
    </div>
  );
}

export function emptyAssertion(type: AssertionTypeValue = "STATUS_CODE"): EditableAssertion {
  return {
    clientId: `assertion-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type,
    ...assertionDefaults(type),
    enabled: true,
  };
}

export function getAssertionsDraftError(assertions: EditableAssertion[]) {
  for (let index = 0; index < assertions.length; index += 1) {
    const error = getAssertionDraftError(assertions[index]);
    if (error) return `Assertion ${index + 1}: ${error}`;
  }
  return null;
}

function getAssertionDraftError(assertion: EditableAssertion) {
  if (!ASSERTION_OPERATORS_BY_TYPE[assertion.type].includes(assertion.operator)) {
    return "Choose an operator supported by this assertion type.";
  }
  if ((assertion.type === "HEADER" || assertion.type === "JSON_PATH") && !assertion.target.trim()) {
    return assertion.type === "HEADER" ? "Enter a response header name." : "Enter a JSON property path.";
  }
  if (assertion.type === "HEADER") {
    if (!/^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/.test(assertion.target.trim())) return "Enter a valid response header name.";
    if (isSensitiveHeaderName(assertion.target)) {
      return "Sensitive header values cannot be used in assertions.";
    }
  }
  if (assertion.type === "JSON_PATH") {
    const path = assertion.target.trim().replace(/^body\./, "");
    if (!parseJsonPathSegments(path)) {
      return "Use a path such as $.data.users[0].id (up to 32 segments).";
    }
  }
  if (assertion.operator === "EXISTS" || assertion.operator === "DOES_NOT_EXIST") return null;
  if (!assertion.expectedValue.trim()) return "Enter an expected value.";

  if (assertion.type === "STATUS_CODE" || assertion.type === "RESPONSE_TIME") {
    if (assertion.operator === "BETWEEN") {
      const values = assertion.expectedValue.split(",").map((value) => Number(value.trim()));
      if (values.length !== 2 || values.some((value) => !Number.isFinite(value)) || values[0] > values[1]) {
        return "Enter a range as minimum,maximum.";
      }
    } else if (!Number.isFinite(Number(assertion.expectedValue))) {
      return "Enter a numeric expected value.";
    }
  }
  if (assertion.type === "JSON_PATH") {
    try {
      const value = JSON.parse(assertion.expectedValue) as unknown;
      if (typeof value === "object" && value !== null) return "Use a scalar JSON value, not an object or array.";
      if ((assertion.operator === "GREATER_THAN" || assertion.operator === "LESS_THAN") && typeof value !== "number") {
        return "Numeric comparisons require a JSON number.";
      }
    } catch {
      return 'Use a JSON literal such as "Ankush", 42, true, or null.';
    }
  }
  return null;
}

function assertionDefaults(type: AssertionTypeValue) {
  if (type === "STATUS_CODE") return { operator: "EQUALS" as const, target: "", expectedValue: "200" };
  if (type === "RESPONSE_TIME") return { operator: "LESS_THAN" as const, target: "", expectedValue: "500" };
  if (type === "HEADER") return { operator: "EXISTS" as const, target: "content-type", expectedValue: "" };
  return { operator: "EXISTS" as const, target: "", expectedValue: "" };
}

function defaultExpected(type: AssertionTypeValue, operator: AssertionOperatorValue) {
  if (operator === "BETWEEN") return type === "STATUS_CODE" ? "200,299" : "0,500";
  if (type === "STATUS_CODE") return "200";
  if (type === "RESPONSE_TIME") return "500";
  if (type === "JSON_PATH") return '"value"';
  return "value";
}

function expectedPlaceholder(assertion: EditableAssertion) {
  if (assertion.operator === "BETWEEN") return "minimum,maximum";
  if (assertion.type === "STATUS_CODE") return "200";
  if (assertion.type === "RESPONSE_TIME") return "500 ms";
  if (assertion.type === "JSON_PATH") return '"value", 42, true, null';
  return "Expected value";
}
