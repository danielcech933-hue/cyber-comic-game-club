import { Link } from "@tanstack/react-router";
import { Bolt } from "./Bolt";

export function LobbyHeader() {
  return (
    <header className="cut-header hatch relative flex h-16 items-center justify-between gap-3 border-b-2 border-neon bg-noir px-5 sm:h-20 sm:px-8">
      <Link to="/" className="flex min-w-0 items-center gap-3">
        <div className="cut-logo grid h-9 w-9 shrink-0 place-items-center bg-neon text-ink sm:h-11 sm:w-11">
          <Bolt />
        </div>
        <h1 className="truncate font-display text-2xl tracking-wider text-paper sm:text-4xl">
          CYBER <span className="text-neon">CHMEL</span> LOBBY
        </h1>
      </Link>
      <div className="flex shrink-0 items-center gap-3 sm:gap-6">
        <div className="hidden items-center gap-2 text-sm font-semibold sm:flex">
          <span className="relative h-3 w-3">
            <span className="absolute inset-0 animate-ping rounded-full bg-neon opacity-60" />
            <span className="absolute inset-0 rounded-full bg-neon" />
          </span>
          ONLINE HERNÍ KLUB
        </div>
      </div>
    </header>
  );
}
