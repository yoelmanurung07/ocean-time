export function Icon({ name, size = 18 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.85,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
    focusable: false,
  };

  switch (name) {
    case "wave":
      return (
        <svg {...common} viewBox="0 0 32 32">
          <path d="M3 13c3.2 0 3.2-3.5 6.4-3.5S12.6 13 15.8 13s3.2-3.5 6.4-3.5 3.2 3.5 6.4 3.5" />
          <path d="M3 20c3.2 0 3.2-3.5 6.4-3.5S12.6 20 15.8 20s3.2-3.5 6.4-3.5 3.2 3.5 6.4 3.5" />
        </svg>
      );
    case "sound":
      return (
        <svg {...common}>
          <path d="M11 5 6 9H3v6h3l5 4V5Z" />
          <path d="M15.5 8.5a5 5 0 0 1 0 7" />
          <path d="M18.5 5.5a9 9 0 0 1 0 13" />
        </svg>
      );
    case "soundOff":
      return (
        <svg {...common}>
          <path d="M11 5 6 9H3v6h3l5 4V5Z" />
          <path d="m16 9 5 6m0-6-5 6" />
        </svg>
      );
    case "reset":
      return (
        <svg {...common}>
          <path d="M3 12a9 9 0 1 0 2.64-6.36L3 8" />
          <path d="M3 3v5h5" />
        </svg>
      );
    case "play":
      return (
        <svg {...common} fill="currentColor" stroke="none">
          <path d="M8 5.9c0-.78.85-1.26 1.52-.86l9.15 5.47a1.72 1.72 0 0 1 0 2.96l-9.15 5.47A1 1 0 0 1 8 18.08V5.9Z" />
        </svg>
      );
    case "pause":
      return (
        <svg {...common} fill="currentColor" stroke="none">
          <rect x="6" y="5" width="4.4" height="14" rx="1.4" />
          <rect x="13.6" y="5" width="4.4" height="14" rx="1.4" />
        </svg>
      );
    case "plus":
      return (
        <svg {...common}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case "sun":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      );
    case "moon":
      return (
        <svg {...common}>
          <path d="M20.2 15.5A8.4 8.4 0 0 1 8.5 3.8 8.5 8.5 0 1 0 20.2 15.5Z" />
          <path d="m17 4 .5 1.5L19 6l-1.5.5L17 8l-.5-1.5L15 6l1.5-.5L17 4Z" />
        </svg>
      );
    case "arrow":
      return (
        <svg {...common}>
          <path d="M5 12h14m-6-6 6 6-6 6" />
        </svg>
      );
    case "expand":
      return (
        <svg {...common}>
          <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
        </svg>
      );
    case "shrink":
      return (
        <svg {...common}>
          <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7" />
        </svg>
      );
    case "leaf":
      return (
        <svg {...common}>
          <path d="M20 4c-7.2 0-12.3 2.3-14.5 6.4-1.5 2.8-.4 6.2 2.4 7.4 4.3 1.9 9.1-1.8 10.9-7.8.5-1.7.9-3.4 1.2-6Z" />
          <path d="M5 21c2.2-4.4 5.6-7.5 10.5-10" />
        </svg>
      );
    default:
      return null;
  }
}

export function WasteIllustration({ type }) {
  const shared = {
    viewBox: "0 0 48 48",
    fill: "none",
    "aria-hidden": true,
    focusable: false,
  };

  if (type === "bottle") {
    return (
      <svg {...shared}>
        <rect x="20" y="3.5" width="8" height="4" rx="1.2" fill="#0d6984" />
        <path
          d="M20 7.5h8v3.5l3.5 4.4V39a4 4 0 0 1-4 4h-7a4 4 0 0 1-4-4V15.4L20 11V7.5Z"
          fill="#bceef7"
          stroke="#0e7692"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <rect x="16.8" y="21" width="14.4" height="9" rx="1.5" fill="#0e86a4" fillOpacity="0.82" />
        <path d="M19.5 16v18" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.78" />
        <path d="M17.5 34.5h13" stroke="#0e7692" strokeWidth="1.4" strokeOpacity="0.45" />
      </svg>
    );
  }

  if (type === "bag") {
    return (
      <svg {...shared}>
        <path
          d="M15 16v-4a4.5 4.5 0 0 1 9 0v4m0-4a4.5 4.5 0 0 1 9 0v4"
          stroke="#c75a24"
          strokeWidth="2.3"
          strokeLinecap="round"
        />
        <path
          d="M11 16h26l-2.3 24.5a2.5 2.5 0 0 1-2.5 2.3H15.8a2.5 2.5 0 0 1-2.5-2.3L11 16Z"
          fill="#ffd9c4"
          fillOpacity="0.92"
          stroke="#c75a24"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M17 22c1 5 0 10-1 14m15-14c-1 5 0 10 1 14" stroke="#e07b42" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M20 27c2.5 1.8 5.5 1.8 8 0" stroke="#c75a24" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.55" />
      </svg>
    );
  }

  if (type === "can") {
    return (
      <svg {...shared}>
        <rect
          x="15"
          y="8.5"
          width="18"
          height="32"
          rx="4.5"
          fill="#d7d9f2"
          stroke="#4d4f9c"
          strokeWidth="2"
        />
        <ellipse cx="24" cy="9.5" rx="9" ry="2.6" fill="#eef0ff" stroke="#4d4f9c" strokeWidth="1.8" />
        <rect x="15.5" y="18" width="17" height="11" fill="#6366ba" fillOpacity="0.86" />
        <path d="M19 14v21" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.65" />
        <path d="M15.5 36.5c2.5 1.3 14.5 1.3 17 0" stroke="#4d4f9c" strokeWidth="1.6" strokeOpacity="0.55" />
      </svg>
    );
  }

  if (type === "paper") {
    return (
      <svg {...shared}>
        <path d="m8 17.5 14-8.5 18 7.5-14 9-18-8Z" fill="#e6c89d" stroke="#7a4e2c" strokeWidth="2" strokeLinejoin="round" />
        <path d="M8 17.5V32l18 8.5V25.5l-18-8Z" fill="#c79e6b" stroke="#7a4e2c" strokeWidth="2" strokeLinejoin="round" />
        <path d="M40 16.5V31L26 40.5v-15l14-9Z" fill="#b18552" stroke="#7a4e2c" strokeWidth="2" strokeLinejoin="round" />
        <path d="m14.5 13.5 17 7.2" stroke="#7a4e2c" strokeWidth="1.8" strokeLinecap="round" strokeOpacity="0.6" />
        <path d="M12 24.5l9 4" stroke="#f7e8d0" strokeWidth="1.6" strokeLinecap="round" strokeOpacity="0.7" />
      </svg>
    );
  }

  return (
    <svg {...shared}>
      <path
        d="M11 16.5c0-2.5 2.2-4.5 5-4.5h16c2.8 0 5 2 5 4.5l-1.5 16.5a3.5 3.5 0 0 1-3.5 3.2H16a3.5 3.5 0 0 1-3.5-3.2L11 16.5Z"
        fill="#f2f7f4"
        stroke="#436b5d"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M12.5 22.5h23" stroke="#79a192" strokeWidth="1.7" />
      <circle cx="19" cy="28" r="1.4" fill="#6b9384" />
      <circle cx="25" cy="30.5" r="1.6" fill="#6b9384" />
      <circle cx="29.5" cy="27" r="1.3" fill="#6b9384" />
      <circle cx="22.5" cy="17.5" r="1.3" fill="#6b9384" />
    </svg>
  );
}

export function Fish({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 48"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M13 24C25 9 50 7 72 20l17-10v28L72 28C50 41 25 39 13 24Z" fill="currentColor" />
      <circle cx="34" cy="21" r="2.5" fill="#0b5c70" />
      <path d="M50 14c-3 6-3 14 0 20m12-16c-2 4-2 8 0 12" stroke="#fff" strokeOpacity=".65" strokeWidth="2" />
    </svg>
  );
}

export function CrescentMoon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" focusable="false">
      <path
        d="M34.5 29.8A14.5 14.5 0 0 1 18.2 13.5c0-2.6.7-5 1.9-7.1A15.5 15.5 0 1 0 41.6 27.9c-2.1 1.2-4.5 1.9-7.1 1.9Z"
        fill="#fff5c0"
      />
    </svg>
  );
}
