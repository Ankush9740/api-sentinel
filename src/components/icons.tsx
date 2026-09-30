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

export function SearchIcon(props: IconProps) {
  return (
    <svg {...commonProps} {...props}>
      <circle cx="11" cy="11" r="6" />
      <path d="m16 16 4 4" />
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

export function BracketsIcon(props: IconProps) {
  return (
    <svg {...commonProps} {...props}>
      <path d="M8 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h2" />
      <path d="M16 4h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-2" />
      <path d="m14 9-4 6" />
    </svg>
  );
}
