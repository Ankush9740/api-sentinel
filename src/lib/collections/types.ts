import type { HTTP_METHODS } from "@/lib/validation/phase2";
import type {
  AssertionOperatorValue,
  AssertionTypeValue,
} from "@/lib/assertions/types";

export type HttpMethodValue = (typeof HTTP_METHODS)[number];

export interface CollectionSummary {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  endpointCount: number;
}

export interface EndpointSummary {
  id: string;
  name: string;
  method: HttpMethodValue;
  url: string;
  updatedAt: string;
}

export interface CollectionDetail extends CollectionSummary {
  endpoints: EndpointSummary[];
}

export interface SavedRequestRow {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export interface SavedRequestHeader extends SavedRequestRow {
  sensitive: boolean;
}

export interface SavedAssertion {
  id: string;
  type: AssertionTypeValue;
  operator: AssertionOperatorValue;
  target: string | null;
  expectedValue: string | null;
  enabled: boolean;
  position: number;
}

export interface SavedEndpoint {
  id: string;
  collectionId: string;
  collectionName: string;
  name: string;
  method: HttpMethodValue;
  url: string;
  body: string | null;
  createdAt: string;
  updatedAt: string;
  queryParameters: SavedRequestRow[];
  headers: SavedRequestHeader[];
  assertions: SavedAssertion[];
}

export interface CollectionOption {
  id: string;
  name: string;
}
