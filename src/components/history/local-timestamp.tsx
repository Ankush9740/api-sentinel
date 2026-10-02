"use client";

import { useSyncExternalStore } from "react";

import { formatLocalTimestamp } from "@/lib/history/timestamp";

const subscribe = () => () => undefined;
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function LocalTimestamp({ value }: { value: string }) {
  const hydrated = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );

  return (
    <span
      className={hydrated ? undefined : "invisible"}
      aria-hidden={hydrated ? undefined : true}
    >
      {hydrated ? formatLocalTimestamp(value) : value}
    </span>
  );
}
