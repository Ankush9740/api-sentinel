import { cn } from "@/lib/classnames";
import type { HttpMethodValue } from "@/lib/collections/types";

const methodStyles: Record<HttpMethodValue, string> = {
  GET: "border-method-get/25 bg-method-get-muted text-method-get",
  POST: "border-method-post/25 bg-method-post-muted text-method-post",
  PUT: "border-method-put/25 bg-method-put-muted text-method-put",
  PATCH: "border-method-patch/25 bg-method-patch-muted text-method-patch",
  DELETE: "border-method-delete/25 bg-method-delete-muted text-method-delete",
};

export function MethodBadge({
  method,
  className,
}: {
  method: HttpMethodValue;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 min-w-14 shrink-0 items-center justify-center rounded-md border px-2 font-mono text-[10px] font-bold tracking-[0.04em]",
        methodStyles[method],
        className,
      )}
    >
      {method}
    </span>
  );
}
