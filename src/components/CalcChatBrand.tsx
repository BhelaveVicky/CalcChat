import React from 'react';

/**
 * CC Circle Emblem Logo matching user image 1
 */
export const CCLogo: React.FC<{ className?: string; size?: number }> = ({ className = 'h-20 w-20', size }) => (
  <svg 
    viewBox="0 0 200 200" 
    className={`${className} drop-shadow-lg transition-transform hover:scale-105 duration-300`} 
    style={size ? { width: size, height: size } : undefined}
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      {/* Outer Cyan Arc Gradient */}
      <linearGradient id="cyanArc" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#00e5ff" />
        <stop offset="100%" stopColor="#0066ff" />
      </linearGradient>

      {/* Outer Silver Arc Gradient */}
      <linearGradient id="silverArc" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="50%" stopColor="#cbd5e1" />
        <stop offset="100%" stopColor="#64748b" />
      </linearGradient>

      {/* Upper Silver C Gradient */}
      <linearGradient id="silverC" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="50%" stopColor="#f1f5f9" />
        <stop offset="100%" stopColor="#94a3b8" />
      </linearGradient>

      {/* Lower Cyan C Gradient */}
      <linearGradient id="cyanC" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#00f2fe" />
        <stop offset="50%" stopColor="#00a8ff" />
        <stop offset="100%" stopColor="#0052d4" />
      </linearGradient>

      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    {/* Dark Inner Base Circle */}
    <circle cx="100" cy="100" r="96" fill="#000000" stroke="#1e293b" strokeWidth="2" />

    {/* Top Right Outer Cyan Arc */}
    <path 
      d="M 62 26 A 78 78 0 0 1 174 138" 
      stroke="url(#cyanArc)" 
      strokeWidth="11" 
      strokeLinecap="round" 
      filter="url(#glow)"
    />

    {/* Bottom Left Outer Silver Arc */}
    <path 
      d="M 138 174 A 78 78 0 0 1 26 62" 
      stroke="url(#silverArc)" 
      strokeWidth="11" 
      strokeLinecap="round" 
    />

    {/* Upper Metallic Silver 'C' Loop */}
    <path 
      d="M 160 66 H 82 C 54 66 54 134 82 134 H 125" 
      stroke="url(#silverC)" 
      strokeWidth="20" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />

    {/* Lower Electric Cyan 'C' Loop */}
    <path 
      d="M 100 94 H 138 C 162 94 162 148 138 148 H 72" 
      stroke="url(#cyanC)" 
      strokeWidth="18" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * CalcChat Colorful 3D Title matching user image 2
 */
export const CalcChatTitle: React.FC<{ className?: string; size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' }> = ({
  className = '',
  size = 'md',
}) => {
  const sizeClasses = {
    xs: 'text-xl sm:text-2xl font-black tracking-tight',
    sm: 'text-2xl sm:text-3xl font-black tracking-tight',
    md: 'text-3xl sm:text-4xl font-black tracking-tight',
    lg: 'text-4xl sm:text-5xl font-black tracking-tight',
    xl: 'text-5xl sm:text-6xl font-black tracking-tight',
  }[size];

  return (
    <span className={`inline-flex items-center font-extrabold select-none ${sizeClasses} ${className}`}>
      {/* C */}
      <span className="bg-gradient-to-b from-[#00c6ff] to-[#0072ff] bg-clip-text text-transparent drop-shadow-md">C</span>
      {/* a */}
      <span className="bg-gradient-to-b from-[#f7b733] to-[#fc4a1a] bg-clip-text text-transparent drop-shadow-md">a</span>
      {/* l */}
      <span className="bg-gradient-to-b from-[#a8ff78] to-[#11998e] bg-clip-text text-transparent drop-shadow-md">l</span>
      {/* c */}
      <span className="bg-gradient-to-b from-[#8E2DE2] to-[#4A00E0] bg-clip-text text-transparent drop-shadow-md">c</span>
      {/* C */}
      <span className="bg-gradient-to-b from-[#FF416C] to-[#FF4B2B] bg-clip-text text-transparent drop-shadow-md ml-0.5">C</span>
      {/* h */}
      <span className="bg-gradient-to-b from-[#00d2ff] to-[#3a7bd5] bg-clip-text text-transparent drop-shadow-md">h</span>
      {/* a */}
      <span className="bg-gradient-to-b from-[#FF8008] to-[#FFC837] bg-clip-text text-transparent drop-shadow-md">a</span>
      {/* t */}
      <span className="bg-gradient-to-b from-[#B92b27] to-[#1565C0] bg-clip-text text-transparent drop-shadow-md">t</span>
    </span>
  );
};

/**
 * Stori Colorful Title matching user image 1
 */
export const StoriTitle: React.FC<{ className?: string; size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' }> = ({
  className = '',
  size = 'md',
}) => {
  const sizeClasses = {
    xs: 'text-xl sm:text-2xl font-black tracking-tight',
    sm: 'text-2xl sm:text-3xl font-black tracking-tight',
    md: 'text-3xl sm:text-4xl font-black tracking-tight',
    lg: 'text-4xl sm:text-5xl font-black tracking-tight',
    xl: 'text-5xl sm:text-6xl font-black tracking-tight',
  }[size];

  return (
    <span className={`inline-flex items-center font-extrabold select-none ${sizeClasses} ${className}`}>
      {/* S - blue */}
      <span className="bg-gradient-to-b from-[#00c6ff] to-[#0072ff] bg-clip-text text-transparent drop-shadow-md">S</span>
      {/* t - Orange */}
      <span className="bg-gradient-to-b from-[#ffb300] to-[#ff4e00] bg-clip-text text-transparent drop-shadow-md">t</span>
      {/* o - blue */}
      <span className="bg-gradient-to-b from-[#ff2a8d] to-[#9a00ff] bg-clip-text text-transparent drop-shadow-md">o</span>
      {/* r - Cyan/Teal */}
      <span className="bg-gradient-to-b from-[#00e5ff] to-[#00b894] bg-clip-text text-transparent drop-shadow-md">r</span>
      {/* i - Purple with blue Dot */}
      <span className="bg-gradient-to-b from-[#7f00ff] to-[#e100ff] bg-clip-text text-transparent drop-shadow-md">i</span>
    </span>
  );
};

/**
 * Calls Colorful Title matching user image 2
 */
export const CallsTitle: React.FC<{ className?: string; size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' }> = ({
  className = '',
  size = 'md',
}) => {
  const sizeClasses = {
    xs: 'text-xl sm:text-2xl font-black tracking-tight',
    sm: 'text-2xl sm:text-3xl font-black tracking-tight',
    md: 'text-3xl sm:text-4xl font-black tracking-tight',
    lg: 'text-4xl sm:text-5xl font-black tracking-tight',
    xl: 'text-5xl sm:text-6xl font-black tracking-tight',
  }[size];

  return (
    <span className={`inline-flex items-center font-extrabold select-none ${sizeClasses} ${className}`}>
      {/* C - blue */}
      <span className="bg-gradient-to-b from-[#00c6ff] to-[#0072ff] bg-clip-text text-transparent drop-shadow-md">C</span>
      {/* a - Yellow/Orange */}
      <span className="bg-gradient-to-b from-[#ffb300] to-[#ff4e00] bg-clip-text text-transparent drop-shadow-md">a</span>
      {/* l - Green */}
      <span className="bg-gradient-to-b from-[#76ff03] to-[#00c853] bg-clip-text text-transparent drop-shadow-md">l</span>
      {/* l - blue */}
      <span className="bg-gradient-to-b from-[#ff2a8d] to-[#ff007f] bg-clip-text text-transparent drop-shadow-md">l</span>
      {/* s - Purple */}
      <span className="bg-gradient-to-b from-[#8e2de2] to-[#4a00e0] bg-clip-text text-transparent drop-shadow-md">s</span>
    </span>
  );
};

/**
 * Profile Colorful Title matching user image 2
 */
export const ProfileTitle: React.FC<{ className?: string; size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' }> = ({
  className = '',
  size = 'md',
}) => {
  const sizeClasses = {
    xs: 'text-xl sm:text-2xl font-black tracking-tight',
    sm: 'text-2xl sm:text-3xl font-black tracking-tight',
    md: 'text-3xl sm:text-4xl font-black tracking-tight',
    lg: 'text-4xl sm:text-5xl font-black tracking-tight',
    xl: 'text-5xl sm:text-6xl font-black tracking-tight',
  }[size];

  return (
    <span className={`inline-flex items-center font-extrabold select-none ${sizeClasses} ${className}`}>
      {/* P - blue */}
      <span className="bg-gradient-to-b from-[#00c6ff] to-[#0072ff] bg-clip-text text-transparent drop-shadow-md">P</span>
      {/* r - blue */}
      <span className="bg-gradient-to-b from-[#ff007f] to-[#ff5252] bg-clip-text text-transparent drop-shadow-md">r</span>
      {/* o - Purple */}
      <span className="bg-gradient-to-b from-[#8e2de2] to-[#4a00e0] bg-clip-text text-transparent drop-shadow-md">o</span>
      {/* f - Orange */}
      <span className="bg-gradient-to-b from-[#ff8008] to-[#ffc837] bg-clip-text text-transparent drop-shadow-md">f</span>
      {/* i - Green */}
      <span className="bg-gradient-to-b from-[#76ff03] to-[#00c853] bg-clip-text text-transparent drop-shadow-md">i</span>
      {/* l - Cyan */}
      <span className="bg-gradient-to-b from-[#00f2fe] to-[#0072ff] bg-clip-text text-transparent drop-shadow-md">l</span>
      {/* e - Magenta */}
      <span className="bg-gradient-to-b from-[#e100ff] to-[#7f00ff] bg-clip-text text-transparent drop-shadow-md">e</span>
    </span>
  );
};

/**
 * Combined CalcChat Brand Header (Logo + Title)
 */
export const CalcChatBrand: React.FC<{
  logoSize?: string;
  titleSize?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  subtitleText?: string;
  className?: string;
}> = ({
  logoSize = 'h-20 w-20',
  titleSize = 'md',
  showSubtitle = true,
  subtitleText = 'Calculator Vault & Chat Platform',
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      <div className="mb-3">
        <CCLogo className={logoSize} />
      </div>
      <CalcChatTitle size={titleSize} />
      {showSubtitle && (
        <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm font-medium mt-1.5 tracking-wide">
          {subtitleText}
        </p>
      )}
    </div>
  );
};
