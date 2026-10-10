import { useEffect, useState, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ArrowLeft, RotateCcw, Trophy, Clock, Type, Loader2, Keyboard, Dot } from "lucide-react";

interface TypingGameProps {
  onBack: () => void;
}

type GameMode = "time" | "words";

const TIME_OPTIONS = [15, 30, 60, 90] as const;
const WORD_OPTIONS = [10, 25, 50, 100] as const;

const FALLBACK_WORDS = [
  "const", "function", "return", "import", "export", "async", "await",
  "promise", "memory", "thread", "render", "state", "effect", "window",
  "system", "binary", "source", "module", "string", "number", "object",
  "cursor", "screen", "button", "layout", "search", "engine", "result",
  "native", "launch", "command", "desktop", "target", "device", "syntax",
  "simple", "future", "bridge", "client", "server", "action", "vector"
];

export function TypingGame({ onBack }: TypingGameProps) {
  const [gameMode, setGameMode] = useState<GameMode>("time");
  const [timeLimit, setTimeLimit] = useState<number>(15);
  const [wordLimit, setWordLimit] = useState<number>(25);

  const [words, setWords] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentWordIdx, setCurrentWordIdx] = useState(0);
  const [currentInput, setCurrentInput] = useState("");
  const [charHistory, setCharHistory] = useState<{ [wordIdx: number]: string }>({});

  const [timeLeft, setTimeLeft] = useState(15);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const [totalCorrectChars, setTotalCorrectChars] = useState(0);
  const [totalCharsTyped, setTotalCharsTyped] = useState(0);
  const [bestWpm, setBestWpm] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    invoke<number>("get_best_typing_score")
      .then((score) => setBestWpm(score))
      .catch(() => {});
  }, []);

  useEffect(() => {
    initGame();
  }, [gameMode, timeLimit, wordLimit]);

  async function fetchWordsFromApi(count: number): Promise<string[]> {
    try {
      const res = await fetch(`https://random-word-api.herokuapp.com/word?number=${count}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data.map((w: string) => w.toLowerCase());
        }
      }
    } catch {
    }
    return [...FALLBACK_WORDS].sort(() => Math.random() - 0.5).slice(0, count);
  }

  async function initGame() {
    setIsLoading(true);
    const count = gameMode === "time" ? Math.max(timeLimit * 2, 50) : wordLimit;
    const fetched = await fetchWordsFromApi(count);

    setWords(fetched);
    setIsLoading(false);

    setCurrentWordIdx(0);
    setCurrentInput("");
    setCharHistory({});
    setTimeLeft(timeLimit);
    setElapsedSeconds(0);
    setIsRunning(false);
    setIsFinished(false);
    setTotalCorrectChars(0);
    setTotalCharsTyped(0);

    setTimeout(() => inputRef.current?.focus(), 50);
  }

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;

    if (isRunning && !isFinished) {
      timer = setInterval(() => {
        if (gameMode === "time") {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              finishGame(timeLimit);
              return 0;
            }
            return prev - 1;
          });
        } else {
          setElapsedSeconds((prev) => prev + 1);
        }
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [isRunning, isFinished, gameMode, timeLimit]);

  function finishGame(durationSec: number) {
    setIsRunning(false);
    setIsFinished(true);

    const safeSec = Math.max(durationSec, 1);
    const finalWpm = Math.round((totalCorrectChars / 5) / (safeSec / 60));
    const accuracy = totalCharsTyped > 0 ? Math.round((totalCorrectChars / totalCharsTyped) * 100) : 0;

    invoke("save_typing_result", { wpm: finalWpm, accuracy }).catch(() => {});
    if (finalWpm > bestWpm) {
      setBestWpm(finalWpm);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      onBack();
      return;
    }

    if (isFinished) {
      if (e.key === "Enter") {
        e.preventDefault();
        initGame();
      }
      return;
    }

    if (!isRunning && e.key.length === 1 && e.key !== " ") {
      setIsRunning(true);
    }

    if (e.key === " ") {
      e.preventDefault();
      if (!currentInput.trim()) return;

      const targetWord = words[currentWordIdx];
      let correct = 0;
      for (let i = 0; i < currentInput.length; i++) {
        if (currentInput[i] === targetWord[i]) correct++;
      }

      const isLastWord = currentWordIdx >= words.length - 1;
      const newCorrect = totalCorrectChars + correct + 1;
      const newTyped = totalCharsTyped + currentInput.length + 1;

      setTotalCorrectChars(newCorrect);
      setTotalCharsTyped(newTyped);

      setCharHistory((prev) => ({ ...prev, [currentWordIdx]: currentInput }));

      if (gameMode === "words" && isLastWord) {
        finishGame(elapsedSeconds || 1);
        return;
      }

      setCurrentWordIdx((prev) => prev + 1);
      setCurrentInput("");
      return;
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (isFinished) return;
    const val = e.target.value.replace(/\s/g, "");
    setCurrentInput(val);
  }

  const activeDuration = gameMode === "time" ? timeLimit - timeLeft : elapsedSeconds;
  const liveWpm = isRunning && activeDuration > 0
    ? Math.round((totalCorrectChars / 5) / (activeDuration / 60))
    : 0;

  const totalGameDuration = gameMode === "time" ? timeLimit : Math.max(elapsedSeconds, 1);
  const finalWpm = Math.round((totalCorrectChars / 5) / (totalGameDuration / 60));
  const finalAccuracy = totalCharsTyped > 0
    ? Math.round((totalCorrectChars / totalCharsTyped) * 100)
    : 100;

  return (
    <div
      className="w-full h-full flex flex-col justify-between select-none"
      onClick={() => inputRef.current?.focus()}
    >
      <div
        className="w-full flex items-center justify-between py-1.5 pb-2 border-b"
        style={{ borderColor: "var(--border-divider)" }}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-1 cursor-pointer rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
            <Keyboard className="w-3.5 h-3.5" />
            Typing
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs bg-black/40 px-2 py-0.5 rounded-lg border border-white/5 font-mono">
          <div className="flex items-center gap-1">
            <button
              onClick={() => { setGameMode("time"); }}
              className={`flex cursor-pointer items-center gap-1 px-1.5 py-0.5 rounded transition-colors ${
                gameMode === "time" ? "text-sky-400 font-bold bg-white/10" : "text-white/40 hover:text-white"
              }`}
            >
              <Clock className="w-3 h-3" /> time
            </button>
            <button
              onClick={() => { setGameMode("words"); }}
              className={`flex cursor-pointer items-center gap-1 px-1.5 py-0.5 rounded transition-colors ${
                gameMode === "words" ? "text-sky-400 font-bold bg-white/10" : "text-white/40 hover:text-white"
              }`}
            >
              <Type className="w-3 h-3" /> words
            </button>
          </div>

          <span className="text-white/20">|</span>

          <div className="flex items-center gap-1">
            {gameMode === "time"
              ? TIME_OPTIONS.map((sec) => (
                  <button
                    key={sec}
                    onClick={() => setTimeLimit(sec)}
                    className={`cursor-pointer px-1.5 py-0.5 rounded transition-colors ${
                      timeLimit === sec ? "text-sky-400 font-bold bg-white/10" : "text-white/40 hover:text-white"
                    }`}
                  >
                    {sec}s
                  </button>
                ))
              : WORD_OPTIONS.map((count) => (
                  <button
                    key={count}
                    onClick={() => setWordLimit(count)}
                    className={`cursor-pointer px-1.5 py-0.5 rounded transition-colors ${
                      wordLimit === count ? "text-sky-400 font-bold bg-white/10" : "text-white/40 hover:text-white"
                    }`}
                  >
                    {count}
                  </button>
                ))}
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1 text-sky-400">
            <Trophy className="w-3 h-3" />
            <span>{bestWpm} WPM</span>
          </div>

          {gameMode === "time" ? (
            <div className="text-white/60">
              <span className="text-white font-bold">{timeLeft}s</span>
            </div>
          ) : (
            <div className="text-white/60">
              <span className="text-white font-bold">{currentWordIdx}</span>/{wordLimit}
            </div>
          )}

          {isRunning && (
            <div className="text-emerald-400 font-bold">
              {liveWpm} WPM
            </div>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="text"
        value={currentInput}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        className="opacity-0 absolute pointer-events-none"
      />

      <div className="flex-1 flex flex-col justify-center items-center px-4 py-3 min-h-0">
        {isLoading ? (
          <div className="flex items-center gap-2 text-white/40 text-sm font-mono">
            <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
            <span>Načítavam slová...</span>
          </div>
        ) : isFinished ? (
          <div className="flex flex-col items-center gap-3 animate-in fade-in zoom-in-95">
            <div className="text-5xl font-extrabold text-sky-400 font-mono">
              {finalWpm} <span className="text-sm font-sans text-white/60">WPM</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-white/70">
              <div>Presnosť: <span className="text-emerald-400 font-bold">{finalAccuracy}%</span></div>
              <Dot className="text-sky-500"/>
              <div>Čas: <span className="text-white font-bold">{totalGameDuration}s</span></div>
              <Dot className="text-sky-500"/>
              <div>Správne znaky: <span className="text-white font-bold">{totalCorrectChars}</span></div>
            </div>
            <button
              onClick={initGame}
              className="cursor-pointer mt-2 px-4 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-black font-semibold text-xs flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Znova (Enter)
            </button>
          </div>
        ) : (
          <div className="w-full flex flex-wrap gap-x-3 gap-y-2.5 text-xl font-mono leading-relaxed select-none overflow-hidden max-h-[220px]">
            {words.map((word, wIdx) => {
              const isCurrent = wIdx === currentWordIdx;
              const isPast = wIdx < currentWordIdx;
              const pastInput = charHistory[wIdx];

              return (
                <div key={wIdx} className="flex relative">
                  {word.split("").map((char, cIdx) => {
                    const isCaretHere = isCurrent && cIdx === currentInput.length;

                    let color = "text-white/50";

                    if (isCurrent) {
                      if (cIdx < currentInput.length) {
                        color = currentInput[cIdx] === char
                          ? "text-zinc-100 font-medium"
                          : "text-red-400 bg-red-500/20 rounded-sm";
                      }
                    } else if (isPast) {
                      if (pastInput && cIdx < pastInput.length) {
                        color = pastInput[cIdx] === char ? "text-zinc-100" : "text-red-400";
                      } else {
                        color = "text-zinc-100";
                      }
                    }

                    return (
                      <span key={cIdx} className={`relative ${color}`}>
                        {isCaretHere && (
                          <span className="absolute -left-[1.5px] top-[15%] bottom-[15%] w-[2.5px] bg-sky-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                        )}
                        {char}
                      </span>
                    );
                  })}

                  {isCurrent && currentInput.length > word.length && (
                    <>
                      {currentInput.slice(word.length).split("").map((extraChar, extraIdx) => (
                        <span key={`extra-${extraIdx}`} className="text-red-400/80 bg-red-500/20">
                          {extraChar}
                        </span>
                      ))}
                    </>
                  )}

                  {isCurrent && currentInput.length >= word.length && (
                    <span className="relative inline-block w-0">
                      <span className="absolute -left-[1.5px] top-[15%] bottom-[15%] w-[2.5px] bg-sky-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div
        className="mt-2 pt-2 border-t flex items-center justify-between text-xs select-none"
        style={{ borderColor: "var(--border-divider)", color: "var(--text-secondary)" }}
      >
        <div className="text-[11px] opacity-70 text-sky-500">
            {gameMode === "time" ? `Režim času: ${timeLimit} sekúnd` : `Režim slov: ${wordLimit} slov`} 
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={initGame}
            className="cursor-pointer flex items-center gap-1 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded text-[10px] bg-white/10 font-mono">esc</kbd>
            <span>Ukončiť</span>
          </span>
        </div>
      </div>
    </div>
  );
}