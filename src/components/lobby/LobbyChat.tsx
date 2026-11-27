import { useEffect, useRef, useState } from "react";
import { sendChat, type LobbyState } from "@/lib/lobby-store";
import { AVATARS } from "./avatars";

export function LobbyChat({ lobby }: { lobby: LobbyState }) {
  const [text, setText] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [lobby.chat.length]);

  return (
    <div className="flex min-h-[420px] flex-1 flex-col gap-4 border-2 border-paper/15 bg-noir p-4 lg:min-h-0">
      <p className="font-display text-2xl tracking-wide">ŽIVÝ CHAT</p>
      <div ref={listRef} className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
        {lobby.chat.map((m) => {
          const mine = m.author === "__me__" || (lobby.nick !== "" && m.author === lobby.nick);
          if (mine)
            return (
              <div key={m.id} className="flex flex-row-reverse items-end gap-2">
                <p className="rounded-2xl rounded-br-none bg-neon px-3 py-2 text-sm font-semibold text-ink">{m.text}</p>
              </div>
            );
          return (
            <div key={m.id} className="flex items-end gap-2">
              {m.avatar ? (
                <img
                  src={AVATARS[m.avatar]}
                  alt={m.author}
                  title={m.author}
                  className={`h-9 w-9 shrink-0 rounded-full border-2 object-cover ${m.color === "pink" ? "border-pink" : "border-neon"}`}
                />
              ) : (
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-neon font-display text-neon">
                  {m.author.charAt(0)}
                </span>
              )}
              <p
                className={`rounded-2xl rounded-bl-none px-3 py-2 text-sm font-semibold text-ink ${m.color === "pink" ? "bg-pink" : "bg-paper"}`}
              >
                {m.text}
              </p>
            </div>
          );
        })}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendChat(text);
          setText("");
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Napiš do lobby…"
          maxLength={240}
          aria-label="Zpráva do lobby"
          className="w-full rounded-full border border-paper/20 bg-transparent px-4 py-2.5 text-sm text-paper placeholder:text-paper/40 focus:border-neon focus:outline-none"
        />
      </form>
    </div>
  );
}
