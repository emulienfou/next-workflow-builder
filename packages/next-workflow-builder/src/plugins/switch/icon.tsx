export function SwitchIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-label="Switch icon"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Switch</title>
      <circle cx="18" cy="18" r="3" />
      <circle cx="18" cy="6" r="3" />
      <circle cx="6" cy="12" r="3" />
      <path d="M9 12h3" />
      <path d="M15 6.5l-3 4" />
      <path d="M15 17.5l-3-4" />
    </svg>
  );
}
