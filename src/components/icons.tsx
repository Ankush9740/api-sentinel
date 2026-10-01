import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const commonProps: IconProps = {
  "aria-hidden": true,
  fill: "none",
  viewBox: "0 0 24 24",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export function DashboardIcon(props: IconProps) {
  return (
    <svg {...commonProps} {...props}>
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <rect x="14" y="14" width="6" height="6" rx="1" />
    </svg>
  );
}

export function ProductMarkIcon(props: IconProps) {
  return (
    <svg {...commonProps} {...props}>
      <circle cx="5" cy="7" r="1.75" fill="currentColor" stroke="none" />
      <circle cx="19" cy="17" r="1.75" fill="currentColor" stroke="none" />
      <path d="M7 7h6.5a3.5 3.5 0 0 1 3.5 3.5v0" />
      <path d="M17 17h-6.5A3.5 3.5 0 0 1 7 13.5v0" />
      <path d="m14.5 8 2.5 2.5L19.5 8" />
      <path d="m9.5 16-2.5-2.5L4.5 16" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg {...commonProps} {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function CollectionIcon(props: IconProps) {
  return (
    <svg {...commonProps} {...props}>
      <path d="M4 7.5h5l1.5 2H20v8.5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7.5Z" />
      <path d="M4 7.5V6a2 2 0 0 1 2-2h3l1.5 2H18a2 2 0 0 1 2 2v1.5" />
    </svg>
  );
}

export function HistoryIcon(props: IconProps) {
  return (
    <svg {...commonProps} {...props}>
      <path d="M4.5 8.5A8 8 0 1 1 4 14" />
      <path d="M4.5 4.5v4h4" />
      <path d="M12 8v4.5l3 2" />
    </svg>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <svg {...commonProps} {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
    </svg>
  );
}

export function GitHubIcon(props: IconProps) {
  return (
    <svg {...props} aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.87c-2.78.6-3.37-1.18-3.37-1.18-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.35 1.09 2.92.83.09-.65.35-1.09.64-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.58 9.58 0 0 1 12 7.82c.85 0 1.71.11 2.51.34 1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85V21c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
    </svg>
  );
}

export function GoogleIcon(props: IconProps) {
  return (
    <svg {...props} aria-hidden="true" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.71-.06-1.4-.18-2.05H12v3.87h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.35Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.97-.9 6.62-2.42l-3.24-2.51c-.9.6-2.05.96-3.38.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.59A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.39 13.9A6 6 0 0 1 6.08 12c0-.66.11-1.3.31-1.9V7.51H3.04A10 10 0 0 0 2 12c0 1.61.39 3.14 1.04 4.49l3.35-2.59Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.97c1.47 0 2.79.5 3.82 1.49l2.87-2.87A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.96 5.51l3.35 2.59C7.18 7.73 9.39 5.97 12 5.97Z"
      />
    </svg>
  );
}

export function LogOutIcon(props: IconProps) {
  return (
    <svg {...commonProps} {...props}>
      <path d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4" />
      <path d="M14 8l4 4-4 4M9 12h9" />
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <svg {...commonProps} {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...commonProps} {...props}>
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <svg {...commonProps} {...props}>
      <path d="M5 12h14M14 7l5 5-5 5" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...commonProps} {...props}>
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

export function CopyIcon(props: IconProps) {
  return (
    <svg {...commonProps} {...props}>
      <rect x="8" y="8" width="11" height="11" rx="2" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </svg>
  );
}

export function BracketsIcon(props: IconProps) {
  return (
    <svg {...commonProps} {...props}>
      <path d="M8 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h2" />
      <path d="M16 4h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-2" />
      <path d="m14 9-4 6" />
    </svg>
  );
}

export function EditIcon(props: IconProps) {
  return (
    <svg {...commonProps} {...props}>
      <path d="m14 5 5 5L9 20H4v-5L14 5Z" />
      <path d="m12 7 5 5" />
    </svg>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <svg {...commonProps} {...props}>
      <path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13" />
      <path d="M10 11v5M14 11v5" />
    </svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <svg {...commonProps} {...props}>
      <path d="m9 5 7 7-7 7" />
    </svg>
  );
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <svg {...commonProps} {...props}>
      <path d="M19 12H5M10 7l-5 5 5 5" />
    </svg>
  );
}
