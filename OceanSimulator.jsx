"use client";

import { useEffect, useRef, useState } from "react";
import {
  MAX_DEBRIS,
  MAX_SIM_YEARS,
  MAX_TICK,
  MILESTONES,
  SPEED_OPTIONS,
  WASTE_TYPES,
  formatSimTime,
  getDecayStage,
  tickToYears,
  yearsToTick,
} from "./data/wasteTypes";
import { CrescentMoon, Fish, Icon, WasteIllustration } from "./components/WasteIllustration";
import ComparisonBoard from "./components/ComparisonBoard";

const ZONE_POSITIONS = {
  surface: [
    { left: 12, bottom: 53, rotation: -8 },
    { left: 28, bottom: 55, rotation: 6 },
    { left: 45, bottom: 52, rotation: -5 },
    { left: 62, bottom: 54, rotation: 9 },
    { left: 78, bottom: 53, rotation: -7 },
    { left: 88, bottom: 55, rotation: 5 },
  ],
  midwater: [
    { left: 16, bottom: 38, rotation: -12 },
    { left: 34, bottom: 33, rotation: 10 },
    { left: 52, bottom: 41, rotation: -6 },
    { left: 68, bottom: 35, rotation: 13 },
    { left: 83, bottom: 39, rotation: -9 },
    { left: 24, bottom: 44, rotation: 7 },
  ],
  sink: [
    { left: 14, bottom: 18, rotation: -14 },
    { left: 30, bottom: 15, rotation: 9 },
    { left: 48, bottom: 19, rotation: -7 },
    { left: 65, bottom: 16, rotation: 12 },
    { left: 80, bottom: 18, rotation: -10 },
    { left: 39, bottom: 14, rotation: 6 },
  ],
};

function makeBatch(wasteType, offset, amount, addedAtYears, nextIdRef) {
  const pool = ZONE_POSITIONS[wasteType.buoyancy] ?? ZONE_POSITIONS.midwater;
  return Array.from({ length: amount }, (_, index) => {
    const slot = pool[(offset + index) % pool.length];
    const id = `waste-${++nextIdRef.current}`;
    const jitterLeft = ((offset + index) % 3 - 1) * 2.2;
    const jitterBottom = ((offset + index) % 2 === 0 ? 1 : -1) * 1.5;
    return {
      id,
      type: wasteType.id,
      addedAtYears,
      left: Math.max(8, Math.min(90, slot.left + jitterLeft)),
      bottom: Math.max(12, Math.min(57, slot.bottom + jitterBottom)),
      rotation: slot.rotation,
      size: 44 + ((offset + index) % 3) * 5,
      delay: ((offset + index) % 6) * -0.45,
      isNew: true,
    };
  });
}

function FlipClock({ formatted }) {
  return (
    <div className="flip-clock" aria-label={`Waktu simulasi: ${formatted.value} ${formatted.longUnit}`}>
      <div className="flip-digits" key={`${formatted.padded}-${formatted.unit}`}>
        {formatted.padded.split("").map((digit, index) => (
          <span className="flip-tile" key={`${index}-${digit}`}>
            <span className="flip-tile-value">{digit}</span>
          </span>
        ))}
      </div>
      <span className="flip-unit">{formatted.unit}</span>
    </div>
  );
}

export default function OceanSimulator() {
  const [selectedId, setSelectedId] = useState("bottle");
  const [simYears, setSimYears] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [speakingId, setSpeakingId] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [debris, setDebris] = useState([]);
  const [notice, setNotice] = useState("Pilih jenis sampah untuk menjatuhkannya ke laut.");

  const sceneRef = useRef(null);
  const audioRef = useRef({ context: null, source: null, gain: null });
  const audioSessionRef = useRef(0);
  const fadeTimeoutRef = useRef(null);
  const speechTokenRef = useRef(0);
  const nextIdRef = useRef(0);
  const simYearsRef = useRef(0);
  const speedRef = useRef(1);
  const splashTimeoutRef = useRef(null);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    simYearsRef.current = simYears;
  }, [simYears]);

  const selected = WASTE_TYPES.find((item) => item.id === selectedId) ?? WASTE_TYPES[0];
  const sliderTick = yearsToTick(simYears);
  const formattedTime = formatSimTime(simYears);
  const timelineProgress = (sliderTick / MAX_TICK) * 100;

  // Smooth non-strobing day/sunset/night/sunrise cycle driven by sliderTick (4 cycles across 0..1000)
  const cyclePhase = (sliderTick % 250) / 250;
  const isNight = cyclePhase >= 0.44 && cyclePhase < 0.9;
  const isTwilight = (cyclePhase >= 0.34 && cyclePhase < 0.48) || (cyclePhase >= 0.84 && cyclePhase < 0.96);
  const sunArcProgress = isNight ? 1 : Math.min(1, cyclePhase / 0.44);
  const sunLeft = 18 + sunArcProgress * 64;
  const sunTop = 34 - Math.sin(sunArcProgress * Math.PI) * 24;

  const selectedItems = debris.filter((item) => item.type === selected.id);
  const matchingCount = selectedItems.length;
  const oldestSelectedAge = selectedItems.reduce(
    (maxAge, item) => Math.max(maxAge, Math.max(0, simYears - item.addedAtYears)),
    Math.max(0, simYears),
  );
  const selectedDecay = Math.min(1, oldestSelectedAge / selected.durationYears);
  const selectedStage = getDecayStage(selectedDecay, selected);
  const hasReachedEnd = simYears >= MAX_SIM_YEARS;
  const pollutionLevel = Math.min(1, debris.length / MAX_DEBRIS);

  const insightText =
    selectedItems.length > 0 && selectedDecay >= 1
      ? selected.endMode === "microplastic"
        ? `${selected.name} sudah pecah menjadi mikroplastik yang tetap mencemari laut (${selected.durationLabel}).`
        : `${selected.name} telah mencapai perkiraan waktu urainya (${selected.durationLabel}).`
      : selected.fact;

  // rAF simulation loop throttled to ~15fps (65ms) for smooth FlipClock & zero timer churn
  useEffect(() => {
    if (!isRunning) return undefined;

    let rafId = 0;
    let lastFrame = performance.now();
    let lastCommit = lastFrame;

    const step = (now) => {
      const dt = Math.min(50, now - lastFrame);
      lastFrame = now;

      const currentTick = yearsToTick(simYearsRef.current);
      const tickPerSec = 55 * speedRef.current;
      const nextTick = Math.min(MAX_TICK, currentTick + (dt / 1000) * tickPerSec);
      const nextYears = tickToYears(nextTick);
      simYearsRef.current = nextYears;

      if (nextTick >= MAX_TICK) {
        setSimYears(MAX_SIM_YEARS);
        setIsRunning(false);
        setNotice("Simulasi mencapai 500 tahun. Lihat perbandingan sampah yang masih bertahan!");
        return;
      }

      if (now - lastCommit >= 65) {
        lastCommit = now;
        setSimYears(nextYears);
      }

      rafId = window.requestAnimationFrame(step);
    };

    rafId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(rafId);
  }, [isRunning]);

  useEffect(() => {
    function syncFullscreen() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreen);
      audioSessionRef.current += 1;
      if (fadeTimeoutRef.current) window.clearTimeout(fadeTimeoutRef.current);
      if (splashTimeoutRef.current) window.clearTimeout(splashTimeoutRef.current);
      window.speechSynthesis?.cancel?.();
      const { context, source } = audioRef.current;
      if (source) {
        try {
          source.stop();
        } catch {
          /* Audio may already be stopped. */
        }
      }
      if (context && context.state !== "closed") context.close().catch(() => {});
    };
  }, []);

  function speak(text, id) {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
      setNotice("Fitur narasi belum tersedia di browser ini.");
      return;
    }
    if (speakingId === id) {
      speechTokenRef.current += 1;
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }
    const token = ++speechTokenRef.current;
    window.speechSynthesis.cancel();
    const utterance = new window.SpeechSynthesisUtterance(text);
    utterance.lang = "id-ID";
    utterance.rate = 0.94;
    setSpeakingId(id);
    utterance.onend = () => {
      if (speechTokenRef.current === token) setSpeakingId(null);
    };
    utterance.onerror = () => {
      if (speechTokenRef.current === token) setSpeakingId(null);
    };
    window.speechSynthesis.speak(utterance);
  }

  function addWaste(waste) {
    setSelectedId(waste.id);
    const amount = Math.min(5, MAX_DEBRIS - debris.length);
    if (amount <= 0) {
      setNotice(`Laut sudah penuh (${MAX_DEBRIS}/${MAX_DEBRIS}). Atur ulang untuk mengulang.`);
      return;
    }

    const batch = makeBatch(waste, debris.length, amount, simYears, nextIdRef);
    setDebris((current) => [...current, ...batch]);
    setNotice(`${amount} ${waste.name.toLowerCase()} dijatuhkan ke laut.`);

    if (splashTimeoutRef.current) window.clearTimeout(splashTimeoutRef.current);
    splashTimeoutRef.current = window.setTimeout(() => {
      setDebris((current) =>
        current.map((item) => (item.isNew ? { ...item, isNew: false } : item)),
      );
    }, 780);
  }

  async function toggleSound() {
    const session = ++audioSessionRef.current;
    if (fadeTimeoutRef.current) {
      window.clearTimeout(fadeTimeoutRef.current);
      fadeTimeoutRef.current = null;
    }

    if (soundEnabled) {
      const { context, source, gain } = audioRef.current;
      if (context && context.state !== "closed" && gain) {
        gain.gain.setTargetAtTime(0, context.currentTime, 0.12);
        fadeTimeoutRef.current = window.setTimeout(() => {
          fadeTimeoutRef.current = null;
          if (source && context.state !== "closed") {
            try {
              source.stop();
            } catch {
              /* Source may already be stopped. */
            }
          }
          if (context.state !== "closed") context.close().catch(() => {});
          if (audioSessionRef.current === session) {
            audioRef.current = { context: null, source: null, gain: null };
          }
        }, 480);
      } else {
        audioRef.current = { context: null, source: null, gain: null };
      }
      setSoundEnabled(false);
      setNotice("Suara ombak dimatikan.");
      return;
    }

    const prev = audioRef.current;
    if (prev.source) {
      try {
        prev.source.stop();
      } catch {
        /* Previous source may already be stopped. */
      }
    }
    if (prev.context && prev.context.state !== "closed") prev.context.close().catch(() => {});
    audioRef.current = { context: null, source: null, gain: null };

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) throw new Error("Suara ombak tidak tersedia di browser ini.");
      const context = new AudioContextClass();
      await context.resume();
      if (audioSessionRef.current !== session) {
        if (context.state !== "closed") context.close().catch(() => {});
        return;
      }
      const buffer = context.createBuffer(1, context.sampleRate * 3, context.sampleRate);
      const samples = buffer.getChannelData(0);
      for (let index = 0; index < samples.length; index += 1) samples[index] = (Math.random() * 2 - 1) * 0.22;
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      const lowPass = context.createBiquadFilter();
      lowPass.type = "lowpass";
      lowPass.frequency.value = 420;
      const gain = context.createGain();
      gain.gain.setValueAtTime(0, context.currentTime);
      gain.gain.linearRampToValueAtTime(0.045, context.currentTime + 0.7);
      source.connect(lowPass).connect(gain).connect(context.destination);
      source.start();
      audioRef.current = { context, source, gain };
      setSoundEnabled(true);
      setNotice("Suara ombak diaktifkan.");
    } catch (error) {
      setNotice(error.message || "Suara tidak dapat diputar.");
    }
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen?.();
      else if (sceneRef.current?.requestFullscreen) await sceneRef.current.requestFullscreen();
      else setNotice("Mode layar penuh tidak didukung di browser ini.");
    } catch {
      setNotice("Mode layar penuh tidak didukung di browser ini.");
    }
  }

  function resetSimulation() {
    setIsRunning(false);
    setSelectedId("bottle");
    setSimYears(0);
    simYearsRef.current = 0;
    setDebris([]);
    speechTokenRef.current += 1;
    window.speechSynthesis?.cancel?.();
    setSpeakingId(null);
    setNotice("Simulasi diatur ulang. Laut kembali bersih.");
  }

  function toggleTime() {
    if (isRunning) {
      setIsRunning(false);
      setNotice("Waktu dijeda.");
      return;
    }
    if (debris.length === 0) {
      setNotice("Pilih jenis sampah terlebih dahulu untuk menjatuhkannya ke laut.");
      return;
    }
    if (hasReachedEnd) {
      setSimYears(0);
      simYearsRef.current = 0;
    }
    setIsRunning(true);
    setNotice(`Waktu berjalan (${speed}x). Amati perubahan siang, malam, dan kondisi sampah.`);
  }

  function jumpToYears(years, label) {
    setIsRunning(false);
    setSimYears(years);
    simYearsRef.current = years;
    setNotice(`Waktu dilompatkan ke ${label === "0" ? "awal (0)" : label}.`);
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Ocean Time, beranda">
          <span className="brand-mark">
            <Icon name="wave" size={26} />
          </span>
          <span className="brand-copy">
            <span className="brand-name">ocean<span>time</span></span>
            <span className="brand-caption">LABORATORIUM LAUT</span>
          </span>
        </a>

        <div className="topbar-actions">
          <span className="topbar-label"><span className="status-dot" /> SIMULASI INTERAKTIF</span>
          <button
            className={`icon-button sound-button ${soundEnabled ? "is-on" : ""}`}
            type="button"
            aria-label={soundEnabled ? "Matikan suara ombak" : "Nyalakan suara ombak"}
            aria-pressed={soundEnabled}
            onClick={toggleSound}
            title={soundEnabled ? "Matikan suara ombak" : "Nyalakan suara ombak"}
          >
            <Icon name={soundEnabled ? "sound" : "soundOff"} />
          </button>
          <button className="reset-button" type="button" onClick={resetSimulation}>
            <Icon name="reset" size={16} />
            <span>Atur ulang</span>
          </button>
        </div>
      </header>

      <section className="intro" id="top" aria-labelledby="page-title">
        <div className="intro-copy">
          <p className="eyebrow"><span className="eyebrow-line" /> MISI EKOLOGI <span className="eyebrow-number">01</span></p>
          <h1 id="page-title">Sampah di laut,<br className="desktop-break" /> <span>ceritanya panjang.</span></h1>
          <p className="intro-description">
            Jatuhkan berbagai jenis sampah ke laut, lalu percepat waktu hingga 500 tahun untuk melihat mana yang cepat hancur dan mana yang bertahan.
          </p>
        </div>
        <div className="intro-stamp" aria-label="Fokus pembelajaran: waktu urai sampah">
          <span className="stamp-top">FOKUS HARI INI</span>
          <span className="stamp-bottom"><Icon name="leaf" size={16} /> WAKTU URAI SAMPAH</span>
        </div>
      </section>

      <div className="workspace">
        <section className="simulation-panel panel" aria-labelledby="scene-heading">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">RUANG SIMULASI</p>
              <h2 id="scene-heading">Teluk kecil</h2>
            </div>
            <div className="scene-heading-actions">
              <div className={`scene-live ${isRunning ? "is-active" : ""}`}>
                <span className="live-pulse" /> {isRunning ? "BERJALAN" : "SIAP"}
              </div>
              <button
                className={`narrate-button ${speakingId === "intro" ? "is-speaking" : ""}`}
                type="button"
                onClick={() =>
                  speak(
                    "Sampah di laut butuh waktu yang berbeda untuk terurai. Pilih jenis sampah untuk menjatuhkannya ke laut, lalu putar waktu hingga lima ratus tahun.",
                    "intro",
                  )
                }
                aria-label="Dengarkan pengantar simulasi"
                aria-pressed={speakingId === "intro"}
                title="Dengarkan pengantar"
              >
                <Icon name="sound" size={18} />
              </button>
              <button
                className="expand-button"
                type="button"
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? "Keluar dari layar penuh" : "Perbesar simulasi"}
                title={isFullscreen ? "Keluar dari layar penuh" : "Perbesar simulasi"}
              >
                <Icon name={isFullscreen ? "shrink" : "expand"} size={17} />
              </button>
            </div>
          </div>

          <div
            ref={sceneRef}
            className={`ocean-scene ${isNight ? "is-night" : ""} ${isTwilight ? "is-twilight" : ""} ${isRunning ? "is-playing" : ""}`}
            style={{ "--pollution-level": String(pollutionLevel) }}
            aria-label={`Pemandangan laut ${isNight ? "malam" : "siang"} dengan ${debris.length} benda sampah`}
          >
            <div className="scene-sky" />
            <div className="scene-sun-glow" style={{ left: `${sunLeft}%`, top: `${sunTop}%` }} />
            <div
              className="celestial-body"
              style={{ left: `${sunLeft}%`, top: `${sunTop}%` }}
              aria-hidden="true"
            >
              {isNight ? <CrescentMoon /> : <span className="sun-rays" />}
            </div>
            <div className="scene-cloud scene-cloud-one" aria-hidden="true" />
            <div className="scene-cloud scene-cloud-two" aria-hidden="true" />
            <div className="scene-stars" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>
            <div className="far-shore" aria-hidden="true" />

            <div className="scene-water">
              <div className="water-caustics" aria-hidden="true" />
              <div className="water-glimmer water-glimmer-one" />
              <div className="water-glimmer water-glimmer-two" />
              <div className="water-wave wave-one" />
              <div className="water-wave wave-two" />
              <div className="water-bubbles" aria-hidden="true"><i /><i /><i /><i /><i /></div>
            </div>
            <div className="scene-depth" aria-hidden="true" />
            <div className="sea-floor" aria-hidden="true" />
            <div className="coral-reef" aria-hidden="true"><i /><i /><i /></div>
            <div className="seaweed seaweed-left" aria-hidden="true"><i /><i /><i /></div>
            <div className="seaweed seaweed-right" aria-hidden="true"><i /><i /><i /></div>
            <Fish className="scene-fish scene-fish-one" />
            <Fish className="scene-fish scene-fish-two" />

            <div className="scene-time-card">
              <span className="scene-time-label">WAKTU BERJALAN</span>
              <FlipClock formatted={formattedTime} />
              <span className="scene-time-progress"><i style={{ width: `${timelineProgress}%` }} /></span>
            </div>

            <div className="scene-phase-pill">
              <Icon name={isNight ? "moon" : "sun"} size={15} />
              <span>{isNight ? "MALAM TENANG" : isTwilight ? "SENJA" : "SIANG CERAH"}</span>
            </div>

            {isFullscreen && (
              <button
                className="expand-button scene-exit-fullscreen"
                type="button"
                onClick={toggleFullscreen}
                aria-label="Keluar dari layar penuh"
                title="Keluar dari layar penuh"
              >
                <Icon name="shrink" size={18} />
              </button>
            )}

            <div className="scene-object-count">
              <span className="count-dot" /> {debris.length}/{MAX_DEBRIS} BENDA
            </div>

            {debris.map((item, index) => {
              const itemType = WASTE_TYPES.find((waste) => waste.id === item.type) ?? WASTE_TYPES[0];
              const itemAge = Math.max(0, simYears - item.addedAtYears);
              const decay = Math.min(1, itemAge / itemType.durationYears);
              const stage = getDecayStage(decay, itemType);
              const opacity =
                stage.key === "dissolved"
                  ? 0.08
                  : stage.key === "microplastic"
                    ? 0.42
                    : Math.max(0.45, 1 - decay * 0.45);

              return (
                <div
                  className={`floating-waste buoyancy-${itemType.buoyancy} stage-${stage.tone} ${item.isNew ? "is-entering" : ""}`}
                  key={item.id}
                  style={{
                    left: `${item.left}%`,
                    bottom: `${item.bottom}%`,
                    width: `${item.size}px`,
                    height: `${item.size}px`,
                    animationDelay: `${item.delay}s`,
                    "--waste-rot": `${item.rotation}deg`,
                    "--waste-opacity": String(opacity),
                    zIndex: 5 + (index % 3),
                  }}
                  aria-hidden="true"
                >
                  {item.isNew && <span className="water-splash" />}
                  <WasteIllustration type={item.type} />
                  {stage.key === "microplastic" && (
                    <span className="microplastic-specks"><i /><i /><i /></span>
                  )}
                </div>
              );
            })}

            {debris.length === 0 && (
              <div className="scene-empty-prompt">
                <span className="prompt-spark"><Icon name="plus" size={15} /></span>
                <span>Pilih sampah untuk<br />menjatuhkannya ke laut</span>
              </div>
            )}

            <div className="scene-caption"><span>LAUT TERBUKA</span><i /> TELUK NUSANTARA</div>
          </div>

          <div className="timeline-controls">
            <div className="timeline-topline">
              <div className="timeline-label-group">
                <span className="timeline-icon"><Icon name="wave" size={17} /></span>
                <div>
                  <p className="section-kicker">PERCEPAT WAKTU</p>
                  <span className="timeline-readout">
                    {formattedTime.prefix} <strong>{formattedTime.value}</strong> <small>{formattedTime.longUnit}</small>
                  </span>
                </div>
              </div>

              <div className="timeline-actions">
                <div className="speed-group" role="group" aria-label="Kecepatan simulasi">
                  {SPEED_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`speed-pill ${speed === opt.value ? "is-active" : ""}`}
                      aria-pressed={speed === opt.value}
                      onClick={() => setSpeed(opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <button
                  className={`play-button ${isRunning ? "is-running" : ""} ${debris.length === 0 ? "is-idle" : ""}`}
                  type="button"
                  onClick={toggleTime}
                  aria-pressed={isRunning}
                >
                  <Icon name={isRunning ? "pause" : "play"} size={17} />
                  <span>{isRunning ? "Jeda waktu" : hasReachedEnd ? "Ulangi" : "Putar waktu"}</span>
                </button>
              </div>
            </div>

            <p className="status-notice" role="status" aria-live="polite">{notice}</p>

            <label className="range-label" htmlFor="time-range">Geser garis waktu atau pilih lompatan waktu</label>
            <input
              className="time-range"
              id="time-range"
              type="range"
              min="0"
              max={MAX_TICK}
              step="1"
              disabled={debris.length === 0}
              value={Math.round(sliderTick)}
              onChange={(event) => {
                const nextYears = tickToYears(Number(event.target.value));
                setSimYears(nextYears);
                simYearsRef.current = nextYears;
                setIsRunning(false);
                const nextFormatted = formatSimTime(nextYears);
                setNotice(`Waktu diatur ke ${nextFormatted.value} ${nextFormatted.longUnit}.`);
              }}
              aria-valuetext={`${formattedTime.value} ${formattedTime.longUnit}`}
            />
            <div className="milestone-row" role="group" aria-label="Lompat ke tonggak waktu">
              {MILESTONES.map((mark) => {
                const isNear = Math.abs(simYears - mark.years) < (mark.years < 1 ? 0.08 : 2);
                return (
                  <button
                    key={mark.label}
                    type="button"
                    className={`milestone-chip ${isNear ? "is-active" : ""}`}
                    onClick={() => jumpToYears(mark.years, mark.label)}
                    disabled={debris.length === 0}
                  >
                    {mark.label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <aside className="controls-panel panel" aria-labelledby="waste-heading">
          <div className="controls-heading">
            <p className="section-kicker">TENTUKAN OBJEKNYA</p>
            <h2 id="waste-heading">Apa yang masuk <br />ke laut?</h2>
            <p>Ketuk benda untuk menjatuhkan 5 sekaligus ke laut.</p>
          </div>

          <div className="waste-list" role="group" aria-label="Jenis sampah untuk simulasi">
            {WASTE_TYPES.map((waste) => (
              <button
                className={`waste-card ${selected.id === waste.id ? "is-selected" : ""}`}
                type="button"
                key={waste.id}
                onClick={() => addWaste(waste)}
                aria-label={`Pilih dan jatuhkan 5 ${waste.name} ke laut, ${waste.durationLabel}`}
                style={{ "--waste-color": waste.color, "--waste-tint": waste.tint }}
              >
                <span className="waste-card-icon"><WasteIllustration type={waste.id} /></span>
                <span className="waste-card-copy">
                  <strong>{waste.name}</strong>
                  <small>{waste.material}</small>
                </span>
                <span className="waste-duration">{waste.shortDuration}</span>
                <span className="waste-card-arrow" aria-hidden="true"><Icon name="plus" size={15} /></span>
              </button>
            ))}
          </div>

          <div className="lifespan-card">
            <div className="lifespan-card-top">
              <span>PERKIRAAN WAKTU URAI</span>
              <div className="lifespan-actions">
                <button
                  className={`narrate-button fact-narrate ${speakingId === "fact" ? "is-speaking" : ""}`}
                  type="button"
                  onClick={() => speak(insightText, "fact")}
                  aria-label="Dengarkan fakta sampah terpilih"
                  aria-pressed={speakingId === "fact"}
                  title="Dengarkan fakta sampah"
                >
                  <Icon name="sound" size={16} />
                </button>
                <span className="lifespan-mark"><Icon name="leaf" size={15} /></span>
              </div>
            </div>
            <div className="lifespan-headline">
              <strong>{selected.durationLabel}</strong>
              {selectedItems.length > 0 && (
                <span className={`stage-pill stage-${selectedStage.tone}`}>{selectedStage.label}</span>
              )}
            </div>
            <p>{insightText}</p>
            <div
              className="lifespan-progress"
              role="progressbar"
              aria-label="Perkembangan perkiraan waktu urai"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(selectedDecay * 100)}
            >
              <span style={{ width: `${Math.round(selectedDecay * 100)}%` }} />
            </div>
            <div className="lifespan-progress-caption">
              <span>Status di laut</span>
              <span>{Math.round(selectedDecay * 100)}%</span>
            </div>
          </div>

          <button
            className="add-button"
            type="button"
            onClick={() => addWaste(selected)}
            disabled={debris.length >= MAX_DEBRIS}
          >
            <span className="add-button-icon"><Icon name="plus" size={17} /></span>
            <span>
              {debris.length >= MAX_DEBRIS
                ? `Laut penuh (${MAX_DEBRIS}/${MAX_DEBRIS})`
                : `Tambah 5 ${selected.name.toLowerCase()} lagi`}
            </span>
            <Icon name="arrow" size={17} />
          </button>
          <p className="selection-hint">
            <span className="hint-dot" /> {matchingCount} {selected.name.toLowerCase()} di laut saat ini
          </p>
        </aside>
      </div>

      <ComparisonBoard
        simYears={simYears}
        selectedId={selectedId}
        onSelect={(id) => setSelectedId(id)}
      />

      <footer className="site-footer">
        <span>OCEAN TIME <i /> BELAJAR DARI LAUT</span>
        <span className="footer-motto">Laut bersih dimulai dari pilihan kecil.</span>
      </footer>
    </main>
  );
}
