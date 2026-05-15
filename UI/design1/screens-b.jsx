// screens-b.jsx — AI Tutor chat, Graphing, Progress, Gamification

// ═════════════════════════════════════════════════════════════
// SCREEN 5 — AI Tutor Chat
// ═════════════════════════════════════════════════════════════
function ScrTutor({ theme: T, age, gamification }) {
  return (
    <div style={{ width: '100%', height: '100%', background: T.bg, color: T.text, fontFamily: GM_FONT, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ paddingTop: 54, padding: '54px 18px 12px', display: 'flex', alignItems: 'center', gap: 12, background: T.surface, borderBottom: `1px solid ${T.border}` }}>
        <button style={{ width: 40, height: 40, borderRadius: 12, border: 'none', background: T.surface2, color: T.text, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <GMIcon name="arrow-left" size={20} />
        </button>
        <div style={{ position: 'relative' }}>
          <Maxi size={44} theme={T} />
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: '50%', background: T.primary, border: `2px solid ${T.surface}` }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: -0.2 }}>Maxi</div>
          <div style={{ fontSize: 12, color: T.primary, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
            <GMIcon name="sparkle" size={11} /> AI tutor · online
          </div>
        </div>
        <button style={{ width: 40, height: 40, borderRadius: 12, border: 'none', background: T.surface2, color: T.text, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <GMIcon name="gear" size={20} />
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 16px 8px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Date label */}
        <div style={{ textAlign: 'center', fontSize: 11, color: T.textMute, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase', margin: '4px 0' }}>Today</div>

        {/* AI greeting */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <Maxi size={32} theme={T} />
          <div style={{
            maxWidth: '78%', background: T.surface, padding: '10px 14px',
            borderRadius: '18px 18px 18px 4px', boxShadow: T.shadow,
            fontSize: 14, lineHeight: 1.45,
          }}>
            Howzit, Thando! 👋 Stuck on something? Type it out, snap a photo, or pick a quick prompt below.
          </div>
        </div>

        {/* User msg */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{
            maxWidth: '78%', background: T.primary, color: '#fff',
            padding: '10px 14px', borderRadius: '18px 18px 4px 18px',
            fontSize: 14, lineHeight: 1.45, boxShadow: `0 2px 0 ${T.primaryDk}`,
          }}>
            I don't get why (x − 3)(x + 2) gives x² − x − 6
          </div>
        </div>

        {/* AI explanation with math */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <Maxi size={32} theme={T} />
          <div style={{ maxWidth: '82%', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ background: T.surface, padding: '10px 14px', borderRadius: '18px 18px 18px 4px', boxShadow: T.shadow, fontSize: 14, lineHeight: 1.45 }}>
              Great question. It's the FOIL trick — multiply every pair:
            </div>
            {/* math card with grid */}
            <div style={{ background: T.surface, padding: 12, borderRadius: '18px 18px 18px 4px', boxShadow: T.shadow }}>
              <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 1fr', gap: 4, alignItems: 'center', fontFamily: GM_MONO, fontSize: 13, fontWeight: 700 }}>
                <div></div>
                <div style={{ textAlign: 'center', color: T.textMute, fontSize: 11 }}>+x</div>
                <div style={{ textAlign: 'center', color: T.textMute, fontSize: 11 }}>−3</div>

                <div style={{ textAlign: 'right', color: T.textMute, fontSize: 11 }}>+x</div>
                <div style={{ background: T.primaryLt, color: T.primaryDk, padding: '6px 8px', borderRadius: 8, textAlign: 'center' }}>x²</div>
                <div style={{ background: T.primaryLt, color: T.primaryDk, padding: '6px 8px', borderRadius: 8, textAlign: 'center' }}>−3x</div>

                <div style={{ textAlign: 'right', color: T.textMute, fontSize: 11 }}>+2</div>
                <div style={{ background: `oklch(from ${T.ai} 0.93 0.05 h)`, color: T.ai, padding: '6px 8px', borderRadius: 8, textAlign: 'center' }}>+2x</div>
                <div style={{ background: `oklch(from ${T.ai} 0.93 0.05 h)`, color: T.ai, padding: '6px 8px', borderRadius: 8, textAlign: 'center' }}>−6</div>
              </div>
              <div style={{ marginTop: 10, padding: '8px 10px', background: T.surface2, borderRadius: 10, fontFamily: GM_MONO, fontWeight: 700, fontSize: 13, color: T.text }}>
                x² <span style={{ color: T.textMute }}>+</span> (−3x + 2x) <span style={{ color: T.textMute }}>−</span> 6 = <span style={{ color: T.primary }}>x² − x − 6</span>
              </div>
            </div>
            <div style={{ background: T.surface, padding: '10px 14px', borderRadius: '18px 18px 18px 4px', boxShadow: T.shadow, fontSize: 14, lineHeight: 1.45 }}>
              The −3x and +2x combine into −x. Want to try one yourself? 💪
            </div>
          </div>
        </div>

        {/* Suggested prompts */}
        <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: T.textMute, letterSpacing: 0.6, textTransform: 'uppercase', paddingLeft: 4 }}>Try asking</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {['Show me an example', 'Give me a practice problem', 'Explain in simpler words'].map(p => (
              <div key={p} style={{ padding: '8px 12px', borderRadius: 999, background: T.surface, border: `1px solid ${T.border}`, fontSize: 13, fontWeight: 700, color: T.text }}>
                {p}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Input bar */}
      <div style={{ padding: '8px 12px 28px', background: T.surface, borderTop: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
        <button style={{ width: 40, height: 40, borderRadius: 12, border: 'none', background: T.surface2, color: T.text, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <GMIcon name="camera" size={20} />
        </button>
        <div style={{ flex: 1, background: T.surface2, borderRadius: 18, padding: '10px 16px', fontSize: 14, color: T.textMute, fontWeight: 500 }}>
          Ask Maxi anything…
        </div>
        <button style={{ width: 40, height: 40, borderRadius: 12, border: 'none', background: T.primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 2px 0 ${T.primaryDk}` }}>
          <GMIcon name="mic" size={20} />
        </button>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// SCREEN 6 — Graphing / Visualization
// ═════════════════════════════════════════════════════════════
function ScrGraphing({ theme: T, age, gamification }) {
  // Build a parabola y = x² scaled to a 280px region
  const W = 320, H = 260;
  const cx = W / 2, cy = H * 0.7;
  const scale = 32; // px per unit
  const pts = [];
  for (let x = -2.6; x <= 2.6; x += 0.05) {
    const y = x * x;
    pts.push(`${cx + x * scale},${cy - y * scale * 0.4}`);
  }
  return (
    <div style={{ width: '100%', height: '100%', background: T.bg, color: T.text, fontFamily: GM_FONT, position: 'relative', overflow: 'auto', paddingTop: 54, paddingBottom: 96, boxSizing: 'border-box' }}>
      {/* Header */}
      <div style={{ padding: '8px 18px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button style={{ width: 40, height: 40, borderRadius: 12, border: 'none', background: T.surface, color: T.text, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: T.shadow }}>
          <GMIcon name="arrow-left" size={20} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: T.textMute, letterSpacing: 0.6, textTransform: 'uppercase' }}>Visualizer</div>
          <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: -0.3 }}>The parabola</div>
        </div>
        <button style={{ width: 40, height: 40, borderRadius: 12, border: 'none', background: T.surface, color: T.text, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: T.shadow }}>
          <GMIcon name="sparkle" size={18} color={T.ai} />
        </button>
      </div>

      <div style={{ padding: '0 18px' }}>
        {/* Equation card */}
        <GMCard theme={T} padding={16}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: T.textMute, letterSpacing: 0.6, textTransform: 'uppercase' }}>Equation</div>
            <div style={{ display: 'flex', gap: 4 }}>
              <div style={{ padding: '4px 10px', borderRadius: 999, background: T.primaryLt, color: T.primaryDk, fontSize: 11, fontWeight: 800 }}>Live</div>
            </div>
          </div>
          <div style={{ marginTop: 6, fontFamily: GM_MONO, fontSize: 28, fontWeight: 700, color: T.text, letterSpacing: 0.4 }}>
            y = <span style={{ color: T.primary }}>a</span>x² + <span style={{ color: T.accent }}>b</span>x + <span style={{ color: T.ai }}>c</span>
          </div>
        </GMCard>

        {/* Graph area */}
        <div style={{ marginTop: 12, background: T.surface, borderRadius: 20, padding: 12, boxShadow: T.shadow, position: 'relative', overflow: 'hidden' }}>
          <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
            {/* grid */}
            {Array.from({ length: 11 }).map((_, i) => {
              const x = (W / 10) * i;
              return <line key={`vx${i}`} x1={x} y1="0" x2={x} y2={H} stroke={T.border} strokeWidth="1" />;
            })}
            {Array.from({ length: 9 }).map((_, i) => {
              const y = (H / 8) * i;
              return <line key={`vy${i}`} x1="0" y1={y} x2={W} y2={y} stroke={T.border} strokeWidth="1" />;
            })}
            {/* axes */}
            <line x1="0" y1={cy} x2={W} y2={cy} stroke={T.textMute} strokeWidth="1.5" />
            <line x1={cx} y1="0" x2={cx} y2={H} stroke={T.textMute} strokeWidth="1.5" />
            {/* Axis labels */}
            <text x={W - 12} y={cy - 6} fontFamily={GM_MONO} fontSize="11" fontWeight="700" fill={T.textMute} textAnchor="end">x</text>
            <text x={cx + 8} y="12" fontFamily={GM_MONO} fontSize="11" fontWeight="700" fill={T.textMute}>y</text>
            {/* curve shadow */}
            <polyline points={pts.join(' ')} fill="none" stroke={T.primary} strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" opacity="0.2" transform="translate(0,3)" />
            {/* curve */}
            <polyline points={pts.join(' ')} fill="none" stroke={T.primary} strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" />
            {/* vertex point */}
            <circle cx={cx} cy={cy} r="6" fill={T.accent} stroke="#fff" strokeWidth="3" />
            {/* roots */}
            <circle cx={cx - 1.7 * scale} cy={cy} r="5" fill="#fff" stroke={T.primary} strokeWidth="2.5" />
            <circle cx={cx + 1.7 * scale} cy={cy} r="5" fill="#fff" stroke={T.primary} strokeWidth="2.5" />
          </svg>

          {/* Floating annotations */}
          <div style={{ position: 'absolute', top: 12, right: 16, padding: '6px 10px', borderRadius: 10, background: T.accent, color: '#fff', fontSize: 11, fontWeight: 800, boxShadow: `0 2px 8px oklch(from ${T.accent} l c h / 0.4)`, display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} /> Vertex (0, 0)
          </div>
        </div>

        {/* Slider controls */}
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { letter: 'a', color: T.primary, value: '1.0', pct: 0.62 },
            { letter: 'b', color: T.accent,  value: '0.0', pct: 0.50 },
            { letter: 'c', color: T.ai,      value: '0.0', pct: 0.50 },
          ].map(s => (
            <div key={s.letter} style={{ background: T.surface, borderRadius: 16, padding: '12px 14px', boxShadow: T.shadow, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: s.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: GM_MONO, fontWeight: 800, fontSize: 16 }}>{s.letter}</div>
              <div style={{ flex: 1, position: 'relative', height: 6, background: T.surface2, borderRadius: 999 }}>
                <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${s.pct * 100}%`, background: s.color, borderRadius: 999 }} />
                <div style={{ position: 'absolute', left: `calc(${s.pct * 100}% - 11px)`, top: '50%', transform: 'translateY(-50%)', width: 22, height: 22, borderRadius: '50%', background: '#fff', border: `3px solid ${s.color}`, boxShadow: T.shadow }} />
              </div>
              <div style={{ minWidth: 36, textAlign: 'right', fontFamily: GM_MONO, fontWeight: 700, fontSize: 14 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* AI insight */}
        <div style={{ marginTop: 12, background: `oklch(from ${T.ai} 0.96 0.03 h)`, border: `1px solid oklch(from ${T.ai} 0.88 0.06 h)`, borderRadius: 16, padding: 14, display: 'flex', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: T.ai, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <GMIcon name="sparkle" size={16} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: T.ai, letterSpacing: 0.5, textTransform: 'uppercase' }}>Maxi notices</div>
            <div style={{ fontSize: 13, color: T.text, marginTop: 2, lineHeight: 1.45, fontWeight: 600 }}>
              When <span style={{ fontFamily: GM_MONO, color: T.primary }}>a</span> gets bigger, the curve gets <span style={{ fontWeight: 900 }}>narrower</span>. Try dragging it!
            </div>
          </div>
        </div>
      </div>

      <GMTabBar active="learn" theme={T} />
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// SCREEN 7 — Progress Analytics
// ═════════════════════════════════════════════════════════════
function ScrProgress({ theme: T, age, gamification }) {
  const week = [
    { d: 'M', v: 0.4 },
    { d: 'T', v: 0.7 },
    { d: 'W', v: 0.5 },
    { d: 'T', v: 0.9 },
    { d: 'F', v: 0.6 },
    { d: 'S', v: 1.0, today: true },
    { d: 'S', v: 0.0 },
  ];
  const topics = [
    { name: 'Number sense',     pct: 92, color: T.primary },
    { name: 'Algebra basics',   pct: 78, color: T.primary },
    { name: 'Geometry',         pct: 64, color: T.xp },
    { name: 'Quadratics',       pct: 48, color: T.xp },
    { name: 'Trigonometry',     pct: 22, color: T.accent },
    { name: 'Statistics',       pct: 14, color: T.accent },
  ];
  return (
    <div style={{ width: '100%', height: '100%', background: T.bg, color: T.text, fontFamily: GM_FONT, position: 'relative', overflow: 'auto', paddingTop: 54, paddingBottom: 96, boxSizing: 'border-box' }}>
      <div style={{ padding: '10px 18px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color: T.textMute, letterSpacing: 0.6, textTransform: 'uppercase' }}>This week</div>
          <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.4 }}>Your progress</div>
        </div>
        <button style={{ width: 40, height: 40, borderRadius: 12, border: 'none', background: T.surface, color: T.text, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: T.shadow }}>
          <GMIcon name="gear" size={20} />
        </button>
      </div>

      <div style={{ padding: '0 18px' }}>
        {/* Top stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 10 }}>
          <div style={{
            borderRadius: 20, padding: 16, color: '#fff',
            background: `linear-gradient(150deg, ${T.accent}, oklch(from ${T.accent} calc(l - 0.1) c h))`,
            boxShadow: `0 6px 18px oklch(from ${T.accent} l c h / 0.4)`,
          }}>
            <GMIcon name="flame" size={20} />
            <div style={{ marginTop: 6, fontSize: 30, fontWeight: 900, letterSpacing: -0.6, lineHeight: 1 }}>7</div>
            <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.9, marginTop: 2 }}>Day streak</div>
          </div>
          <div style={{
            borderRadius: 20, padding: 16, color: T.text,
            background: T.surface, boxShadow: T.shadow,
          }}>
            <GMIcon name="bolt" size={20} color={`oklch(from ${T.xp} 0.55 0.16 h)`} />
            <div style={{ marginTop: 6, fontSize: 30, fontWeight: 900, letterSpacing: -0.6, lineHeight: 1 }}>1,240</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: T.textMute, marginTop: 2 }}>Total XP</div>
          </div>
        </div>

        {/* Weekly activity */}
        <div style={{ marginTop: 14, background: T.surface, borderRadius: 20, padding: 16, boxShadow: T.shadow }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: T.textMute, letterSpacing: 0.6, textTransform: 'uppercase' }}>XP this week</div>
              <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.3 }}>+420</div>
            </div>
            <div style={{ padding: '4px 10px', borderRadius: 999, background: T.primaryLt, color: T.primaryDk, fontSize: 11, fontWeight: 800 }}>↑ 18% vs last</div>
          </div>
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: 100, gap: 6 }}>
            {week.map((d, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%' }}>
                <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end' }}>
                  <div style={{
                    width: '100%',
                    height: `${d.v * 100}%`,
                    minHeight: d.v > 0 ? 6 : 6,
                    background: d.today ? T.primary : d.v > 0 ? T.primaryLt : T.surface2,
                    borderRadius: 8,
                    boxShadow: d.today ? `inset 0 -3px 0 ${T.primaryDk}` : 'none',
                  }} />
                </div>
                <div style={{ fontSize: 11, fontWeight: 800, color: d.today ? T.primary : T.textMute }}>{d.d}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Topic mastery */}
        <div style={{ marginTop: 18 }}>
          <GMHeading theme={T} action="Details">Mastery by topic</GMHeading>
          <div style={{ background: T.surface, borderRadius: 20, padding: 14, boxShadow: T.shadow, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {topics.map((t, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <div style={{ fontSize: 13, fontWeight: 800 }}>{t.name}</div>
                  <div style={{ fontSize: 12, fontWeight: 900, color: t.color, fontFamily: GM_MONO }}>{t.pct}%</div>
                </div>
                <GMProgress value={t.pct / 100} color={t.color} theme={T} height={6} />
              </div>
            ))}
          </div>
        </div>

        {/* AI recommendation */}
        <div style={{ marginTop: 14, background: `linear-gradient(135deg, oklch(from ${T.ai} 0.95 0.04 h), ${T.surface})`, border: `1px solid oklch(from ${T.ai} 0.88 0.06 h)`, borderRadius: 20, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: T.ai, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <GMIcon name="lightbulb" size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: T.ai, letterSpacing: 0.5, textTransform: 'uppercase' }}>Recommended</div>
            <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: -0.2, marginTop: 1 }}>5 min on <span style={{ color: T.accent }}>Trigonometry</span></div>
            <div style={{ fontSize: 11, color: T.textMute, fontWeight: 600, marginTop: 1 }}>Your weakest area this week</div>
          </div>
          <GMIcon name="arrow-right" size={18} color={T.ai} />
        </div>
      </div>

      <GMTabBar active="me" theme={T} />
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// SCREEN 8 — Gamification (XP / streaks / badges hub)
// ═════════════════════════════════════════════════════════════
function ScrGamification({ theme: T, age, gamification }) {
  const badges = [
    { name: 'First Win',   unlocked: true,  tone: 'mint',   icon: 'star' },
    { name: 'Streak x7',   unlocked: true,  tone: 'amber',  icon: 'flame' },
    { name: '100 XP',      unlocked: true,  tone: 'amber',  icon: 'bolt' },
    { name: 'Quadratic',   unlocked: true,  tone: 'purple', icon: 'graph' },
    { name: 'Perfect 10',  unlocked: false, tone: 'mint',   icon: 'check' },
    { name: 'Geometry',    unlocked: false, tone: 'purple', icon: 'trophy' },
    { name: 'Streak x30',  unlocked: false, tone: 'amber',  icon: 'flame' },
    { name: '1000 XP',     unlocked: false, tone: 'amber',  icon: 'bolt' },
  ];
  return (
    <div style={{ width: '100%', height: '100%', background: T.bg, color: T.text, fontFamily: GM_FONT, position: 'relative', overflow: 'auto', paddingTop: 54, paddingBottom: 96, boxSizing: 'border-box' }}>
      <div style={{ padding: '8px 18px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.3 }}>Quests & rewards</div>
        <button style={{ width: 40, height: 40, borderRadius: 12, border: 'none', background: T.surface, color: T.text, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: T.shadow }}>
          <GMIcon name="trophy" size={20} color={`oklch(from ${T.xp} 0.55 0.16 h)`} />
        </button>
      </div>

      <div style={{ padding: '0 18px' }}>
        {/* Level hero */}
        <div style={{
          borderRadius: 24, padding: 20, color: '#fff',
          background: `linear-gradient(135deg, oklch(from ${T.xp} 0.65 0.18 h), oklch(from ${T.accent} 0.62 0.20 h))`,
          boxShadow: `0 12px 28px oklch(from ${T.xp} 0.55 0.18 h / 0.35)`,
          position: 'relative', overflow: 'hidden',
          display: 'flex', gap: 14, alignItems: 'center',
        }}>
          {/* trophy block */}
          <div style={{ width: 78, height: 78, borderRadius: 22, background: 'rgba(255,255,255,0.22)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '2px solid rgba(255,255,255,0.3)' }}>
            <GMIcon name="trophy" size={42} stroke={2.2} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.9, letterSpacing: 0.6, textTransform: 'uppercase' }}>Level 8 · Math Pro</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
              <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: -0.4 }}>1,240</div>
              <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.8 }}>/ 1,500 XP</div>
            </div>
            <div style={{ marginTop: 8, height: 8, borderRadius: 999, background: 'rgba(0,0,0,0.2)', overflow: 'hidden' }}>
              <div style={{ width: '82%', height: '100%', background: '#fff', borderRadius: 999 }} />
            </div>
            <div style={{ marginTop: 6, fontSize: 12, opacity: 0.9, fontWeight: 700 }}>260 XP to Level 9</div>
          </div>
        </div>

        {/* Streak strip */}
        <div style={{ marginTop: 14, background: T.surface, borderRadius: 20, padding: 16, boxShadow: T.shadow }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: `oklch(from ${T.accent} 0.95 0.04 h)`, color: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GMIcon name="flame" size={24} stroke={2.2} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: -0.2 }}>7 day streak</div>
              <div style={{ fontSize: 12, color: T.textMute, fontWeight: 700 }}>Practise today to keep the flame</div>
            </div>
          </div>
          <div style={{ marginTop: 14, display: 'flex', gap: 6, justifyContent: 'space-between' }}>
            {['M','T','W','T','F','S','S'].map((d, i) => {
              const lit = i <= 5;
              const today = i === 5;
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 10,
                    background: lit ? T.accent : T.surface2,
                    color: lit ? '#fff' : T.textMute,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: today ? `0 0 0 3px oklch(from ${T.accent} 0.85 0.08 h)` : 'none',
                  }}>
                    {lit ? <GMIcon name="fire-small" size={16} /> : null}
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: today ? T.accent : T.textMute }}>{d}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Daily quests */}
        <div style={{ marginTop: 18 }}>
          <GMHeading theme={T} eyebrow="Daily quests">Today's challenges</GMHeading>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { title: 'Earn 50 XP',          progress: 0.6,  current: '30 / 50', icon: 'bolt',  color: T.xp,      done: false },
              { title: 'Complete 3 lessons',  progress: 1.0,  current: '3 / 3',   icon: 'check', color: T.primary, done: true },
              { title: 'Solve 1 with AI',     progress: 0.0,  current: '0 / 1',   icon: 'camera',color: T.ai,      done: false },
            ].map((q, i) => (
              <div key={i} style={{ background: T.surface, borderRadius: 16, padding: 14, boxShadow: T.shadow, opacity: q.done ? 0.7 : 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: q.done ? T.primary : `oklch(from ${q.color} 0.94 0.06 h)`, color: q.done ? '#fff' : q.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <GMIcon name={q.done ? 'check' : q.icon} size={20} stroke={q.done ? 3 : 2} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: -0.1, textDecoration: q.done ? 'line-through' : 'none' }}>{q.title}</div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: T.textMute, fontFamily: GM_MONO }}>{q.current}</div>
                    </div>
                    <div style={{ marginTop: 6 }}>
                      <GMProgress value={q.progress} color={q.done ? T.primary : q.color} theme={T} height={6} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Badges */}
        <div style={{ marginTop: 18 }}>
          <GMHeading theme={T} action="See all">Badges</GMHeading>
          <div style={{ background: T.surface, borderRadius: 20, padding: 16, boxShadow: T.shadow }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {badges.map((b, i) => {
                const toneBg = {
                  mint: T.primaryLt, amber: `oklch(from ${T.xp} 0.93 0.08 h)`, purple: `oklch(from ${T.ai} 0.93 0.05 h)`,
                };
                const toneFg = {
                  mint: T.primary, amber: `oklch(from ${T.xp} 0.45 0.14 h)`, purple: T.ai,
                };
                const lockedBg = T.surface2;
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div style={{
                      width: 56, height: 56, borderRadius: 18,
                      background: b.unlocked ? toneBg[b.tone] : lockedBg,
                      color: b.unlocked ? toneFg[b.tone] : T.textMute,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: b.unlocked ? `0 2px 0 ${b.tone === 'mint' ? T.primary : b.tone === 'amber' ? `oklch(from ${T.xp} 0.55 0.16 h)` : T.ai}` : 'none',
                      position: 'relative',
                    }}>
                      <GMIcon name={b.unlocked ? b.icon : 'lock-mini'} size={24} stroke={2.4} />
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: b.unlocked ? T.text : T.textMute, textAlign: 'center', lineHeight: 1.2 }}>{b.name}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <GMTabBar active="me" theme={T} />
    </div>
  );
}

Object.assign(window, {
  ScrTutor, ScrGraphing, ScrProgress, ScrGamification,
});
