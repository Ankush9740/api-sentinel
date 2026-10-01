"use client";

import { useRouter } from "next/navigation";
import type { ComponentProps, ReactNode } from "react";

import { createNewRequestHref } from "@/lib/workspace/new-request";

interface NewRequestButtonProps
  extends Omit<ComponentProps<"button">, "children" | "onClick" | "type"> {
  children: ReactNode;
  collectionId?: string | null;
  onNavigate?: () => void;
}

export function NewRequestButton({
  children,
  collectionId,
  onNavigate,
  ...props
}: NewRequestButtonProps) {
  const router = useRouter();

  return (
    <button
      {...props}
      type="button"
      onClick={() => {
        onNavigate?.();
        router.push(createNewRequestHref({ collectionId }));
      }}
    >
      {children}
    </button>
  );
}
