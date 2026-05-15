export const student = {
  name: "Lerato",
  grade: 8,
  avatar: "🦊",
  xp: 2480,
  level: 12,
  nextLevelXp: 3000,
  coins: 184,
  streak: 17,
  dailyGoal: { done: 35, target: 50 },
};

export const continueLesson = {
  topic: "Quadratic Equations",
  chapter: "Chapter 3 · Algebra",
  progress: 0.62,
  minutesLeft: 6,
};

export const recommended = [
  { id: "l1", title: "Pythagoras in real life", topic: "Geometry", emoji: "📐", duration: 8, xp: 40, color: "primary" },
  { id: "l2", title: "Linear graphs", topic: "Algebra", emoji: "📈", duration: 12, xp: 60, color: "info" },
  { id: "l3", title: "Probability basics", topic: "Stats", emoji: "🎲", duration: 7, xp: 35, color: "accent" },
  { id: "l4", title: "Trig ratios", topic: "Trigonometry", emoji: "🔺", duration: 10, xp: 50, color: "xp" },
];

export const dailyChallenge = {
  title: "Solve 5 quadratics in under 4 minutes",
  reward: 80,
  progress: 2,
  total: 5,
};

export const achievements = [
  { id: "a1", name: "Streak Starter", emoji: "🔥", earned: true, desc: "7-day streak" },
  { id: "a2", name: "Quick Solver", emoji: "⚡", earned: true, desc: "Solve in <30s" },
  { id: "a3", name: "Algebra Pro", emoji: "🧮", earned: true, desc: "Master 10 algebra topics" },
  { id: "a4", name: "Geometry Guru", emoji: "📐", earned: false, desc: "Master 10 geometry topics" },
  { id: "a5", name: "Perfect Week", emoji: "🏆", earned: false, desc: "100% goals all week" },
  { id: "a6", name: "Night Owl", emoji: "🌙", earned: false, desc: "Study after 9pm" },
];

export const masteryByTopic = [
  { topic: "Algebra", mastery: 82 },
  { topic: "Geometry", mastery: 64 },
  { topic: "Trig", mastery: 48 },
  { topic: "Stats", mastery: 71 },
  { topic: "Calculus", mastery: 22 },
  { topic: "Numbers", mastery: 90 },
];

export const weeklyMinutes = [
  { day: "Mon", min: 22 },
  { day: "Tue", min: 35 },
  { day: "Wed", min: 18 },
  { day: "Thu", min: 42 },
  { day: "Fri", min: 30 },
  { day: "Sat", min: 55 },
  { day: "Sun", min: 38 },
];

export const masteryTrend = [
  { week: "W1", score: 42 },
  { week: "W2", score: 51 },
  { week: "W3", score: 58 },
  { week: "W4", score: 64 },
  { week: "W5", score: 70 },
  { week: "W6", score: 76 },
];

export const leaderboard = [
  { rank: 1, name: "Sipho M.", xp: 3120, avatar: "🦁" },
  { rank: 2, name: "Naledi K.", xp: 2980, avatar: "🦒" },
  { rank: 3, name: "Lerato (You)", xp: 2480, avatar: "🦊", you: true },
  { rank: 4, name: "Thandi P.", xp: 2410, avatar: "🐢" },
  { rank: 5, name: "Kabelo S.", xp: 2200, avatar: "🐧" },
];

export const weakAreas = [
  { topic: "Trigonometric identities", score: 38, lessons: 3 },
  { topic: "Quadratic word problems", score: 44, lessons: 4 },
  { topic: "Probability trees", score: 52, lessons: 2 },
];

export const tutorChat = [
  { role: "ai" as const, text: "Hey Lerato 👋 Want help with quadratics today?" },
  { role: "user" as const, text: "Yes — I don't get how to factorize x² + 5x + 6" },
  { role: "ai" as const, text: "Great question. We need two numbers that **multiply to 6** and **add to 5**. What numbers work?" },
  { role: "user" as const, text: "2 and 3?" },
  { role: "ai" as const, text: "Exactly ⭐ So x² + 5x + 6 = (x + 2)(x + 3). Want to try one yourself?" },
];

export const tutorPrompts = [
  "Explain Pythagoras simply",
  "Help me with my homework",
  "Quiz me on fractions",
  "What's a derivative?",
];

export const lessonOutline = [
  { id: 1, title: "What is a quadratic?", done: true, duration: 4 },
  { id: 2, title: "Standard form", done: true, duration: 5 },
  { id: 3, title: "Factorising", done: true, duration: 7 },
  { id: 4, title: "The quadratic formula", done: false, current: true, duration: 9 },
  { id: 5, title: "Graphing parabolas", done: false, duration: 8 },
  { id: 6, title: "Word problems", done: false, duration: 12 },
];

export const solverSteps = [
  { step: "Identify coefficients", math: "a = 1, b = 5, c = 6" },
  { step: "Find two numbers", math: "p · q = 6,  p + q = 5  →  2, 3" },
  { step: "Factor the expression", math: "(x + 2)(x + 3) = 0" },
  { step: "Solve each factor", math: "x = -2  or  x = -3" },
];

// Parent dashboard
export const children = [
  { id: "c1", name: "Lerato", grade: 8, avatar: "🦊", active: true },
  { id: "c2", name: "Thabo", grade: 5, avatar: "🐼", active: false },
];

export const parentSummary = {
  weeklyMinutes: 240,
  weeklyGoalPct: 86,
  lessonsCompleted: 14,
  topicsMastered: 3,
};

export const recentActivity = [
  { time: "Today, 4:12pm", text: "Completed 'Factorising quadratics'", xp: 60 },
  { time: "Today, 3:55pm", text: "Earned badge: Algebra Pro", xp: 100 },
  { time: "Yesterday", text: "12 problems solved with AI tutor", xp: 45 },
  { time: "Yesterday", text: "Started 'Trig ratios'", xp: 0 },
];
