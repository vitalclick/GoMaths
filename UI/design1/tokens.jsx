// tokens.jsx — GoMaths design tokens, mascot, primitives
// Shared across all screens. Globally exposed via window.

// ─────────────────────────────────────────────────────────────
// Palettes — three options the user can tweak between.
// Indexes: 0 = primary, 1 = primary-dark, 2 = accent, 3 = ai, 4 = xp/amber
// ─────────────────────────────────────────────────────────────
const GM_PALETTES = {
  classic: {
    primary:    'oklch(0.66 0.18 148)',   // GoMaths green
    primaryDk:  'oklch(0.54 0.16 148)',
    primaryLt:  'oklch(0.93 0.06 148)',
    accent:     'oklch(0.62 0.21 25)',    // red
    ai:         'oklch(0.60 0.22 290)',   // purple (AI distinction)
    xp:         'oklch(0.78 0.16 75)',    // amber
    coin:       'oklch(0.78 0.16 75)',
  },
  aiBlue: {
    primary:    'oklch(0.66 0.18 148)',
    primaryDk:  'oklch(0.54 0.16 148)',
    primaryLt:  'oklch(0.93 0.06 148)',
    accent:     'oklch(0.62 0.21 25)',
    ai:         'oklch(0.62 0.18 245)',
    xp:         'oklch(0.78 0.16 75)',
    coin:       'oklch(0.78 0.16 75)',
  },
  vivid: {
    primary:    'oklch(0.70 0.21 148)',
    primaryDk:  'oklch(0.56 0.18 148)',
    primaryLt:  'oklch(0.94 0.08 148)',
    accent:     'oklch(0.66 0.24 18)',
    ai:         'oklch(0.62 0.22 305)',
    xp:         'oklch(0.80 0.18 70)',
    coin:       'oklch(0.80 0.18 70)',
  },
};

// Light/dark surface tokens
const GM_SURFACES = {
  light: {
    bg:       '#F4F7F3',     // very soft mint
    surface:  '#FFFFFF',
    surface2: '#F8FAF7',
    border:   'rgba(20,40,30,0.08)',
    text:     '#0E1A14',
    textDim:  '#5B6660',
    textMute: '#8B9590',
    shadow:   '0 1px 2px rgba(20,40,30,0.04), 0 6px 24px rgba(20,40,30,0.06)',
    shadowLg: '0 4px 8px rgba(20,40,30,0.06), 0 18px 40px rgba(20,40,30,0.08)',
  },
  dark: {
    bg:       '#0B100D',
    surface:  '#161D18',
    surface2: '#1E2620',
    border:   'rgba(255,255,255,0.08)',
    text:     '#F0F4F1',
    textDim:  '#A6B0AB',
    textMute: '#737B77',
    shadow:   '0 1px 2px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.3)',
    shadowLg: '0 6px 12px rgba(0,0,0,0.4), 0 20px 48px rgba(0,0,0,0.45)',
  },
};

// Convenience: assemble a full theme from palette + mode
function gmTheme(paletteKey = 'classic', dark = false) {
  return {
    ...GM_PALETTES[paletteKey],
    ...(dark ? GM_SURFACES.dark : GM_SURFACES.light),
    mode: dark ? 'dark' : 'light',
    palette: paletteKey,
  };
}

// ─────────────────────────────────────────────────────────────
// Type system
// ─────────────────────────────────────────────────────────────
const GM_FONT = `'Nunito', -apple-system, system-ui, sans-serif`;
const GM_MONO = `'JetBrains Mono', ui-monospace, monospace`;

// ─────────────────────────────────────────────────────────────
// Mascot — "Maxi". Pure CSS, no SVG slop.
// A friendly rounded green squircle with eyes + smile.
// ─────────────────────────────────────────────────────────────
function Maxi({ size = 64, mood = 'happy', theme }) {
  const T = theme;
  const eyeY = size * 0.42;
  const eyeSize = size * 0.14;
  const eyeOffset = size * 0.18;
  return (
    <div style={{
      width: size, height: size, position: 'relative', flexShrink: 0,
    }}>
      {/* body */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(circle at 35% 30%, ${T.primary} 0%, ${T.primaryDk} 100%)`,
        borderRadius: '38%',
        boxShadow: `inset 0 ${-size * 0.06}px ${size * 0.08}px rgba(0,0,0,0.15), 0 ${size * 0.04}px ${size * 0.08}px rgba(20,80,40,0.18)`,
      }} />
      {/* cheek highlight */}
      <div style={{
        position: 'absolute', top: '20%', left: '18%', width: '28%', height: '22%',
        background: 'rgba(255,255,255,0.35)', borderRadius: '50%', filter: 'blur(2px)',
      }} />
      {/* eyes */}
      <div style={{
        position: 'absolute', top: eyeY, left: eyeOffset, width: eyeSize, height: eyeSize,
        background: '#0E1A14', borderRadius: '50%',
      }}>
        <div style={{
          position: 'absolute', top: '15%', left: '15%', width: '40%', height: '40%',
          background: '#fff', borderRadius: '50%',
        }} />
      </div>
      <div style={{
        position: 'absolute', top: eyeY, right: eyeOffset, width: eyeSize, height: eyeSize,
        background: '#0E1A14', borderRadius: '50%',
      }}>
        <div style={{
          position: 'absolute', top: '15%', left: '15%', width: '40%', height: '40%',
          background: '#fff', borderRadius: '50%',
        }} />
      </div>
      {/* smile */}
      {mood === 'happy' && (
        <div style={{
          position: 'absolute', bottom: '22%', left: '32%', width: '36%', height: '18%',
          borderBottom: `${size * 0.05}px solid #0E1A14`,
          borderRadius: '0 0 50% 50% / 0 0 100% 100%',
        }} />
      )}
      {mood === 'wow' && (
        <div style={{
          position: 'absolute', bottom: '20%', left: '42%', width: '16%', height: '20%',
          background: '#0E1A14', borderRadius: '50%',
        }} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Icon system — using inline SVG glyphs (simple geometric only)
// ─────────────────────────────────────────────────────────────
function GMIcon({ name, size = 20, color = 'currentColor', stroke = 2 }) {
  const props = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'home':       return <svg {...props}><path d="M3 11l9-7 9 7v9a2 2 0 01-2 2h-3v-7h-8v7H5a2 2 0 01-2-2v-9z"/></svg>;
    case 'book':       return <svg {...props}><path d="M4 4h7a4 4 0 014 4v12a3 3 0 00-3-3H4V4z"/><path d="M20 4h-7a4 4 0 00-4 4v12a3 3 0 013-3h8V4z"/></svg>;
    case 'camera':     return <svg {...props}><path d="M3 8a2 2 0 012-2h2l2-2h6l2 2h2a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/><circle cx="12" cy="13" r="4"/></svg>;
    case 'chat':       return <svg {...props}><path d="M21 12a8 8 0 11-3.5-6.6L21 4l-1.4 3.5A8 8 0 0121 12z"/></svg>;
    case 'chart':      return <svg {...props}><path d="M3 21h18"/><path d="M7 21V10"/><path d="M12 21V4"/><path d="M17 21v-7"/></svg>;
    case 'flame':      return <svg {...props}><path d="M12 2c0 4 4 5 4 10a6 6 0 11-12 0c0-3 2-4 3-6 1 2 2 3 3 3 0-3 2-5 2-7z"/></svg>;
    case 'trophy':     return <svg {...props}><path d="M8 4h8v5a4 4 0 11-8 0V4z"/><path d="M5 5H3v2a3 3 0 003 3"/><path d="M19 5h2v2a3 3 0 01-3 3"/><path d="M10 17h4v3h-4z"/><path d="M8 20h8"/></svg>;
    case 'star':       return <svg {...props}><path d="M12 3l2.6 5.3 5.9.9-4.3 4.2 1 5.9L12 16.5l-5.2 2.8 1-5.9L3.5 9.2l5.9-.9L12 3z"/></svg>;
    case 'bolt':       return <svg {...props}><path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z"/></svg>;
    case 'check':      return <svg {...props}><path d="M5 12l4 4 10-10"/></svg>;
    case 'plus':       return <svg {...props}><path d="M12 5v14M5 12h14"/></svg>;
    case 'arrow-right':return <svg {...props}><path d="M5 12h14M13 5l7 7-7 7"/></svg>;
    case 'arrow-left': return <svg {...props}><path d="M19 12H5M11 5l-7 7 7 7"/></svg>;
    case 'play':       return <svg {...props} fill="currentColor"><path d="M8 5v14l11-7L8 5z" stroke="none"/></svg>;
    case 'mic':        return <svg {...props}><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0014 0M12 18v3"/></svg>;
    case 'send':       return <svg {...props}><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>;
    case 'lock':       return <svg {...props}><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></svg>;
    case 'gear':       return <svg {...props}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1A1.7 1.7 0 008 19.4a1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H2a2 2 0 110-4h.1a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H8a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V10a1.7 1.7 0 001.5 1H22a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/></svg>;
    case 'profile':    return <svg {...props}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/></svg>;
    case 'sparkle':    return <svg {...props}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/></svg>;
    case 'graph':      return <svg {...props}><path d="M3 20V4"/><path d="M3 20h18"/><path d="M5 16c2-6 5-8 8-8s5 4 8 0"/></svg>;
    case 'lightbulb':  return <svg {...props}><path d="M9 18h6M10 22h4"/><path d="M12 2a6 6 0 00-4 10.5c1 1 1.5 2 1.5 3.5h5c0-1.5.5-2.5 1.5-3.5A6 6 0 0012 2z"/></svg>;
    case 'fire-small': return <svg {...props} fill="currentColor" stroke="none"><path d="M12 2c0 4 4 5 4 10a6 6 0 11-12 0c0-3 2-4 3-6 1 2 2 3 3 3 0-3 2-5 2-7z"/></svg>;
    case 'lock-mini':  return <svg {...props}><rect x="6" y="11" width="12" height="9" rx="2"/><path d="M9 11V8a3 3 0 016 0v3"/></svg>;
    default: return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Placeholder visual — striped box w/ mono label, for art that needs assets
// ─────────────────────────────────────────────────────────────
function GMPlaceholder({ label = 'PLACEHOLDER', height = 120, theme, tone = 'mint' }) {
  const T = theme;
  const tones = {
    mint:   { bg: T.primaryLt, fg: T.primaryDk, stripe: 'rgba(20,80,40,0.06)' },
    purple: { bg: 'oklch(0.93 0.05 290)', fg: T.ai, stripe: 'rgba(80,40,140,0.06)' },
    amber:  { bg: 'oklch(0.94 0.06 75)',  fg: 'oklch(0.45 0.12 70)', stripe: 'rgba(140,90,20,0.08)' },
    neutral:{ bg: T.surface2, fg: T.textDim, stripe: 'rgba(20,40,30,0.05)' },
  };
  const ts = tones[tone] || tones.mint;
  return (
    <div style={{
      height, borderRadius: 16,
      background: `repeating-linear-gradient(135deg, ${ts.bg} 0 12px, ${ts.stripe} 12px 14px)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: GM_MONO, fontSize: 10, letterSpacing: 1.2,
      color: ts.fg, fontWeight: 600, textTransform: 'uppercase',
    }}>{label}</div>
  );
}

// ─────────────────────────────────────────────────────────────
// Buttons
// ─────────────────────────────────────────────────────────────
function GMButton({ children, variant = 'primary', size = 'md', icon, theme, style = {}, full = false }) {
  const T = theme;
  const sizes = {
    sm: { h: 36, px: 14, fs: 14, r: 10 },
    md: { h: 48, px: 18, fs: 16, r: 14 },
    lg: { h: 56, px: 22, fs: 17, r: 16 },
  }[size];
  const variants = {
    primary: {
      background: T.primary,
      color: '#fff',
      boxShadow: `0 2px 0 ${T.primaryDk}, 0 4px 12px oklch(from ${T.primary} l c h / 0.35)`,
      border: 'none',
    },
    secondary: {
      background: T.surface,
      color: T.text,
      boxShadow: `0 2px 0 ${T.border}, 0 1px 0 ${T.border} inset`,
      border: `1px solid ${T.border}`,
    },
    accent: {
      background: T.accent,
      color: '#fff',
      boxShadow: `0 2px 0 oklch(from ${T.accent} calc(l - 0.12) c h), 0 4px 12px oklch(from ${T.accent} l c h / 0.35)`,
      border: 'none',
    },
    ai: {
      background: `linear-gradient(135deg, ${T.ai}, oklch(from ${T.ai} calc(l + 0.08) c calc(h + 20)))`,
      color: '#fff',
      boxShadow: `0 2px 0 oklch(from ${T.ai} calc(l - 0.12) c h), 0 4px 16px oklch(from ${T.ai} l c h / 0.4)`,
      border: 'none',
    },
    ghost: {
      background: 'transparent',
      color: T.text,
      border: 'none',
    },
  }[variant];
  return (
    <button style={{
      ...variants,
      height: sizes.h, padding: `0 ${sizes.px}px`, borderRadius: sizes.r,
      fontFamily: GM_FONT, fontSize: sizes.fs, fontWeight: 800,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      cursor: 'pointer', letterSpacing: 0.2,
      width: full ? '100%' : undefined,
      ...style,
    }}>
      {icon && <GMIcon name={icon} size={sizes.fs + 2} />}
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Card
// ─────────────────────────────────────────────────────────────
function GMCard({ children, theme, style = {}, padding = 16, hover = false }) {
  const T = theme;
  return (
    <div style={{
      background: T.surface, borderRadius: 20, padding,
      boxShadow: T.shadow,
      border: T.mode === 'dark' ? `1px solid ${T.border}` : 'none',
      ...style,
    }}>{children}</div>
  );
}

// ─────────────────────────────────────────────────────────────
// Pill — stat pill (XP, streak, etc.)
// ─────────────────────────────────────────────────────────────
function GMPill({ icon, label, color, bg, theme }) {
  const T = theme;
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '6px 12px', borderRadius: 999,
      background: bg || T.surface2, color: color || T.text,
      fontFamily: GM_FONT, fontWeight: 800, fontSize: 14,
      letterSpacing: 0.1, lineHeight: 1,
    }}>
      {icon && <GMIcon name={icon} size={14} />}
      {label}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Progress bar
// ─────────────────────────────────────────────────────────────
function GMProgress({ value = 0.5, color, bg, height = 10, theme }) {
  const T = theme;
  return (
    <div style={{
      height, borderRadius: 999, background: bg || T.surface2, overflow: 'hidden',
      position: 'relative',
    }}>
      <div style={{
        width: `${Math.min(100, value * 100)}%`, height: '100%',
        background: color || T.primary,
        borderRadius: 999,
        boxShadow: `inset 0 -2px 0 ${color ? `oklch(from ${color} calc(l - 0.08) c h)` : T.primaryDk}, inset 0 1px 1px rgba(255,255,255,0.4)`,
      }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Bottom tab bar
// ─────────────────────────────────────────────────────────────
function GMTabBar({ active = 'home', theme }) {
  const T = theme;
  const items = [
    { id: 'home',    icon: 'home',    label: 'Home' },
    { id: 'learn',   icon: 'book',    label: 'Learn' },
    { id: 'solve',   icon: 'camera',  label: 'Solve' },
    { id: 'tutor',   icon: 'chat',    label: 'Tutor' },
    { id: 'me',      icon: 'profile', label: 'Profile' },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      background: T.surface,
      borderTop: `1px solid ${T.border}`,
      paddingBottom: 30, paddingTop: 8,
      display: 'flex', justifyContent: 'space-around',
      backdropFilter: 'blur(20px)',
    }}>
      {items.map(it => {
        const isSolve = it.id === 'solve';
        const isActive = it.id === active;
        if (isSolve) {
          return (
            <div key={it.id} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              transform: 'translateY(-14px)',
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: 18,
                background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDk})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 6px 20px oklch(from ${T.primary} l c h / 0.5)`,
                color: '#fff',
              }}>
                <GMIcon name="camera" size={26} stroke={2.2} />
              </div>
            </div>
          );
        }
        return (
          <div key={it.id} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            padding: '6px 12px',
            color: isActive ? T.primary : T.textMute,
          }}>
            <GMIcon name={it.icon} size={24} stroke={isActive ? 2.4 : 2} />
            <div style={{ fontFamily: GM_FONT, fontSize: 10, fontWeight: 800, letterSpacing: 0.3 }}>{it.label}</div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Phone-screen wrapper — gives every screen consistent padding+bg
// ─────────────────────────────────────────────────────────────
function GMScreen({ children, theme, padding = 16, bg, scroll = true, style = {} }) {
  const T = theme;
  return (
    <div style={{
      width: '100%', height: '100%', background: bg || T.bg, color: T.text,
      fontFamily: GM_FONT, position: 'relative',
      overflow: scroll ? 'auto' : 'hidden',
      paddingTop: 54, // status bar
      paddingBottom: 96, // tab bar space
      boxSizing: 'border-box',
      ...style,
    }}>
      <div style={{ padding: `0 ${padding}px` }}>{children}</div>
    </div>
  );
}

// Section heading
function GMHeading({ children, eyebrow, theme, action, style = {} }) {
  const T = theme;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 12, ...style }}>
      <div>
        {eyebrow && <div style={{ fontSize: 11, color: T.textMute, letterSpacing: 1, fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>{eyebrow}</div>}
        <div style={{ fontFamily: GM_FONT, fontSize: 20, fontWeight: 900, letterSpacing: -0.3, color: T.text }}>{children}</div>
      </div>
      {action && <div style={{ fontFamily: GM_FONT, fontSize: 13, fontWeight: 800, color: T.primary }}>{action}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Expose globally
// ─────────────────────────────────────────────────────────────
Object.assign(window, {
  GM_PALETTES, GM_SURFACES, GM_FONT, GM_MONO,
  gmTheme, Maxi, GMIcon, GMPlaceholder, GMButton, GMCard, GMPill,
  GMProgress, GMTabBar, GMScreen, GMHeading,
});
