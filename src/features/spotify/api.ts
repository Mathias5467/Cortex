import { invoke } from "@tauri-apps/api/core";

export interface NowPlaying {
  title: string;
  artist: string;
  album: string;
  is_playing: boolean;
  position_ms: number;
  duration_ms: number;
  shuffle: boolean | null;
  repeat: "none" | "list" | "track" | null;
}

export type SpotifyAction = "toggle" | "next" | "previous" | "shuffle" | "repeat" | "seek";

export const spotifyApi = {
  nowPlaying: () => invoke<NowPlaying | null>("spotify_now_playing"),
  artwork: () => invoke<string | null>("spotify_artwork"),
  control: (action: SpotifyAction, positionMs?: number) =>
    invoke<void>("spotify_control", { action, positionMs: positionMs ?? null }),
};

export const SPOTIFY_URI = "spotify:";

export function searchUri(query: string) {
  return `spotify:search:${encodeURIComponent(query)}`;
}
