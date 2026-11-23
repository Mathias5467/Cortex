import { useState } from "react";
import type { KeyboardEvent, MouseEvent } from "react";
import { Music, Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward } from "lucide-react";
import { useLauncher } from "@/core/launcher";
import { useAsync } from "@/core/useAsync";
import { usePolling } from "@/core/usePolling";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { KeyHint } from "@/components/ui/Kbd";
import { EmptyState, View, ViewFooter, ViewHeader } from "@/components/ui/View";
import { SPOTIFY_URI, spotifyApi, type NowPlaying, type SpotifyAction } from "./api";

const REFRESH_INTERVAL = 1000;
const SETTLE_DELAY = 250;
const SEEK_STEP = 10_000;

function formatTime(ms: number): string {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`;
}

interface PlayerProps {
  track: NowPlaying;
  onControl: (action: SpotifyAction, positionMs?: number) => void;
}

function Player({ track, onControl }: PlayerProps) {
  const artwork = useAsync(`${track.title}|${track.artist}|${track.album}`, spotifyApi.artwork, 400);
  const progress = track.duration_ms > 0 ? (track.position_ms / track.duration_ms) * 100 : 0;
  const RepeatIcon = track.repeat === "track" ? Repeat1 : Repeat;

  function seek(e: MouseEvent<HTMLDivElement>) {
    const { left, width } = e.currentTarget.getBoundingClientRect();
    onControl("seek", Math.round(((e.clientX - left) / width) * track.duration_ms));
  }

  return (
    <div className="flex-1 min-h-0 flex items-center gap-6 px-4">
      {artwork.data ? (
        <img src={artwork.data} alt="" className="w-40 h-40 rounded-xl object-cover shadow-2xl shrink-0" />
      ) : (
        <div className="w-40 h-40 rounded-xl bg-field border border-line flex items-center justify-center shrink-0">
          <Music className="w-12 h-12 text-faint" />
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col gap-4">
        <div className="min-w-0">
          <div className="text-lg font-bold truncate">{track.title}</div>
          <div className="text-sm text-secondary truncate">{track.artist}</div>
          <div className="text-xs text-muted truncate">{track.album}</div>
        </div>

        <div>
          <div className="py-1.5 cursor-pointer" onClick={seek}>
            <div className="h-1 rounded-full bg-hover overflow-hidden">
              <div className="h-full bg-accent rounded-full" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className="flex justify-between text-[10px] font-mono text-muted">
            <span>{formatTime(track.position_ms)}</span>
            <span>{formatTime(track.duration_ms)}</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          <IconButton title="Shuffle (S)" disabled={track.shuffle === null} onClick={() => onControl("shuffle")}>
            <Shuffle className={`w-4 h-4 ${track.shuffle ? "text-accent" : ""}`} />
          </IconButton>
          <IconButton title="Previous" onClick={() => onControl("previous")}>
            <SkipBack className="w-5 h-5" />
          </IconButton>
          <button
            type="button"
            title="Play / Pause"
            onClick={() => onControl("toggle")}
            className="cursor-pointer w-11 h-11 rounded-full bg-accent hover:bg-accent-hover text-on-accent flex items-center justify-center transition-colors"
          >
            {track.is_playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
          <IconButton title="Next" onClick={() => onControl("next")}>
            <SkipForward className="w-5 h-5" />
          </IconButton>
          <IconButton title="Repeat (R)" disabled={track.repeat === null} onClick={() => onControl("repeat")}>
            <RepeatIcon className={`w-4 h-4 ${track.repeat && track.repeat !== "none" ? "text-accent" : ""}`} />
          </IconButton>
        </div>
      </div>
    </div>
  );
}

export function SpotifyView() {
  const { goBack, openPath, notify } = useLauncher();
  const { data, error, isLoading, refresh } = usePolling(spotifyApi.nowPlaying, REFRESH_INTERVAL);
  const [isSending, setIsSending] = useState(false);

  async function control(action: SpotifyAction, positionMs?: number) {
    if (isSending) return;
    setIsSending(true);
    try {
      await spotifyApi.control(action, positionMs);
      await new Promise((resolve) => setTimeout(resolve, SETTLE_DELAY));
      await refresh();
    } catch (err) {
      notify(String(err), "error");
    } finally {
      setIsSending(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      goBack();
      return;
    }
    if (!data || e.ctrlKey || e.altKey) return;

    const shortcuts: Record<string, () => Promise<void>> = {
      " ": () => control("toggle"),
      enter: () => control("toggle"),
      arrowright: () => control("next"),
      arrowleft: () => control("previous"),
      arrowup: () => control("seek", Math.min(data.duration_ms, data.position_ms + SEEK_STEP)),
      arrowdown: () => control("seek", Math.max(0, data.position_ms - SEEK_STEP)),
      s: () => control("shuffle"),
      r: () => control("repeat"),
    };
    const shortcut = shortcuts[e.key.toLowerCase()];
    if (shortcut) {
      e.preventDefault();
      void shortcut();
    }
  }

  return (
    <View captureFocus onKeyDown={handleKeyDown}>
      <ViewHeader onBack={goBack} icon={Music} title="Spotify">
        <Button
          variant="soft"
          onClick={() => {
            openPath(SPOTIFY_URI).catch((err) => notify(String(err), "error"));
          }}
        >
          Open Spotify
        </Button>
      </ViewHeader>

      {data ? (
        <Player track={data} onControl={(action, positionMs) => void control(action, positionMs)} />
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <EmptyState>{error ?? (isLoading ? "Loading..." : "Spotify is not running")}</EmptyState>
        </div>
      )}

      <ViewFooter>
        <KeyHint keys={["space"]} label="Play" />
        <KeyHint keys={["←", "→"]} label="Track" />
        <KeyHint keys={["↑", "↓"]} label="Seek 10s" />
        <KeyHint keys={["S"]} label="Shuffle" />
        <KeyHint keys={["R"]} label="Repeat" />
        <KeyHint keys={["esc"]} label="Back" />
      </ViewFooter>
    </View>
  );
}
