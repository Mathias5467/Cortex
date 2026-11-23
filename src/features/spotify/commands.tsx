import { Music, Pause, SkipBack, SkipForward } from "lucide-react";
import type { Command, Launcher } from "@/core/types";
import { SpotifyView } from "./SpotifyView";
import { spotifyApi, type SpotifyAction } from "./api";

function control(action: SpotifyAction) {
  return async (launcher: Launcher) => {
    await spotifyApi.control(action);
    launcher.close();
  };
}

export const spotifyCommands: Command[] = [
  {
    id: "spotify",
    name: "Spotify",
    description: "Now playing and playback controls",
    icon: Music,
    category: "media",
    run: (launcher) => launcher.open(<SpotifyView />),
  },
  {
    id: "spotify-toggle",
    name: "Spotify: Play / Pause",
    description: "Toggle playback",
    icon: Pause,
    category: "media",
    run: control("toggle"),
  },
  {
    id: "spotify-next",
    name: "Spotify: Next Track",
    description: "Skip to the next track",
    icon: SkipForward,
    category: "media",
    run: control("next"),
  },
  {
    id: "spotify-previous",
    name: "Spotify: Previous Track",
    description: "Go back to the previous track",
    icon: SkipBack,
    category: "media",
    run: control("previous"),
  },
];
