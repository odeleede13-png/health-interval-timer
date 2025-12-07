const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const app = express();
// Middleware
app.use(cors());
app.use(express.json());
// Initialize Supabase
const supabase = createClient(
process.env.SUPABASE_URL,
process.env.SUPABASE_KEY
);
// Define the 6 intervals
const INTERVALS = [
// ===== MORNING PHASE (6 intervals) =====
  {
    id: 1,
    name: "WAKE UP - Morning Meds",
    duration: 300, // 5 minutes (alert only)
    relativeTime: "0 min",
    sound: "loud-bell",
    priority: "CRITICAL",
    action: "Vyvanse 50mg + Atomoxetine + Magnesium Dose 1",
    notes: "Drink 250ml water FIRST. Dehydration risk with Vyvanse + dumping syndrome.",
    category: "MEDICATION"
  },
  
  {
    id: 2,
    name: "No Food - Vyvanse Absorption",
    duration: 2700, // 45 minutes (extended from 30min for slow metabolism)
    relativeTime: "5 min",
    sound: "gentle-chime",
    priority: "HIGH",
    action: "NO food. Light activity OK. Light sips of water if thirsty.",
    notes: "Vyvanse needs absorption time without food. Delayed onset (75-120 min) due to Prozac.",
    category: "PREP"
  },
  
  {
    id: 3,
    name: "Hydration Window - Check Thirst",
    duration: 900, // 15 minutes
    relativeTime: "50 min",
    sound: "water-drop",
    priority: "MEDIUM",
    action: "Drink 200-250ml water slowly. Room temp or warm. NO carbonation.",
    notes: "Post-sleeve: avoid gas bloating + distension",
    category: "HYDRATION"
  },
  
  {
    id: 4,
    name: "Vyvanse Window - Ready for Meal 1",
    duration: 3600, // 60 minutes
    relativeTime: "65 min",
    sound: "preparation-chime",
    priority: "MEDIUM",
    action: "Prepare Meal 1. Have acarbose tablet ready at place setting.",
    notes: "Optimal absorption peak onset window. Meal 1 @ 90-120 min post-Vyvanse.",
    category: "PREP"
  },
  
  {
    id: 5,
    name: "BREAKFAST - Mental Clarity Checkpoint",
    duration: 300, // 5 minutes (self-check)
    relativeTime: "125 min",
    sound: "checklist-tone",
    priority: "INFO",
    action: "Mental state check: Clarity? Anxiety? Jitter? Log if present.",
    notes: "Vyvanse should be ramping 90-120 min in. Note any sensations for dashboard.",
    category: "CHECK-IN"
  },
  
  // ===== MEAL CYCLE 1: Breakfast (5 intervals) =====
  // TEMPLATE: Each meal repeats this pattern 6 times
  {
    id: 6,
    name: "🔴 Meal 1 (Breakfast) - ACARBOSE AT BITE",
    duration: 300, // 5 seconds (alert)
    relativeTime: "130 min",
    sound: "loud-bell",
    priority: "CRITICAL",
    action: "Take FULL acarbose tablet 50mg + Prenatal Iron capsule + START EATING slowly",
    notes: "First bite: take acarbose. Iron with food. Chew thoroughly (30 chews/bite).",
    category: "MEAL_START"
  },
  
  {
    id: 7,
    name: "🟢 Eat Meal 1 - Breakfast",
    duration: 900, // 15 minutes
    relativeTime: "135 min",
    sound: "silent",
    priority: "CRITICAL",
    action: "Eat slowly. Stop when satisfied (100-150ml capacity). NO carbonation/hot/cold.",
    notes: "Dumping risk MODERATE. Focus on mechanical action: chew, swallow. Appetite suppressed.",
    category: "MEAL_EAT",
    mealNumber: 1,
    acarboseDose: "full-50mg",
    specialMeds: "Prenatal Iron"
  },
  
  {
    id: 8,
    name: "🟡 Rest & Digest (Post-Meal 1)",
    duration: 1200, // 20 minutes
    relativeTime: "150 min",
    sound: "soothing-tone",
    priority: "HIGH",
    action: "NO food. NO water (only small sips). Sit/lie down. PEAK DUMPING WINDOW.",
    notes: "First 20 min post-meal = PEAK dumping risk. Watch for: nausea, palpitations, sweating.",
    category: "DIGEST",
    dumpingRisk: "PEAK"
  },
  
  {
    id: 9,
    name: "💧 Hydrate Actively (Post-Meal 1)",
    duration: 900, // 15 minutes
    relativeTime: "170 min",
    sound: "water-drop",
    priority: "HIGH",
    action: "Drink 250-300ml water slowly. Room temp. Sip, don't gulp.",
    notes: "Safe hydration window (20+ min post-meal ensures gastric emptying begun).",
    category: "HYDRATION"
  },
  
  {
    id: 10,
    name: "⏸ Digestive Pause",
    duration: 600, // 10 minutes
    relativeTime: "185 min",
    sound: "subtle-notification",
    priority: "LOW",
    action: "Bathroom break if needed. Light movement OK. Prepare for Meal 2.",
    notes: "Brief transition before next meal. Stomach complete evacuation.",
    category: "TRANSITION"
  },
  
  // ===== MEAL CYCLE 2-6: Repeat Pattern (5 times) =====
  // Meal 2 (Mid-morning)
  {
    id: 11,
    name: "🔴 Meal 2 - ACARBOSE AT BITE",
    duration: 300,
    relativeTime: "195 min", // ~3h 15min from wake
    sound: "loud-bell",
    priority: "CRITICAL",
    action: "Take HALF acarbose tablet 25mg + START EATING",
    notes: "Smaller meal = half tablet. Peak focus window still active.",
    category: "MEAL_START",
    mealNumber: 2,
    acarboseDose: "half-25mg"
  },
  
  {
    id: 12,
    name: "🟢 Eat Meal 2 - Mid-morning",
    duration: 900,
    relativeTime: "200 min",
    sound: "silent",
    priority: "CRITICAL",
    action: "Eat slowly (10-15 min). Stop when satisfied.",
    notes: "PEAK FOCUS TIME! 8-9/10 focus. Vyvanse at peak. Best for complex work.",
    category: "MEAL_EAT",
    mealNumber: 2,
    acarboseDose: "half-25mg"
  },
  
  {
    id: 13,
    name: "🟡 Rest & Digest (Post-Meal 2)",
    duration: 1200,
    relativeTime: "215 min",
    sound: "soothing-tone",
    priority: "HIGH",
    action: "Rest 20 min. Dumping window.",
    notes: "Still in peak focus. Anxiety can spike if dumping occurs.",
    category: "DIGEST",
    dumpingRisk: "PEAK"
  },
  
  {
    id: 14,
    name: "💧 Hydrate (Post-Meal 2)",
    duration: 900,
    relativeTime: "235 min",
    sound: "water-drop",
    priority: "HIGH",
    action: "Drink 250-300ml water slowly.",
    notes: "Maintain hydration. Vyvanse + dumping = fluid loss.",
    category: "HYDRATION"
  },
  
  {
    id: 15,
    name: "⏸ Digestive Pause",
    duration: 600,
    relativeTime: "250 min",
    sound: "subtle-notification",
    priority: "LOW",
    action: "Light movement. Prepare for Meal 3.",
    notes: "Transition.",
    category: "TRANSITION"
  },
  
  // Meal 3 (Lunch) - MAIN MEAL
  {
    id: 16,
    name: "🔴 Meal 3 (Lunch) - ACARBOSE AT BITE",
    duration: 300,
    relativeTime: "260 min", // ~4h 20min from wake
    sound: "loud-bell",
    priority: "CRITICAL",
    action: "Take FULL acarbose 50mg + START EATING",
    notes: "Main meal #2. Large acarbose dose.",
    category: "MEAL_START",
    mealNumber: 3,
    acarboseDose: "full-50mg"
  },
  
  {
    id: 17,
    name: "🟢 Eat Meal 3 - Lunch",
    duration: 900,
    relativeTime: "265 min",
    sound: "silent",
    priority: "CRITICAL",
    action: "Eat slowly. Stop when satisfied.",
    notes: "Still good focus (7-8/10). Eat mindfully.",
    category: "MEAL_EAT",
    mealNumber: 3,
    acarboseDose: "full-50mg"
  },
  
  {
    id: 18,
    name: "🟡 Rest & Digest (Post-Meal 3)",
    duration: 1200,
    relativeTime: "280 min",
    sound: "soothing-tone",
    priority: "HIGH",
    action: "Rest 20 min. Dumping window.",
    notes: "Dumping peak. Moderate focus still.",
    category: "DIGEST",
    dumpingRisk: "PEAK"
  },
  
  {
    id: 19,
    name: "💧 Hydrate (Post-Meal 3)",
    duration: 900,
    relativeTime: "300 min",
    sound: "water-drop",
    priority: "HIGH",
    action: "Drink 250-300ml water.",
    notes: "",
    category: "HYDRATION"
  },
  
  {
    id: 20,
    name: "⏸ Digestive Pause",
    duration: 600,
    relativeTime: "315 min",
    sound: "subtle-notification",
    priority: "LOW",
    action: "Prepare for Meal 4.",
    notes: "Transition.",
    category: "TRANSITION"
  },
  
  // Meal 4 (Afternoon)
  {
    id: 21,
    name: "🔴 Meal 4 - ACARBOSE AT BITE",
    duration: 300,
    relativeTime: "325 min", // ~5h 25min from wake
    sound: "loud-bell",
    priority: "CRITICAL",
    action: "Take HALF acarbose 25mg + START EATING",
    notes: "Smaller meal. Focus declining.",
    category: "MEAL_START",
    mealNumber: 4,
    acarboseDose: "half-25mg"
  },
  
  {
    id: 22,
    name: "🟢 Eat Meal 4 - Afternoon",
    duration: 900,
    relativeTime: "330 min",
    sound: "silent",
    priority: "CRITICAL",
    action: "Eat slowly.",
    notes: "Focus 5-6/10. Vyvanse waning MODERATE. Energy declining. Fatigue possible.",
    category: "MEAL_EAT",
    mealNumber: 4,
    acarboseDose: "half-25mg"
  },
  
  {
    id: 23,
    name: "🟡 Rest & Digest (Post-Meal 4)",
    duration: 1200,
    relativeTime: "345 min",
    sound: "soothing-tone",
    priority: "HIGH",
    action: "Rest 20 min.",
    notes: "Dumping peak. Irritability increasing.",
    category: "DIGEST",
    dumpingRisk: "PEAK"
  },
  
  {
    id: 24,
    name: "💧 Hydrate (Post-Meal 4)",
    duration: 900,
    relativeTime: "365 min",
    sound: "water-drop",
    priority: "HIGH",
    action: "Drink 250-300ml water.",
    notes: "",
    category: "HYDRATION"
  },
  
  {
    id: 25,
    name: "⏸ Digestive Pause",
    duration: 600,
    relativeTime: "380 min",
    sound: "subtle-notification",
    priority: "LOW",
    action: "Prepare for Meal 5.",
    notes: "",
    category: "TRANSITION"
  },
  
  // Meal 5 (Early Dinner - MAIN MEAL #3)
  {
    id: 26,
    name: "🔴 Meal 5 (Early Dinner) - ACARBOSE AT BITE",
    duration: 300,
    relativeTime: "390 min", // ~6h 30min from wake
    sound: "loud-bell",
    priority: "CRITICAL",
    action: "Take FULL acarbose 50mg + Calcium/Vit D/K + START EATING",
    notes: "Main meal #3. ALSO take Calcium at this meal (iron/mag spacing maintained).",
    category: "MEAL_START",
    mealNumber: 5,
    acarboseDose: "full-50mg",
    specialMeds: "Calcium+VitD+K"
  },
  
  {
    id: 27,
    name: "🟢 Eat Meal 5 - Early Dinner",
    duration: 900,
    relativeTime: "395 min",
    sound: "silent",
    priority: "CRITICAL",
    action: "Eat slowly.",
    notes: "Focus 3-4/10. LOW. Vyvanse waning ACTIVE. Fatigue HIGH. Emotional volatility increasing.",
    category: "MEAL_EAT",
    mealNumber: 5,
    acarboseDose: "full-50mg",
    specialMeds: "Calcium+VitD+K"
  },
  
  {
    id: 28,
    name: "🟡 Rest & Digest (Post-Meal 5)",
    duration: 1200,
    relativeTime: "410 min",
    sound: "soothing-tone",
    priority: "HIGH",
    action: "Rest 20 min. Dumping window.",
    notes: "Dumping peak. Mood LOW. Self-compassion needed.",
    category: "DIGEST",
    dumpingRisk: "PEAK"
  },
  
  {
    id: 29,
    name: "💧 Hydrate (Post-Meal 5)",
    duration: 900,
    relativeTime: "430 min",
    sound: "water-drop",
    priority: "HIGH",
    action: "Drink 250-300ml water.",
    notes: "",
    category: "HYDRATION"
  },
  
  {
    id: 30,
    name: "⏸ Digestive Pause",
    duration: 600,
    relativeTime: "445 min",
    sound: "subtle-notification",
    priority: "LOW",
    action: "Prepare for Meal 6 (last meal).",
    notes: "",
    category: "TRANSITION"
  },
  
  // Meal 6 (Evening - FINAL MEAL)
  {
    id: 31,
    name: "🔴 Meal 6 (Evening) - ACARBOSE AT BITE",
    duration: 300,
    relativeTime: "455 min", // ~7h 35min from wake
    sound: "loud-bell",
    priority: "CRITICAL",
    action: "Take HALF acarbose 25mg + START EATING",
    notes: "Final meal. Small portion.",
    category: "MEAL_START",
    mealNumber: 6,
    acarboseDose: "half-25mg"
  },
  
  {
    id: 32,
    name: "🟢 Eat Meal 6 - Evening",
    duration: 900,
    relativeTime: "460 min",
    sound: "silent",
    priority: "CRITICAL",
    action: "Eat slowly. Last food intake of day.",
    notes: "Focus 1-2/10. VERY LOW. Vyvanse nearly gone. Comedown dysregulation peak.",
    category: "MEAL_EAT",
    mealNumber: 6,
    acarboseDose: "half-25mg"
  },
  
  {
    id: 33,
    name: "🟡 Rest & Digest (Post-Meal 6)",
    duration: 1200,
    relativeTime: "475 min",
    sound: "soothing-tone",
    priority: "HIGH",
    action: "Rest 20 min. Last dumping window.",
    notes: "Dumping peak. Dysregulation HIGH. Clonidine 1 hour away.",
    category: "DIGEST",
    dumpingRisk: "PEAK"
  },
  
  {
    id: 34,
    name: "💧 Hydrate (Post-Meal 6)",
    duration: 900,
    relativeTime: "495 min",
    sound: "water-drop",
    priority: "HIGH",
    action: "Drink 250-300ml water. Final hydration.",
    notes: "Total daily water goal: 2.5-3L achieved.",
    category: "HYDRATION"
  },
  
  {
    id: 35,
    name: "⏸ Digestive Pause",
    duration: 600,
    relativeTime: "510 min",
    sound: "subtle-notification",
    priority: "LOW",
    action: "Final transition. Prepare for evening phase.",
    notes: "",
    category: "TRANSITION"
  },
  
  // ===== AFTERNOON/EVENING PHASE (9 intervals) =====
  
  {
    id: 36,
    name: "🔴 Free Hydration & Wind-Down",
    duration: 9000, // 150 minutes (2.5 hours)
    relativeTime: "520 min", // ~8h 40min from wake
    sound: "optional-gentle",
    priority: "MEDIUM",
    action: "NO food. Hydration encouraged. Wind-down activities: reading, gentle TV, social time.",
    notes: "Vyvanse wearing off 10-13 hours post-dose. Mood dysregulation. Fatigue. Self-compassion.",
    category: "EVENING_WIND_DOWN",
    note2: "Avoid screens 6:30 PM onward (blue light). Dim lights."
  },
  
  {
    id: 37,
    name: "🟡 Evening Meds - Prozac + Magnesium 2",
    duration: 300, // 5 minutes
    relativeTime: "670 min", // ~11h 10min from wake = ~7:00 PM if wake 630 AM
    sound: "med-reminder-tone",
    priority: "CRITICAL",
    action: "Take Prozac 40mg + Magnesium Dose 2. With food or water.",
    notes: "Spacing: Calcium 230-330 PM + Mag 2 at 700 PM = 3.5-4.5h apart. GOOD.",
    category: "MEDICATION"
  },
  
  {
    id: 38,
    name: "🔴 Clonidine Bridge - Vyvanse Wear-Off",
    duration: 300, // 5 minutes
    relativeTime: "700 min", // ~11h 40min from wake = ~7:30 PM if wake 630 AM
    sound: "transition-chime",
    priority: "CRITICAL",
    action: "Take Clonidine (current dose, 50-300mcg depending on week). Sit/lie down. Avoid standing suddenly.",
    notes: "WHY 730 PM: Vyvanse wears off 13-15h post-dose. At 730 PM, Vyvanse actively FADING. Clonidine catches the transition, preventing rebound anxiety + hyperarousal.",
    category: "MEDICATION",
    clinicalNote: "Clonidine onset 30-60 min. Peak effect 800-830 PM. Duration 6-10h. Wears off 5-6 AM morning."
  },
  
  {
    id: 39,
    name: "🟣 Pre-Bedtime Calm Window",
    duration: 9000, // 150 minutes (2.5 hours)
    relativeTime: "730 min", // ~12h 10min from wake = ~7:30 PM
    sound: "optional-calm",
    priority: "MEDIUM",
    action: "Clonidine effect building. NO screens after 800 PM. NO caffeine (last allowed 2 PM). Light relaxation: reading, music, meditation, stretching.",
    notes: "Clonidine: Brain fog possible, desired for sleep. Reduced anxiety. Emotional flattening OK.",
    category: "SLEEP_PREP",
    note2: "Dim lights. Cool room. NO work. Trust meds are helping."
  },
  
  {
    id: 40,
    name: "🌙 Bedtime Meds - Clonidine (if split) + Agomelatine",
    duration: 300, // 5 minutes
    relativeTime: "880 min", // ~14h 40min from wake = ~10:00 PM if wake 630 AM
    sound: "sleep-ready-tone",
    priority: "CRITICAL",
    action: "Take Agomelatine (melatonin agonist). Optional: 2nd Clonidine dose if clinician directed split dosing.",
    notes: "Agomelatine onset 1-2 hours. Peak effect 2-3 hours (midnight-1 AM). Works with Clonidine.",
    category: "SLEEP_MEDICATION"
  },
  
  {
    id: 41,
    name: "🛌 Get Into Bed - Target Sleep",
    duration: 300, // 5 minutes
    relativeTime: "890 min", // ~14h 50min from wake
    sound: "lights-out-tone",
    priority: "CRITICAL",
    action: "Lights out. Bedtime ritual. Target 8-9 hours sleep.",
    notes: "Clonidine suppressing sympathetic activation. Agomelatine promoting sleep onset. CPTSD hyperarousal minimized.",
    category: "SLEEP"
  },
  
  {
    id: 42,
    name: "💤 Deep Sleep Window - Full Night",
    duration: 30600, // ~8.5 hours (typical sleep duration)
    relativeTime: "900 min", // ~15h from wake
    sound: "none",
    priority: "CRITICAL",
    action: "SLEEP. Clonidine at therapeutic levels through night. Agomelatine supporting sleep. NO alarms.",
    notes: "If wake briefly, stay calm. Clonidine prevents fightflight activation (CPTSD benefit).",
    category: "SLEEP"
  },
  
  {
    id: 43,
    name: "🌅 Morning Wake Transition",
    duration: 600, // 10 minutes
    relativeTime: "24570 min", // End of sleep + wake time
    sound: "gentle-alarm",
    priority: "HIGH",
    action: "Wake up. Sit on edge of bed for 1-2 minutes before standing. Drink water immediately.",
    notes: "Clonidine wearing off. Morning grogginess/dizziness expected. Sit first. Move slowly. PREVENT FALLS.",
    category: "WAKE_TRANSITION"
  },
  
  {
    id: 44,
    name: "🔁 Cycle Complete - Back to Interval 1",
    duration: 300, // 5 minutes
    relativeTime: "24600 min", // Start of new cycle
    sound: "completion-tone",
    priority: "INFO",
    action: "NEW DAY BEGINS. Take Vyvanse. Log yesterday's sleep + today's adherence. Repeat.",
    notes: "44 intervals complete. Entire system repeats daily.",
    category: "CYCLE_COMPLETE"
  }
];
// In-memory session
let currentSession = null;
// Helper: Send Pushover notification
async function sendPushover(message, interval, sound = 'bell') {
if (!process.env.PUSHOVER_USER_KEY || !process.env.PUSHOVER_API_TOKEN) {
console.log('Pushover not configured');
return;
}
try {
await axios.post('https://api.pushover.net/1/messages.json', {
user: process.env.PUSHOVER_USER_KEY,
token: process.env.PUSHOVER_API_TOKEN,
message: message,
title: interval,
sound: sound,
priority: 1
});
} catch (error) {
console.error('Pushover error:', error.message);
}
}
// API Route: Start day
app.post('/api/start-day', async (req, res) => {
  try {
    currentSession = {
      startedAt: new Date(),
      currentIntervalIndex: 0,
      isPaused: false,
      pausedAt: null,
      totalPausedTime: 0
    };

    const firstInterval = INTERVALS[0];
    await sendPushover(`Day started: ${firstInterval.name}`, 'Health Timer', 'updown');

    res.json({ success: true, message: 'Day started', interval: firstInterval, status: 'active', currentInterval: firstInterval, timeRemaining: firstInterval.duration, nextInterval: INTERVALS[1] || null });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// API Route: Get current status
app.get('/api/status', (req, res) => {
  if (!currentSession) {
    return res.json({ status: 'inactive' });
  }

  const now = new Date();
  const currentInterval = INTERVALS[currentSession.currentIntervalIndex];
  
  // If paused, use the paused time as reference; if not, use current time
  const referenceTime = currentSession.isPaused ? currentSession.pausedAt : now;
  const elapsed = Math.floor((referenceTime - currentSession.startedAt) / 1000) - currentSession.totalPausedTime;
  const timeRemaining = Math.max(0, currentInterval.duration - elapsed);

  res.json({
    status: 'active',
    currentInterval: currentInterval,
    nextInterval: INTERVALS[currentSession.currentIntervalIndex + 1] || null,
    timeRemaining: timeRemaining,
    isPaused: currentSession.isPaused,
    elapsedTotal: elapsed
  });
});
// API Route: Pause timer
app.post('/api/pause', async (req, res) => {
if (!currentSession) return res.status(400).json({ error: 'No active session' });
currentSession.isPaused = true;
currentSession.pausedAt = new Date();
await sendPushover('Timer paused', 'Health Timer', 'silence');
res.json({ success: true, message: 'Timer paused' });
});
// API Route: Resume timer
app.post('/api/resume', async (req, res) => {
if (!currentSession) return res.status(400).json({ error: 'No active session' });
if (currentSession.isPaused) {
const pausedDuration = Math.floor((new Date() - currentSession.pausedAt) / 1000);
currentSession.totalPausedTime += pausedDuration;
currentSession.isPaused = false;
}
await sendPushover('Timer resumed', 'Health Timer', 'updown');
res.json({ success: true, message: 'Timer resumed' });
});
// API Route: Skip to next interval (for testing)
app.post('/api/next-interval', async (req, res) => {
  if (!currentSession) return res.status(400).json({ error: 'No active session' });

  if (currentSession.currentIntervalIndex < INTERVALS.length - 1) {
    currentSession.currentIntervalIndex += 1;
    currentSession.isPaused = false;
    currentSession.pausedAt = null;
    currentSession.startedAt = new Date();
    currentSession.totalPausedTime = 0;

    const nextInterval = INTERVALS[currentSession.currentIntervalIndex];
    await sendPushover(`Advancing to: ${nextInterval.name}`, 'Health Timer', 'updown');

    res.json({ success: true, message: `Advanced to interval ${currentSession.currentIntervalIndex + 1}`, interval: nextInterval });
  } else {
    res.json({ success: true, message: 'Already on final interval' });
  }
});
// API Route: End day
app.post('/api/end-day', async (req, res) => {
currentSession = null;
await sendPushover('Day ended', 'Health Timer', 'cashregister');
res.json({ success: true, message: 'Day ended' });
});
// Health check
app.get('/api/health', (req, res) => {
res.json({ status: 'ok', timestamp: new Date() });
});
// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    // fixed: use backticks for template literal
    console.log(`Server running on port ${PORT}`);
});