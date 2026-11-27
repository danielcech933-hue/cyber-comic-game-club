export function Bolt({ className = "", size = 18 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={(size * 22) / 18} viewBox="0 0 18 22" className={className} aria-hidden>
      <path d="M11 0L0 13h7l-2 9 11-13H9z" fill="currentColor" />
    </svg>
  );
}
