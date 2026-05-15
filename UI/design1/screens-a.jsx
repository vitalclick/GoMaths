// screens-a.jsx — Onboarding, Home, Solver, Learning
// Each export takes { theme, age, gamification } where:
//   theme: from gmTheme()
//   age: 'young' (8-11), 'unified' (8-16 default), 'older' (12-16)
//   gamification: 'subtle' | 'medium' | 'loud'

// ─────────────────────────────────────────────────────────────
// Helpers used across screens
// ─────────────────────────────────────────────────────────────
const gmAgeScale = (age, base) => ({
  young:   base * 1.12,
  unified: base,
  older:   base * 0.92,
}[age] || base);

const gmGameOn = (g, threshold = 'medium') => {
  const levels = { subtle: 0, medium: 1, loud: 2 };
  return levels[g] >= levels[threshold];
};

// ═════════════════════════════════════════════════════════════
// SCREEN 1A — Onboarding Welcome
// ═════════════════════════════════════════════════════════════
function ScrOnboardWelcome({ theme: T, age, gamification }) {
  return (
    <div style={{
      width: '100%', height: '100%', background: T.bg, color: T.text,
      fontFamily: GM_FONT, position: 'relative', overflow: 'hidden',
      paddingTop: 60, boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* decorative blobs */}
      <div style={{ position: 'absolute', top: -40, right: -30, width: 180, height: 180, borderRadius: '50%', background: T.primaryLt, opacity: 0.7 }} />
      <div style={{ position: 'absolute', top: 90, left: -50, width: 120, height: 120, borderRadius: '50%', background: `oklch(from ${T.ai} 0.93 0.06 h)`, opacity: 0.6 }} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 32px', textAlign: 'center', position: 'relative' }}>
        <Maxi size={140} theme={T} />
        <div style={{ marginTop: 28, fontSize: gmAgeScale(age, 32), fontWeight: 900, letterSpacing: -0.8, lineHeight: 1.05 }}>
          Hi, I'm Maxi!
        </div>
        <div style={{ marginTop: 12, fontSize: 17, color: T.textDim, lineHeight: 1.45, maxWidth: 280 }}>
          Your math buddy. Together we'll turn tricky problems into wins — one streak at a time.
        </div>

        {/* Floating math chips */}
        <div style={{ position: 'absolute', top: 30, left: 24, padding: '8px 14px', borderRadius: 999, background: T.surface, fontFamily: GM_MONO, fontSize: 13, fontWeight: 700, color: T.primary, boxShadow: T.shadow, transform: 'rotate(-8deg)' }}>
          x² + 2x
        </div>
        <div style={{ position: 'absolute', top: 60, right: 28, padding: '8px 14px', borderRadius: 999, background: T.surface, fontFamily: GM_MONO, fontSize: 13, fontWeight: 700, color: T.accent, boxShadow: T.shadow, transform: 'rotate(6deg)' }}>
          √169
        </div>
        <div style={{ position: 'absolute', bottom: 30, right: 18, padding: '8px 14px', borderRadius: 999, background: T.surface, fontFamily: GM_MONO, fontSize: 13, fontWeight: 700, color: T.ai, boxShadow: T.shadow, transform: 'rotate(10deg)' }}>
          ½ + ⅓
        </div>
      </div>

      <div style={{ padding: '0 24px 36px', display: 'flex', flexDirection: 'column', gap: 10, position: 'relative' }}>
        <GMButton variant="primary" size="lg" full theme={T} icon="arrow-right">Get started</GMButton>
        <GMButton variant="ghost" size="md" full theme={T}>I already have an account</GMButton>
        {/* page dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 6 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ width: i === 0 ? 22 : 6, height: 6, borderRadius: 3, background: i === 0 ? T.primary : T.border }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// SCREEN 1B — Onboarding Grade selection
// ═════════════════════════════════════════════════════════════
function ScrOnboardGrade({ theme: T, age, gamification }) {
  const grades = [
    { id: 'R',  label: 'Grade R',   sub: 'Ages 5–6',   tone: 'amber' },
    { id: '1-3',label: 'Grade 1–3', sub: 'Foundation', tone: 'mint' },
    { id: '4-6',label: 'Grade 4–6', sub: 'Intermediate', tone: 'purple' },
    { id: '7-9',label: 'Grade 7–9', sub: 'Senior',     tone: 'mint',   active: true },
    { id: '10', label: 'Grade 10',  sub: 'FET',        tone: 'amber' },
    { id: '11', label: 'Grade 11',  sub: 'FET',        tone: 'purple' },
    { id: '12', label: 'Grade 12',  sub: 'Matric',     tone: 'mint' },
  ];
  return (
    <div style={{ width: '100%', height: '100%', background: T.bg, color: T.text, fontFamily: GM_FONT, position: 'relative', paddingTop: 60, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 24px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button style={{ width: 40, height: 40, borderRadius: 12, border: 'none', background: T.surface, color: T.text, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: T.shadow }}>
          <GMIcon name="arrow-left" size={20} />
        </button>
        <div style={{ display: 'flex', gap: 6 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ width: i === 1 ? 22 : 6, height: 6, borderRadius: 3, background: i === 1 ? T.primary : T.border }} />
          ))}
        </div>
        <div style={{ width: 40 }} />
      </div>

      <div style={{ padding: '8px 24px 16px' }}>
        <div style={{ fontSize: gmAgeScale(age, 28), fontWeight: 900, letterSpacing: -0.6, lineHeight: 1.1 }}>What grade are you in?</div>
        <div style={{ marginTop: 6, color: T.textDim, fontSize: 15 }}>We'll match the curriculum to your year.</div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '4px 24px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {grades.map(g => {
          const tones = {
            mint:   T.primaryLt,
            purple: `oklch(from ${T.ai} 0.93 0.05 h)`,
            amber:  `oklch(from ${T.xp} 0.94 0.06 h)`,
          };
          const tonesFg = {
            mint:   T.primary,
            purple: T.ai,
            amber:  `oklch(from ${T.xp} 0.45 0.12 h)`,
          };
          return (
            <div key={g.id} style={{
              background: g.active ? T.primary : T.surface,
              color: g.active ? '#fff' : T.text,
              borderRadius: 18, padding: '14px 16px',
              display: 'flex', alignItems: 'center', gap: 14,
              boxShadow: g.active ? `0 8px 24px oklch(from ${T.primary} l c h / 0.4)` : T.shadow,
              border: g.active ? `2px solid ${T.primaryDk}` : `2px solid transparent`,
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: g.active ? 'rgba(255,255,255,0.18)' : tones[g.tone],
                color: g.active ? '#fff' : tonesFg[g.tone],
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: GM_FONT, fontWeight: 900, fontSize: 16, letterSpacing: -0.2,
              }}>{g.id}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 900, fontSize: 16, letterSpacing: -0.2 }}>{g.label}</div>
                <div style={{ fontSize: 12, color: g.active ? 'rgba(255,255,255,0.85)' : T.textMute, fontWeight: 600, marginTop: 2 }}>{g.sub}</div>
              </div>
              {g.active && (
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <GMIcon name="check" size={16} stroke={3} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ padding: '12px 24px 28px' }}>
        <GMButton variant="primary" size="lg" full theme={T} icon="arrow-right">Continue</GMButton>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// SCREEN 1C — Onboarding Avatar
// ═════════════════════════════════════════════════════════════
function ScrOnboardAvatar({ theme: T, age, gamification }) {
  const avatars = [
    { hue: 148, label: 'Maxi',    active: true },
    { hue: 25,  label: 'Pixel' },
    { hue: 290, label: 'Nova' },
    { hue: 75,  label: 'Sunny' },
    { hue: 200, label: 'Sky' },
    { hue: 320, label: 'Berry' },
  ];
  const ActiveAvatar = ({ hue, size = 96 }) => (
    <div style={{ width: size, height: size, position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 35% 30%, oklch(0.72 0.16 ${hue}), oklch(0.5 0.16 ${hue}))`, borderRadius: '38%', boxShadow: `0 4px 14px oklch(0.5 0.16 ${hue} / 0.4)` }} />
      <div style={{ position: 'absolute', top: '20%', left: '18%', width: '28%', height: '22%', background: 'rgba(255,255,255,0.35)', borderRadius: '50%', filter: 'blur(2px)' }} />
      <div style={{ position: 'absolute', top: '42%', left: '20%', width: '14%', height: '14%', background: '#0E1A14', borderRadius: '50%' }} />
      <div style={{ position: 'absolute', top: '42%', right: '20%', width: '14%', height: '14%', background: '#0E1A14', borderRadius: '50%' }} />
      <div style={{ position: 'absolute', bottom: '22%', left: '32%', width: '36%', height: '18%', borderBottom: `${size * 0.05}px solid #0E1A14`, borderRadius: '0 0 50% 50% / 0 0 100% 100%' }} />
    </div>
  );
  return (
    <div style={{ width: '100%', height: '100%', background: T.bg, color: T.text, fontFamily: GM_FONT, position: 'relative', paddingTop: 60, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 24px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button style={{ width: 40, height: 40, borderRadius: 12, border: 'none', background: T.surface, color: T.text, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: T.shadow }}>
          <GMIcon name="arrow-left" size={20} />
        </button>
        <div style={{ display: 'flex', gap: 6 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ width: i === 2 ? 22 : 6, height: 6, borderRadius: 3, background: i === 2 ? T.primary : T.border }} />
          ))}
        </div>
        <div style={{ width: 40 }} />
      </div>

      <div style={{ padding: '8px 24px 20px' }}>
        <div style={{ fontSize: gmAgeScale(age, 28), fontWeight: 900, letterSpacing: -0.6, lineHeight: 1.1 }}>Pick your buddy</div>
        <div style={{ marginTop: 6, color: T.textDim, fontSize: 15 }}>They'll cheer you on every day.</div>
      </div>

      {/* Active preview */}
      <div style={{ display: 'flex', justifyContent: 'center', position: 'relative', padding: '20px 0 24px' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 200, height: 200, borderRadius: '50%', background: `radial-gradient(circle, ${T.primaryLt} 0%, transparent 70%)` }} />
        <div style={{ position: 'relative' }}>
          <ActiveAvatar hue={148} size={140} />
          {/* sparkles */}
          <div style={{ position: 'absolute', top: -6, right: -10, color: T.xp }}><GMIcon name="sparkle" size={20} /></div>
          <div style={{ position: 'absolute', bottom: 0, left: -16, color: T.ai }}><GMIcon name="sparkle" size={14} /></div>
        </div>
      </div>

      <div style={{ padding: '0 24px', flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: T.textMute, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Choose a colour</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
          {avatars.map(a => (
            <div key={a.hue} style={{
              aspectRatio: '1', borderRadius: 14, padding: 4,
              background: a.active ? T.surface : 'transparent',
              border: a.active ? `2px solid ${T.primary}` : '2px solid transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ActiveAvatar hue={a.hue} size={36} />
            </div>
          ))}
        </div>

        <div style={{ marginTop: 24, fontSize: 13, fontWeight: 800, color: T.textMute, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Name</div>
        <div style={{ background: T.surface, borderRadius: 14, padding: '14px 16px', boxShadow: T.shadow, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 17, fontWeight: 700 }}>Maxi</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: T.primary }}>Edit</div>
        </div>
      </div>

      <div style={{ padding: '20px 24px 28px' }}>
        <GMButton variant="primary" size="lg" full theme={T} icon="arrow-right">Let's go!</GMButton>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// SCREEN 2 — Home Dashboard
// ═════════════════════════════════════════════════════════════
function ScrHome({ theme: T, age, gamification }) {
  const showLoud = gmGameOn(gamification, 'loud');
  return (
    <div style={{ width: '100%', height: '100%', background: T.bg, color: T.text, fontFamily: GM_FONT, position: 'relative', overflow: 'auto', paddingTop: 54, paddingBottom: 96, boxSizing: 'border-box' }}>
      {/* Header */}
      <div style={{ padding: '10px 18px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Maxi size={44} theme={T} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: T.textDim, fontWeight: 600 }}>Howzit, Thando 👋</div>
          <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: -0.3 }}>Ready for today?</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <GMPill icon="flame" label="7" color={T.accent} bg={`oklch(from ${T.accent} 0.95 0.04 h)`} theme={T} />
          <GMPill icon="bolt" label="1,240" color={`oklch(from ${T.xp} 0.40 0.14 h)`} bg={`oklch(from ${T.xp} 0.94 0.08 h)`} theme={T} />
        </div>
      </div>

      <div style={{ padding: '0 18px' }}>
        {/* Daily goal hero card */}
        <div style={{
          borderRadius: 24, padding: 20, color: '#fff',
          background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDk})`,
          boxShadow: `0 12px 28px oklch(from ${T.primary} l c h / 0.4)`,
          position: 'relative', overflow: 'hidden',
        }}>
          {/* decorative */}
          <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ position: 'absolute', bottom: -30, right: 30, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase', opacity: 0.9 }}>
            <GMIcon name="bolt" size={14} /> Daily goal
          </div>
          <div style={{ marginTop: 6, fontSize: 26, fontWeight: 900, letterSpacing: -0.4, lineHeight: 1.1 }}>3 of 5 lessons</div>
          <div style={{ marginTop: 4, fontSize: 13, opacity: 0.85 }}>2 to go — keep the streak alive 🔥</div>

          <div style={{ marginTop: 16 }}>
            <div style={{ height: 10, borderRadius: 999, background: 'rgba(0,0,0,0.18)', overflow: 'hidden' }}>
              <div style={{ width: '60%', height: '100%', background: '#fff', borderRadius: 999, boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.1)' }} />
            </div>
          </div>

          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {[0,1,2,3,4].map(i => (
                <div key={i} style={{
                  width: 26, height: 26, borderRadius: 8,
                  background: i < 3 ? '#fff' : 'rgba(255,255,255,0.18)',
                  color: i < 3 ? T.primary : 'rgba(255,255,255,0.6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 900,
                }}>{i < 3 ? <GMIcon name="check" size={14} stroke={3.5} /> : i + 1}</div>
              ))}
            </div>
            <button style={{ background: '#fff', color: T.primary, border: 'none', borderRadius: 12, padding: '10px 16px', fontFamily: GM_FONT, fontWeight: 900, fontSize: 14, display: 'flex', alignItems: 'center', gap: 4, boxShadow: '0 2px 0 rgba(0,0,0,0.15)' }}>
              Continue <GMIcon name="arrow-right" size={14} stroke={2.5} />
            </button>
          </div>
        </div>

        {/* Continue learning */}
        <div style={{ marginTop: 22 }}>
          <GMHeading theme={T} action="See all">Continue learning</GMHeading>
          <GMCard theme={T} padding={14}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: `oklch(from ${T.ai} 0.93 0.05 h)`, color: T.ai, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <GMIcon name="graph" size={24} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: T.textMute, letterSpacing: 0.8, textTransform: 'uppercase' }}>Algebra · Grade 9</div>
                <div style={{ fontSize: 15, fontWeight: 900, letterSpacing: -0.2, marginTop: 1 }}>Quadratic equations</div>
                <div style={{ marginTop: 6 }}>
                  <GMProgress value={0.62} theme={T} height={6} />
                </div>
              </div>
              <button style={{ width: 38, height: 38, borderRadius: 12, border: 'none', background: T.primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 2px 0 ${T.primaryDk}` }}>
                <GMIcon name="play" size={14} />
              </button>
            </div>
          </GMCard>
        </div>

        {/* AI tools row */}
        <div style={{ marginTop: 22 }}>
          <GMHeading theme={T} eyebrow="AI tools">Get unstuck fast</GMHeading>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ borderRadius: 18, padding: 14, background: `linear-gradient(135deg, ${T.ai}, oklch(from ${T.ai} calc(l + 0.08) c calc(h + 20)))`, color: '#fff', boxShadow: `0 6px 18px oklch(from ${T.ai} l c h / 0.35)`, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -16, right: -16, width: 70, height: 70, borderRadius: '50%', background: 'rgba(255,255,255,0.15)' }} />
              <GMIcon name="camera" size={22} />
              <div style={{ marginTop: 8, fontSize: 15, fontWeight: 900, letterSpacing: -0.2, position: 'relative' }}>Scan a problem</div>
              <div style={{ fontSize: 11, opacity: 0.85, fontWeight: 600, position: 'relative' }}>Step-by-step</div>
            </div>
            <div style={{ borderRadius: 18, padding: 14, background: T.surface, boxShadow: T.shadow, position: 'relative', overflow: 'hidden' }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: `oklch(from ${T.ai} 0.93 0.05 h)`, color: T.ai, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <GMIcon name="chat" size={20} />
              </div>
              <div style={{ marginTop: 10, fontSize: 15, fontWeight: 900, letterSpacing: -0.2 }}>Ask Maxi</div>
              <div style={{ fontSize: 11, color: T.textMute, fontWeight: 600 }}>AI tutor chat</div>
            </div>
          </div>
        </div>

        {/* Recommended */}
        <div style={{ marginTop: 22 }}>
          <GMHeading theme={T}>Picked for you</GMHeading>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { title: 'Fractions on a number line', topic: 'Grade 6 · Numbers', mins: 6, tone: 'mint',   icon: 'graph' },
              { title: 'Surface area of prisms',     topic: 'Grade 8 · Geometry', mins: 9, tone: 'amber',  icon: 'star' },
              { title: 'Word problems: ratio',       topic: 'Grade 7 · Algebra',  mins: 5, tone: 'purple', icon: 'lightbulb' },
            ].map((it, i) => {
              const bgMap = { mint: T.primaryLt, amber: `oklch(from ${T.xp} 0.94 0.06 h)`, purple: `oklch(from ${T.ai} 0.93 0.05 h)` };
              const fgMap = { mint: T.primary, amber: `oklch(from ${T.xp} 0.45 0.12 h)`, purple: T.ai };
              return (
                <div key={i} style={{ background: T.surface, borderRadius: 16, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: T.shadow }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: bgMap[it.tone], color: fgMap[it.tone], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <GMIcon name={it.icon} size={20} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: T.textMute, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase' }}>{it.topic}</div>
                    <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: -0.1, marginTop: 1 }}>{it.title}</div>
                  </div>
                  <div style={{ fontSize: 11, color: T.textMute, fontWeight: 800 }}>{it.mins} min</div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ height: 16 }} />
      </div>

      <GMTabBar active="home" theme={T} />
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// SCREEN 3 — AI Math Solver (camera + steps result)
// ═════════════════════════════════════════════════════════════
function ScrSolver({ theme: T, age, gamification }) {
  return (
    <div style={{ width: '100%', height: '100%', background: '#0a0d0b', color: '#fff', fontFamily: GM_FONT, position: 'relative', overflow: 'hidden' }}>
      {/* "Camera" view background */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #1a2120 0%, #0d1110 50%, #1a2120 100%)' }} />
      {/* simulated notebook paper */}
      <div style={{ position: 'absolute', top: '24%', left: '8%', right: '8%', bottom: '34%', background: '#f9f7ea', borderRadius: 12, transform: 'rotate(-2deg)', boxShadow: '0 20px 60px rgba(0,0,0,0.6)', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg, transparent 0, transparent 24px, rgba(80,120,180,0.18) 24px, rgba(80,120,180,0.18) 25px)' }} />
        <div style={{ position: 'relative', padding: '22px 20px', fontFamily: GM_MONO, fontWeight: 700, fontSize: 22, color: '#1a2138', letterSpacing: 0.5, lineHeight: '24px' }}>
          <div>2x² + 5x − 3 = 0</div>
          <div style={{ marginTop: 22, opacity: 0.4, fontSize: 14 }}>Solve for x</div>
        </div>
      </div>

      {/* Top status bar area */}
      <div style={{ position: 'absolute', top: 54, left: 0, right: 0, padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 5 }}>
        <button style={{ width: 40, height: 40, borderRadius: 12, border: 'none', background: 'rgba(255,255,255,0.15)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(12px)' }}>
          <GMIcon name="arrow-left" size={20} />
        </button>
        <div style={{ padding: '8px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)', fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.primary, boxShadow: `0 0 8px ${T.primary}` }} />
          Detecting math
        </div>
        <button style={{ width: 40, height: 40, borderRadius: 12, border: 'none', background: 'rgba(255,255,255,0.15)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(12px)' }}>
          <GMIcon name="bolt" size={20} />
        </button>
      </div>

      {/* Scan frame */}
      <div style={{ position: 'absolute', top: '22%', left: '6%', right: '6%', bottom: '32%', pointerEvents: 'none' }}>
        {/* corners */}
        {[
          { top: -2, left: -2, br: { tl: 16 }, b: ['top', 'left'] },
          { top: -2, right: -2, br: { tr: 16 }, b: ['top', 'right'] },
          { bottom: -2, left: -2, br: { bl: 16 }, b: ['bottom', 'left'] },
          { bottom: -2, right: -2, br: { br: 16 }, b: ['bottom', 'right'] },
        ].map((c, i) => (
          <div key={i} style={{
            position: 'absolute', width: 28, height: 28,
            ...(c.top !== undefined && { top: c.top }),
            ...(c.bottom !== undefined && { bottom: c.bottom }),
            ...(c.left !== undefined && { left: c.left }),
            ...(c.right !== undefined && { right: c.right }),
            borderTop:    c.b.includes('top')    ? `3px solid ${T.primary}` : 'none',
            borderBottom: c.b.includes('bottom') ? `3px solid ${T.primary}` : 'none',
            borderLeft:   c.b.includes('left')   ? `3px solid ${T.primary}` : 'none',
            borderRight:  c.b.includes('right')  ? `3px solid ${T.primary}` : 'none',
            borderTopLeftRadius:     c.b.includes('top')    && c.b.includes('left')  ? 12 : 0,
            borderTopRightRadius:    c.b.includes('top')    && c.b.includes('right') ? 12 : 0,
            borderBottomLeftRadius:  c.b.includes('bottom') && c.b.includes('left')  ? 12 : 0,
            borderBottomRightRadius: c.b.includes('bottom') && c.b.includes('right') ? 12 : 0,
          }} />
        ))}
        {/* scan line */}
        <div style={{ position: 'absolute', left: 16, right: 16, top: '60%', height: 2, background: `linear-gradient(90deg, transparent, ${T.primary}, transparent)`, boxShadow: `0 0 12px ${T.primary}` }} />
      </div>

      {/* Bottom solution sheet */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: T.surface, color: T.text, borderRadius: '24px 24px 0 0', boxShadow: '0 -20px 50px rgba(0,0,0,0.4)', padding: '16px 20px 32px', maxHeight: '50%', overflow: 'hidden' }}>
        {/* drag handle */}
        <div style={{ width: 40, height: 4, borderRadius: 2, background: T.border, margin: '0 auto 12px' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: `oklch(from ${T.ai} 0.93 0.05 h)`, color: T.ai, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GMIcon name="sparkle" size={14} />
          </div>
          <div style={{ fontSize: 13, fontWeight: 800, color: T.ai, letterSpacing: 0.4, textTransform: 'uppercase' }}>AI solution</div>
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: 12, fontWeight: 700, color: T.textMute }}>3 steps</div>
        </div>

        <div style={{ marginTop: 10, fontFamily: GM_MONO, fontSize: 22, fontWeight: 700, color: T.text, letterSpacing: 0.4 }}>
          x = ½ <span style={{ color: T.textMute, margin: '0 6px' }}>or</span> x = −3
        </div>

        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { n: 1, label: 'Factor', expr: '(2x − 1)(x + 3) = 0', done: true },
            { n: 2, label: 'Apply zero product', expr: '2x − 1 = 0 · x + 3 = 0', done: true },
            { n: 3, label: 'Solve each', expr: 'x = ½ · x = −3', done: true },
          ].map(s => (
            <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 12, background: T.surface2 }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: T.primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900 }}>{s.n}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: T.textMute, letterSpacing: 0.4, textTransform: 'uppercase' }}>{s.label}</div>
                <div style={{ fontFamily: GM_MONO, fontSize: 13, fontWeight: 700, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.expr}</div>
              </div>
              <GMIcon name="check" size={16} color={T.primary} stroke={3} />
            </div>
          ))}
        </div>

        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <GMButton variant="ai" size="md" theme={T} icon="sparkle" style={{ flex: 1 }}>Explain it</GMButton>
          <GMButton variant="secondary" size="md" theme={T} icon="mic">Listen</GMButton>
        </div>
      </div>

      {/* Shutter button area */}
      <div style={{ position: 'absolute', bottom: 'calc(50% + 24px)', left: 0, right: 0, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
        <div style={{ width: 76, height: 76, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid rgba(255,255,255,0.6)' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fff' }} />
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// SCREEN 4 — Learning topic / lesson detail
// ═════════════════════════════════════════════════════════════
function ScrLearning({ theme: T, age, gamification }) {
  return (
    <div style={{ width: '100%', height: '100%', background: T.bg, color: T.text, fontFamily: GM_FONT, position: 'relative', overflow: 'auto', paddingBottom: 110, boxSizing: 'border-box' }}>
      {/* Hero header with topic art */}
      <div style={{ background: `linear-gradient(160deg, ${T.primary} 0%, ${T.primaryDk} 100%)`, color: '#fff', paddingTop: 54, paddingBottom: 32, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -30, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />

        <div style={{ padding: '8px 18px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button style={{ width: 40, height: 40, borderRadius: 12, border: 'none', background: 'rgba(255,255,255,0.18)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
            <GMIcon name="arrow-left" size={20} />
          </button>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase', opacity: 0.9 }}>Algebra · Grade 9</div>
          <div style={{ width: 40 }} />
        </div>

        <div style={{ padding: '20px 22px 0', position: 'relative' }}>
          <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: -0.6, lineHeight: 1.1 }}>Quadratic<br/>equations</div>
          <div style={{ marginTop: 8, opacity: 0.9, fontSize: 14, maxWidth: 240, lineHeight: 1.45 }}>Solve, graph, and recognise quadratics in real life.</div>

          <div style={{ marginTop: 16, display: 'flex', gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, opacity: 0.7, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase' }}>Lessons</div>
              <div style={{ fontSize: 18, fontWeight: 900 }}>8</div>
            </div>
            <div>
              <div style={{ fontSize: 11, opacity: 0.7, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase' }}>XP</div>
              <div style={{ fontSize: 18, fontWeight: 900 }}>+240</div>
            </div>
            <div>
              <div style={{ fontSize: 11, opacity: 0.7, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase' }}>Time</div>
              <div style={{ fontSize: 18, fontWeight: 900 }}>~45m</div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress overlap card */}
      <div style={{ padding: '0 18px', marginTop: -18, position: 'relative' }}>
        <GMCard theme={T} padding={14}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 800 }}>Topic progress</div>
            <div style={{ fontSize: 13, fontWeight: 900, color: T.primary }}>5 / 8</div>
          </div>
          <GMProgress value={5/8} theme={T} height={8} />
        </GMCard>
      </div>

      {/* Lesson path */}
      <div style={{ padding: '22px 18px 0' }}>
        <GMHeading theme={T}>The path</GMHeading>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { n: 1, title: 'What is a quadratic?',         status: 'done',    type: 'video', mins: 4 },
            { n: 2, title: 'Standard form ax² + bx + c',   status: 'done',    type: 'lesson', mins: 6 },
            { n: 3, title: 'Factoring with two terms',     status: 'done',    type: 'lesson', mins: 7 },
            { n: 4, title: 'Difference of squares',        status: 'done',    type: 'lesson', mins: 5 },
            { n: 5, title: 'Practice: factoring',          status: 'current', type: 'practice', mins: 8 },
            { n: 6, title: 'Quadratic formula',            status: 'locked',  type: 'lesson', mins: 9 },
            { n: 7, title: 'Graphing parabolas',           status: 'locked',  type: 'lesson', mins: 7 },
            { n: 8, title: 'Boss challenge',               status: 'locked',  type: 'boss', mins: 12 },
          ].map((l, i) => {
            const isCurrent = l.status === 'current';
            const isDone = l.status === 'done';
            const isLocked = l.status === 'locked';
            const isBoss = l.type === 'boss';
            const iconMap = { video: 'play', lesson: 'book', practice: 'bolt', boss: 'trophy' };
            return (
              <div key={l.n} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                  background: isCurrent ? T.accent : isDone ? T.primary : isBoss ? `oklch(from ${T.xp} 0.94 0.08 h)` : T.surface2,
                  color: isCurrent ? '#fff' : isDone ? '#fff' : isBoss ? `oklch(from ${T.xp} 0.45 0.12 h)` : T.textMute,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: isCurrent ? `0 4px 12px oklch(from ${T.accent} l c h / 0.4)` : isDone ? `0 2px 0 ${T.primaryDk}` : 'none',
                  position: 'relative',
                }}>
                  {isDone && <GMIcon name="check" size={20} stroke={3} />}
                  {isCurrent && <GMIcon name="play" size={16} />}
                  {isLocked && <GMIcon name={isBoss ? 'trophy' : 'lock-mini'} size={18} />}
                </div>
                <div style={{ flex: 1, minWidth: 0,
                  background: isCurrent ? T.surface : 'transparent',
                  border: isCurrent ? `2px solid ${T.accent}` : '2px solid transparent',
                  padding: isCurrent ? '10px 14px' : '8px 0',
                  borderRadius: 14,
                  boxShadow: isCurrent ? T.shadow : 'none',
                }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: isLocked ? T.textMute : isCurrent ? T.accent : T.textMute, letterSpacing: 0.6, textTransform: 'uppercase' }}>
                    {l.type === 'boss' ? 'Boss · Earn 100 XP' : `${l.type} · ${l.mins} min`}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 900, letterSpacing: -0.2, marginTop: 1, color: isLocked ? T.textMute : T.text, opacity: isLocked ? 0.7 : 1 }}>
                    {l.title}
                  </div>
                </div>
                {isCurrent && (
                  <button style={{ background: T.accent, color: '#fff', border: 'none', borderRadius: 12, padding: '10px 14px', fontFamily: GM_FONT, fontWeight: 900, fontSize: 13, boxShadow: `0 2px 0 oklch(from ${T.accent} calc(l - 0.12) c h)` }}>
                    Start
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <GMTabBar active="learn" theme={T} />
    </div>
  );
}

Object.assign(window, {
  gmAgeScale, gmGameOn,
  ScrOnboardWelcome, ScrOnboardGrade, ScrOnboardAvatar,
  ScrHome, ScrSolver, ScrLearning,
});
