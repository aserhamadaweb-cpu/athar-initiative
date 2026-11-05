"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, type PointerEvent } from "react";

type Seed = { id: number; x: number; y: number; speed: number };

const DURATION = 32;
const BEST_KEY = "athar-best";

export function ImpactGame() {
  const t = useTranslations("game");
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [player, setPlayer] = useState(50);
  const [seeds, setSeeds] = useState<Seed[]>([]);
  const playerRef = useRef(50);
  const seedsRef = useRef<Seed[]>([]);
  const scoreRef = useRef(0);
  const keys = useRef({ left: false, right: false });

  useEffect(() => {
    const stored = Number(window.localStorage.getItem(BEST_KEY) || 0);
    if (Number.isFinite(stored)) setBest(stored);
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent, pressed: boolean) {
      if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") keys.current.left = pressed;
      if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") keys.current.right = pressed;
    }
    const down = (event: KeyboardEvent) => onKey(event, true);
    const up = (event: KeyboardEvent) => onKey(event, false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  useEffect(() => {
    if (!running) return;
    let frame = 0;
    let last = performance.now();
    let spawn = 0;
    let nextId = 1;

    const tick = (now: number) => {
      const dt = Math.min(34, now - last);
      last = now;
      if (keys.current.left) playerRef.current = Math.max(8, playerRef.current - dt * 0.05);
      if (keys.current.right) playerRef.current = Math.min(92, playerRef.current + dt * 0.05);

      spawn += dt;
      if (spawn > 760) {
        spawn = 0;
        seedsRef.current.push({
          id: nextId,
          x: 10 + Math.random() * 80,
          y: -8,
          speed: 0.02 + Math.random() * 0.016,
        });
        nextId += 1;
      }

      const alive: Seed[] = [];
      let gained = 0;
      for (const seed of seedsRef.current) {
        const y = seed.y + seed.speed * dt;
        const caught = y > 76 && y < 92 && Math.abs(seed.x - playerRef.current) < 8;
        if (caught) {
          gained += 1;
          continue;
        }
        if (y < 108) alive.push({ ...seed, y });
      }
      seedsRef.current = alive;
      if (gained) {
        scoreRef.current += gained;
        setScore(scoreRef.current);
      }
      setPlayer(playerRef.current);
      setSeeds(alive);
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    const timer = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          setRunning(false);
          setFinished(true);
          const finalScore = scoreRef.current;
          setBest((previous) => {
            const next = Math.max(previous, finalScore);
            window.localStorage.setItem(BEST_KEY, String(next));
            return next;
          });
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => {
      cancelAnimationFrame(frame);
      window.clearInterval(timer);
    };
  }, [running]);

  function begin() {
    scoreRef.current = 0;
    seedsRef.current = [];
    playerRef.current = 50;
    setScore(0);
    setSeeds([]);
    setPlayer(50);
    setTimeLeft(DURATION);
    setFinished(false);
    setRunning(true);
  }

  function hold(side: "left" | "right", pressed: boolean, event?: PointerEvent<HTMLButtonElement>) {
    keys.current[side] = pressed;
    if (pressed && event) event.currentTarget.setPointerCapture(event.pointerId);
  }

  return (
    <div>
      <div className="mb-4 grid grid-cols-3 gap-2 text-center text-sm font-bold">
        <span className="panel px-2 py-2">{t("score")}: {score}</span>
        <span className="panel px-2 py-2">{t("time")}: {timeLeft}</span>
        <span className="panel px-2 py-2">{t("best")}: {best}</span>
      </div>
      <div className="garden" aria-live="polite">
        {seeds.map((seed) => (
          <span key={seed.id} className="seed" style={{ left: `${seed.x}%`, top: `${seed.y}%` }} />
        ))}
        <span className="seedling" style={{ left: `${player}%`, bottom: 18 }}>
          <svg width="54" height="78" viewBox="0 0 54 78" aria-hidden="true">
            <path d="M27 74c1-18 1-32 0-46" stroke="#2d7a45" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M26 48c-16-4-24 2-26 12 12 0 20-2 26-12z" fill="#3f8d52" />
            <path d="M28 40c14-8 24-2 26 8-12 2-18 0-26-8z" fill="#2d7a45" />
            <circle cx="27" cy="18" r="8" fill="#1a2764" />
          </svg>
        </span>
        {!running ? (
          <div className="absolute inset-0 grid content-center justify-items-center gap-3 bg-paper/70 px-6 text-center backdrop-blur-sm">
            <p className="display text-3xl">{finished ? t("win") : t("title")}</p>
            <p className="max-w-md text-muted">{finished ? `${t("score")}: ${score}` : t("hint")}</p>
            <button type="button" className="btn btn-primary" onClick={begin}>
              {finished ? t("again") : t("start")}
            </button>
          </div>
        ) : (
          <p className="absolute inset-x-0 top-4 text-center text-sm font-bold">{t("playing")}</p>
        )}
      </div>
      <div className="game-controls mt-4 grid grid-cols-2 gap-3" dir="ltr">
        <button
          type="button"
          className="btn btn-line min-h-14 touch-none select-none text-base"
          onPointerDown={(event) => hold("left", true, event)}
          onPointerUp={(event) => hold("left", false, event)}
          onPointerCancel={(event) => hold("left", false, event)}
        >
          {t("left")}
        </button>
        <button
          type="button"
          className="btn btn-line min-h-14 touch-none select-none text-base"
          onPointerDown={(event) => hold("right", true, event)}
          onPointerUp={(event) => hold("right", false, event)}
          onPointerCancel={(event) => hold("right", false, event)}
        >
          {t("right")}
        </button>
      </div>
    </div>
  );
}
