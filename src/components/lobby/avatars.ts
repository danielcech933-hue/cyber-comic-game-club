import clip from "@/assets/avatar_clip.jpg.asset.json";
import curly from "@/assets/avatar_curly.jpg.asset.json";
import wavy from "@/assets/avatar_wavy.jpg.asset.json";
import type { AvatarKey } from "@/lib/lobby-store";

export const AVATARS: Record<AvatarKey, string> = { clip: clip.url, curly: curly.url, wavy: wavy.url };
