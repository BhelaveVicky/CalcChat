// Cute Pink AI Robot Mascot Avatar as scalable inline SVG Data URI
export const PINK_AI_AVATAR_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="%23ff62b0"/>
      <stop offset="50%" stop-color="%23ff2e93"/>
      <stop offset="100%" stop-color="%23d91b72"/>
    </linearGradient>
    <linearGradient id="faceGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="%232d0c23"/>
      <stop offset="100%" stop-color="%23170411"/>
    </linearGradient>
    <linearGradient id="earGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="%23ff77bc"/>
      <stop offset="100%" stop-color="%23e01878"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="%23d91b72" flood-opacity="0.4"/>
    </filter>
  </defs>

  <!-- Background Card -->
  <rect x="32" y="32" width="448" height="448" rx="120" fill="url(%23bgGrad)" filter="url(%23shadow)"/>

  <!-- Speech Bubble AI Tag -->
  <g transform="translate(320, 70)">
    <path d="M 0 30 C 0 13.4 13.4 0 30 0 L 80 0 C 96.6 0 110 13.4 110 30 C 110 46.6 96.6 60 80 60 L 35 60 L 10 80 L 18 55 C 7 49 0 40 0 30 Z" fill="white" opacity="0.95"/>
    <text x="52" y="38" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="28" fill="%23ff2e93" text-anchor="middle">AI</text>
  </g>

  <!-- Antenna -->
  <line x1="256" y1="180" x2="256" y2="120" stroke="white" stroke-width="12" stroke-linecap="round"/>
  <circle cx="256" cy="110" r="20" fill="%23ff77bc" stroke="white" stroke-width="6"/>

  <!-- Ears / Headphones -->
  <rect x="80" y="240" width="36" height="80" rx="18" fill="url(%23earGrad)" stroke="white" stroke-width="6"/>
  <rect x="396" y="240" width="36" height="80" rx="18" fill="url(%23earGrad)" stroke="white" stroke-width="6"/>

  <!-- Main Head Body -->
  <rect x="104" y="160" width="304" height="240" rx="90" fill="white" stroke="%23ff94cd" stroke-width="8"/>

  <!-- Dark Screen Face -->
  <rect x="136" y="196" width="240" height="150" rx="60" fill="url(%23faceGrad)"/>

  <!-- Winking Left Eye -->
  <path d="M 175 260 Q 195 285 215 260" fill="none" stroke="%23ff77bc" stroke-width="12" stroke-linecap="round"/>

  <!-- Right Eye Oval -->
  <ellipse cx="310" cy="265" rx="16" ry="24" fill="%23ff77bc"/>
  <ellipse cx="305" cy="258" rx="6" ry="9" fill="white"/>

  <!-- Happy Smile -->
  <path d="M 225 305 Q 256 325 287 305" fill="none" stroke="%23ff77bc" stroke-width="10" stroke-linecap="round"/>
</svg>`;
