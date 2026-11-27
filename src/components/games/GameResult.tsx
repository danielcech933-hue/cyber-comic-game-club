import { Link } from "@tanstack/react-router";

export function GameResult({ won, title, detail, onRematch }: { won: boolean; title?: string; detail?: string; onRematch: () => void }) {
  return (
    <div className="absolute inset-0 z-20 grid place-items-center bg-ink/80 p-4">
      <div className="hatch grid max-w-sm gap-4 border-2 border-neon bg-noir p-6 text-center">
        <p className={`comic-shadow mx-auto rotate-[-4deg] rounded-[28px] bg-paper px-6 py-3 font-display text-5xl text-ink`}>
          {title ?? (won ? "BAAAM! VÝHRA!" : "PROHRA!")}
        </p>
        {detail && <p className="text-sm font-semibold text-paper/80">{detail}</p>}
        <div className="flex gap-2">
          <button type="button" onClick={onRematch} className="cut-btn flex-1 bg-neon py-2 font-display text-2xl text-ink hover:bg-paper">ODVETA</button>
          <Link to="/" className="cut-btn flex-1 border-2 border-pink py-2 font-display text-2xl text-pink hover:bg-pink hover:text-ink">LOBBY</Link>
        </div>
      </div>
    </div>
  );
}

export function Bubble({ children, tone = "paper" }: { children: React.ReactNode; tone?: "paper" | "pink" | "neon" }) {
  const bg = tone === "pink" ? "bg-pink" : tone === "neon" ? "bg-neon" : "bg-paper";
  return <p className={`w-fit rounded-2xl rounded-bl-none px-3 py-2 text-sm font-semibold text-ink ${bg}`}>{children}</p>;
}
