export const ASSERTION_TYPES = [
  "STATUS_CODE",
  "RESPONSE_TIME",
  "HEADER",
  "JSON_PATH",
] as const;

export const ASSERTION_OPERATORS = [
  "EQUALS",
  "NOT_EQUALS",
  "EXISTS",
  "DOES_NOT_EXIST",
  "CONTAINS",
  "GREATER_THAN",
  "LESS_THAN",
  "BETWEEN",
] as const;

export type AssertionTypeValue = (typeof ASSERTION_TYPES)[number];
export type AssertionOperatorValue = (typeof ASSERTION_OPERATORS)[number];

export const ASSERTION_OPERATORS_BY_TYPE: Record<
  AssertionTypeValue,
  readonly AssertionOperatorValue[]
> = {
  STATUS_CODE: ["EQUALS", "NOT_EQUALS", "BETWEEN"],
  RESPONSE_TIME: ["LESS_THAN", "GREATER_THAN", "BETWEEN"],
  HEADER: ["EXISTS", "DOES_NOT_EXIST", "EQUALS", "NOT_EQUALS", "CONTAINS"],
  JSON_PATH: [
    "EXISTS",
    "DOES_NOT_EXIST",
    "EQUALS",
    "NOT_EQUALS",
    "CONTAINS",
    "GREATER_THAN",
    "LESS_THAN",
  ],
};

export interface AssertionDefinition {
  id?: string;
  type: AssertionTypeValue;
  operator: AssertionOperatorValue;
  target: string | null;
  expectedValue: string | null;
  enabled: boolean;
}

export interface AssertionEvaluationResult {
  index: number;
  assertionId: string | null;
  type: AssertionTypeValue;
  operator: AssertionOperatorValue;
  target: string | null;
  expected: string | null;
  actual: string | null;
  passed: boolean;
  label: string;
  message: string;
}

export interface AssertionRunSummary {
  total: number;
  passed: number;
  failed: number;
  results: AssertionEvaluationResult[];
}
