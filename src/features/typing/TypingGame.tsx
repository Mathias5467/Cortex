import { useEffect, useState, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { RotateCcw, Trophy, Clock, Type, Loader2, Keyboard, Dot } from "lucide-react";
import { useLauncher } from "@/core/launcher";
import { Button } from "@/components/ui/Button";
import { KeyHint } from "@/components/ui/Kbd";
import { SegmentButton } from "@/components/ui/SegmentButton";
import { ViewFooter, ViewHeader } from "@/components/ui/View";
import { fetchWords } from "./words";

type GameMode = "time" | "words";

const TIME_OPTIONS = [15, 30, 60, 90] as const;
const WORD_OPTIONS = [10, 25, 50, 100] as const;

function Caret() {
  return (
    <span className="absolute -left-[1.5px] top-[15%] bottom-[15%] w-[2.5px] bg-accent rounded-full animate-pulse shadow-[0_0_8px_var(--color-accent)]" />
  );
}

export function TypingGame() {
  const { goBack } = useLauncher();
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

  async function initGame() {
    setIsLoading(true);
    const count = gameMode === "time" ? Math.max(timeLimit * 2, 50) : wordLimit;
    const fetched = await fetchWords(count);

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
          setTimeLeft((prev) => Math.max(0, prev - 1));
        } else {
          setElapsedSeconds((prev) => prev + 1);
        }
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [isRunning, isFinished, gameMode, timeLimit]);

  useEffect(() => {
    if (gameMode === "time" && isRunning && timeLeft === 0) {
      finishGame(timeLimit, totalCorrectChars, totalCharsTyped);
    }
  }, [gameMode, isRunning, timeLeft]);

  function finishGame(durationSec: number, correctChars: number, typedChars: number) {
    setIsRunning(false);
    setIsFinished(true);

    const safeSec = Math.max(durationSec, 1);
    const finalWpm = Math.round((correctChars / 5) / (safeSec / 60));
    const accuracy = typedChars > 0 ? Math.round((correctChars / typedChars) * 100) : 0;

    invoke("save_typing_result", { wpm: finalWpm, accuracy }).catch(() => {});
    if (finalWpm > bestWpm) {
      setBestWpm(finalWpm);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      goBack();
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
        finishGame(elapsedSeconds || 1, newCorrect, newTyped);
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
      <ViewHeader onBack={goBack} icon={Keyboard} title="Typing">
        <div className="flex items-center gap-2 text-xs bg-well px-2 py-0.5 rounded-lg border border-line font-mono">
          <div className="flex items-center gap-1">
            <SegmentButton isActive={gameMode === "time"} onClick={() => setGameMode("time")}>
              <Clock className="w-3 h-3" /> time
            </SegmentButton>
            <SegmentButton isActive={gameMode === "words"} onClick={() => setGameMode("words")}>
              <Type className="w-3 h-3" /> words
            </SegmentButton>
          </div>

          <span className="text-faint">|</span>

          <div className="flex items-center gap-1">
            {gameMode === "time"
              ? TIME_OPTIONS.map((sec) => (
                  <SegmentButton key={sec} isActive={timeLimit === sec} onClick={() => setTimeLimit(sec)}>
                    {sec}s
                  </SegmentButton>
                ))
              : WORD_OPTIONS.map((count) => (
                  <SegmentButton key={count} isActive={wordLimit === count} onClick={() => setWordLimit(count)}>
                    {count}
                  </SegmentButton>
                ))}
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono ml-3">
          <div className="flex items-center gap-1 text-accent">
            <Trophy className="w-3 h-3" />
            <span>{bestWpm} WPM</span>
          </div>

          <div className="text-secondary">
            <span className="text-content font-bold">{gameMode === "time" ? `${timeLeft}s` : currentWordIdx}</span>
            {gameMode === "words" && `/${wordLimit}`}
          </div>

          {isRunning && <div className="text-content font-bold">{liveWpm} WPM</div>}
        </div>
      </ViewHeader>

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
          <div className="flex items-center gap-2 text-muted text-sm font-mono">
            <Loader2 className="w-4 h-4 animate-spin text-accent" />
            <span>Načítavam slová...</span>
          </div>
        ) : isFinished ? (
          <div className="flex flex-col items-center gap-3 animate-in fade-in zoom-in-95">
            <div className="text-5xl font-extrabold text-accent font-mono">
              {finalWpm} <span className="text-sm font-sans text-secondary">WPM</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-secondary">
              <div>Presnosť: <span className="text-accent font-bold">{finalAccuracy}%</span></div>
              <Dot className="text-accent"/>
              <div>Čas: <span className="text-content font-bold">{totalGameDuration}s</span></div>
              <Dot className="text-accent"/>
              <div>Správne znaky: <span className="text-content font-bold">{totalCorrectChars}</span></div>
            </div>
            <Button size="md" className="mt-2" onClick={initGame}>
              <RotateCcw className="w-3.5 h-3.5" />
              Znova (Enter)
            </Button>
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

                    let color = "text-muted";

                    if (isCurrent) {
                      if (cIdx < currentInput.length) {
                        color = currentInput[cIdx] === char
                          ? "text-content font-medium"
                          : "text-danger bg-danger/20 rounded-sm";
                      }
                    } else if (isPast) {
                      if (pastInput && cIdx < pastInput.length) {
                        color = pastInput[cIdx] === char ? "text-content" : "text-danger";
                      } else {
                        color = "text-content";
                      }
                    }

                    return (
                      <span key={cIdx} className={`relative ${color}`}>
                        {isCaretHere && (
                          <Caret />
                        )}
                        {char}
                      </span>
                    );
                  })}

                  {isCurrent && currentInput.length > word.length && (
                    <>
                      {currentInput.slice(word.length).split("").map((extraChar, extraIdx) => (
                        <span key={`extra-${extraIdx}`} className="text-danger/80 bg-danger/20">
                          {extraChar}
                        </span>
                      ))}
                    </>
                  )}

                  {isCurrent && currentInput.length >= word.length && (
                    <span className="relative inline-block w-0">
                      <Caret />
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ViewFooter label={gameMode === "time" ? `Režim času: ${timeLimit} sekúnd` : `Režim slov: ${wordLimit} slov`}>
        <button
          type="button"
          onClick={initGame}
          className="cursor-pointer flex items-center gap-1 hover:text-content transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
        <KeyHint keys={["esc"]} label="Ukončiť" />
      </ViewFooter>
    </div>
  );
}
