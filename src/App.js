import { useState, useEffect } from "react";
import { AppStoreProvider } from "./context/AppStore";
import Inventory from "./pages/Inventory";

const MEAL_TYPES = ["Breakfast", "Lunch", "Evening Snack", "Dinner"];
const MOODS = [
  { label: "Hearty & Filling", emoji: "💪", value: "hearty" },
  { label: "Light & Fresh", emoji: "🥗", value: "light" },
  { label: "Comfort Food", emoji: "🤗", value: "comfort" },
  { label: "Quick & Easy", emoji: "⚡", value: "quick" },
  { label: "Treat Yourself", emoji: "🎉", value: "indulgent" },
];

const NOTIFICATION_SCHEDULE = [
  { hour: 7,  label: "Breakfast", emoji: "🌅", title: "🌅 Breakfast Time!", body: "Subah ka naashta decide karo — tap karke options dekho!" },
  { hour: 11, label: "Lunch",     emoji: "☀️", title: "☀️ Lunch Prep Time!", body: "Dopahar ka khana — aaj kya banayein?" },
  { hour: 16, label: "Snack",     emoji: "🌇", title: "🌇 Snack O'Clock!", body: "Chai ke saath kya khayein aaj?" },
  { hour: 19, label: "Dinner",    emoji: "🌙", title: "🌙 Dinner Time!", body: "Raat ka khana — mood batao, options milenge!" },
];

const weatherEmoji = (condition) => {
  if (!condition) return "🌤️";
  const c = condition.toLowerCase();
  if (c.includes("rain")) return "🌧️";
  if (c.includes("cloud")) return "⛅";
  if (c.includes("clear") || c.includes("sunny")) return "☀️";
  if (c.includes("storm")) return "⛈️";
  if (c.includes("snow")) return "❄️";
  if (c.includes("haze") || c.includes("mist") || c.includes("fog")) return "🌫️";
  if (c.includes("hot")) return "🔥";
  return "🌤️";
};

async function registerSW() {
  if (!("serviceWorker" in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register("/sw.js");
    return reg;
  } catch (e) {
    console.warn("SW registration failed:", e);
    return null;
  }
}

async function requestNotificationPermission() {
  if (!("Notification" in window)) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  const result = await Notification.requestPermission();
  return result;
}

function setupHourlyCheck(swReg) {
  if (!swReg) return;
  const check = () => {
    const hour = new Date().getHours();
    const min = new Date().getMinutes();
    if (min < 2) {
      swReg.active?.postMessage({ type: "SCHEDULE_CHECK", hour });
    }
  };
  check();
  setInterval(check, 60 * 1000);
}

export default function App() {
  const [step, setStep] = useState("setup");
  const [mealType, setMealType] = useState(null);
  const [mood, setMood] = useState(null);
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [recipeDetail, setRecipeDetail] = useState(null);
  const [recipeLoading, setRecipeLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notifStatus, setNotifStatus] = useState("unknown");
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("gemini_api_key") || "");
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [swReg, setSwReg] = useState(null);

  useEffect(() => {
    registerSW().then((reg) => {
      setSwReg(reg);
      if (reg) setupHourlyCheck(reg);
    });
    fetchWeather();
    setNotifStatus(
      !("Notification" in window) ? "unsupported" : Notification.permission
    );
  }, []);

  const fetchWeather = async () => {
    setWeatherLoading(true);
    try {
      const pos = await new Promise((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 6000 })
      );
      const { latitude, longitude } = pos.coords;
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weathercode&timezone=auto`
      );
      const data = await res.json();
      const temp = Math.round(data.current.temperature_2m);
      const code = data.current.weathercode;
      let condition = "Clear";
      if (code <= 3) condition = code === 0 ? "Clear" : "Partly Cloudy";
      else if (code <= 49) condition = "Hazy";
      else if (code <= 67) condition = "Rainy";
      else if (code <= 77) condition = "Snowy";
      else if (code <= 99) condition = "Stormy";
      if (temp >= 35) condition = "Very Hot";
      else if (temp >= 28 && condition === "Clear") condition = "Hot & Clear";
      setWeather({ temp, condition });
    } catch {
      try {
        const res = await fetch("https://api.open-meteo.com/v1/forecast?latitude=12.97&longitude=77.59&current=temperature_2m,weathercode&timezone=auto");
        const data = await res.json();
        const temp = Math.round(data.current.temperature_2m);
        setWeather({ temp, condition: temp >= 35 ? "Very Hot" : "Hot & Clear", fallback: true });
      } catch {
        setWeather({ temp: 32, condition: "Hot & Clear", fallback: true });
      }
    }
    setWeatherLoading(false);
  };

  const enableNotifications = async () => {
    const status = await requestNotificationPermission();
    setNotifStatus(status);
    if (status === "granted" && swReg) {
      setupHourlyCheck(swReg);
      swReg.active?.postMessage({ type: "SCHEDULE_CHECK", hour: new Date().getHours() });
      alert("✅ Notifications ON! Time par reminders milenge.");
    }
  };

  const saveApiKey = () => {
    localStorage.setItem("gemini_api_key", apiKeyInput);
    setApiKey(apiKeyInput);
    setApiKeyInput("");
    setShowSettings(false);
  };

  const getKey = () => apiKey || process.env.REACT_APP_GEMINI_KEY || "";

  const generateSuggestions = async () => {
    if (!mealType || !mood) return;
    if (!getKey()) { setShowSettings(true); return; }
    setStep("loading");
    setError(null);
    const weatherCtx = weather ? `Current weather: ${weather.temp}°C, ${weather.condition}.` : "Weather: Mild day in India.";
    const prompt = `You are an expert Indian home cook. ${weatherCtx}
The user wants ${mealType} with a "${mood}" mood/vibe.
Suggest exactly 4 meal options. Respond ONLY with a valid JSON array (no markdown code blocks, no formatting, just pure JSON text):
[{"name":"Dish Name","hinglish_name":"Short Hinglish tagline","tags":["tag1","tag2"],"time":"30 min","vibe":"one sentence why this fits today","emoji":"single emoji"}]`;
    
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${getKey()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
      setSuggestions(JSON.parse(text.trim()));
      setStep("results");
    } catch (e) {
      setError("API error: Try again");
      setStep("setup");
    }
  };

  const fetchRecipe = async (dish) => {
    setSelectedRecipe(dish);
    setRecipeLoading(true);
    setRecipeDetail(null);
    const prompt = `Complete home-style Indian recipe for "${dish.name}" in Hinglish.
Respond ONLY with a valid JSON object (no markdown code blocks, no formatting, just pure JSON text):
{"ingredients":["item with qty"],"steps":["Step 1..."],"tip":"One pro tip in Hinglish","serves":"2 log"}`;
    
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${getKey()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        }),
      });
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      setRecipeDetail(JSON.parse(text.trim()));
    } catch {
      setRecipeDetail({ error: true });
    }
    setRecipeLoading(false);
  };

  const reset = () => { setStep("setup"); setMealType(null); setMood(null); setSuggestions([]); setSelectedRecipe(null); setRecipeDetail(null); setError(null); };

  const S = {
    root: { minHeight: "100vh", backgroundColor: "#FAFAFA", paddingBottom: "110px", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif", color: "#2D2D2D", position: "relative" },
    header: { backgroundColor: "#FFFFFF", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #EAEAEA", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" },
    body: { maxWidth: "500px", margin: "0 auto", padding: "24px 16px" },
    label: { fontSize: "11px", letterSpacing: "1.5px", textTransform: "uppercase", color: "#8E8E93", marginBottom: "12px", fontWeight: "600" },
    card: (active) => ({ width: "100%", background: active ? "#FDF6ED" : "#FFFFFF", border: active ? "2px solid #E28743" : "1px solid #EAEAEA", borderRadius: "12px", padding: "14px 16px", color: "#2D2D2D", cursor: "pointer", transition: "all 0.2s ease", textAlign: "left", boxShadow: active ? "0 4px 12px rgba(226,135,67,0.1)" : "0 2px 4px rgba(0,0,0,0.01)" }),
    btn: (disabled) => ({ width: "100%", padding: "16px", background: disabled ? "#EAEAEA" : "#E28743", border: "none", borderRadius: "12px", color: disabled ? "#999999" : "#FFFFFF", fontSize: "16px", cursor: disabled ? "not-allowed" : "pointer", fontWeight: "600", transition: "all 0.2s", boxShadow: disabled ? "none" : "0 4px 12px rgba(226,135,67,0.2)" }),
    ghost: { background: "#FFFFFF", border: "1px solid #EAEAEA", borderRadius: "20px", padding: "6px 14px", color: "#E28743", fontSize: "13px", cursor: "pointer", fontWeight: "500" },
    bottomNav: { position: "fixed", left: 0, right: 0, bottom: 0, display: "flex", justifyContent: "space-around", alignItems: "center", padding: "12px 18px", background: "#FFFFFF", borderTop: "1px solid #EAEAEA", boxShadow: "0 -8px 24px rgba(0,0,0,0.08)", zIndex: 20 },
    bottomNavButton: { minWidth: "120px", border: "none", background: "transparent", color: "#666666", fontSize: "14px", fontWeight: "700", borderRadius: "16px", padding: "12px 14px", cursor: "pointer", transition: "all 0.2s ease" },
    bottomNavActive: { color: "#E28743", background: "#FFF3E8", boxShadow: "0 12px 28px rgba(226,135,67,0.16)" },
    tag: { background: "#F5F5F7", borderRadius: "6px", padding: "3px 8px", fontSize: "12px", color: "#666666", fontWeight: "500" },
    section: { background: "#FFFFFF", border: "1px solid #EAEAEA", borderRadius: "12px", padding: "18px", marginBottom: "16px" },
  };

  if (showSettings) return (
    <AppStoreProvider>
      <div style={S.root}>
        <div style={S.header}>
        <div style={{ fontSize: "18px", color: "#2D2D2D", fontWeight: "600" }}>⚙️ Settings</div>
        <button onClick={() => setShowSettings(false)} style={S.ghost}>✕ Close</button>
      </div>
      <div style={S.body}>
        <div style={S.section}>
          <div style={S.label}>Gemini API Key</div>
          {apiKey ? (
            <div>
              <div style={{ color: "#34C759", fontSize: "14px", marginBottom: "12px", fontWeight: "500" }}>✅ Gemini API Key Saved</div>
              <button onClick={() => { localStorage.removeItem("gemini_api_key"); setApiKey(""); }} style={{ ...S.ghost, color: "#FF3B30", borderColor: "#FFD6D4" }}>Remove Key</button>
            </div>
          ) : (
            <div>
              <input
                type="password"
                placeholder="AIzaSy..."
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                style={{ width: "100%", padding: "12px", background: "#F5F5F7", border: "1px solid #EAEAEA", borderRadius: "8px", fontSize: "14px", marginBottom: "12px", boxSizing: "border-box" }}
              />
              <button onClick={saveApiKey} disabled={!apiKeyInput} style={S.btn(!apiKeyInput)}>Save Gemini Key</button>
            </div>
          )}
        </div>

        <div style={S.section}>
          <div style={S.label}>Meal Reminders</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
            {NOTIFICATION_SCHEDULE.map((s) => (
              <div key={s.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "#48484A", fontSize: "14px" }}>
                <span style={{ marginRight: "8px" }}>{s.emoji} {s.label}</span>
                <span style={{ marginLeft: "auto", ...S.tag }}>{s.hour}:00 AM/PM</span>
              </div>
            ))}
          </div>
          {notifStatus !== "granted" && (
            <button onClick={enableNotifications} style={S.btn(false)}>Enable Notifications</button>
          )}
        </div>
      </div>
      <div style={S.bottomNav}>
        <button type="button" onClick={() => setActiveTab("home")} style={activeTab === "home" ? { ...S.bottomNavButton, ...S.bottomNavActive } : S.bottomNavButton}>
          🏠 Home
        </button>
        <button type="button" onClick={() => setActiveTab("inventory")} style={activeTab === "inventory" ? { ...S.bottomNavButton, ...S.bottomNavActive } : S.bottomNavButton}>
          🛒 Inventory
        </button>
      </div>
    </div>
  </AppStoreProvider>
  );

  return (
    <AppStoreProvider>
      <div style={S.root}>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      
      <div style={S.header}>
        <div>
          <div style={{ fontSize: "20px", fontWeight: "700", color: "#2D2D2D", letterSpacing: "-0.5px" }}>🍽️ Kya Banaye?</div>
          <div style={{ fontSize: "11px", color: "#8E8E93", fontWeight: "500" }}>Premium AI Meal Suggester</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ background: "#F5F5F7", borderRadius: "20px", padding: "6px 12px", fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
            {weatherLoading ? "..." : <>{weatherEmoji(weather?.condition)} {weather?.temp || 32}°C</>}
          </div>
          <button onClick={() => setShowSettings(true)} style={{ background: "#F5F5F7", border: "none", borderRadius: "50%", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "16px" }}>
            ⚙️
          </button>
        </div>
      </div>

      <div style={S.body}>
        {activeTab === "inventory" ? (
          <Inventory />
        ) : (
          <>
            {step === "setup" && (
              <div>
                <div style={{ marginBottom: "24px" }}>
                  <div style={S.label}>Select Meal</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                {MEAL_TYPES.map((t) => (
                  <button key={t} onClick={() => setMealType(t)} style={S.card(mealType === t)}>
                    <span style={{ fontSize: "16px", marginRight: "6px" }}>
                      {t === "Breakfast" ? "🌅" : t === "Lunch" ? "☀️" : t === "Evening Snack" ? "🌇" : "🌙"}
                    </span>
                    <span style={{ fontWeight: "600", fontSize: "14px" }}>{t}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <div style={S.label}>Select Mood</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {MOODS.map((m) => (
                  <button key={m.value} onClick={() => setMood(m.value)} style={{ ...S.card(mood === m.value), display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "20px" }}>{m.emoji}</span>
                    <span style={{ flex: 1, fontWeight: "500" }}>{m.label}</span>
                    {mood === m.value && <span style={{ color: "#E28743", fontWeight: "bold" }}>✓</span>}
                  </button>
                ))}
              </div>
            </div>

            {error && <div style={{ background: "#FFD6D4", border: "1px solid #FF3B30", borderRadius: "8px", padding: "10px", marginBottom: "14px", color: "#FF3B30", fontSize: "13px", textAlign: "center" }}>{error}</div>}

            <button onClick={generateSuggestions} disabled={!mealType || !mood} style={S.btn(!mealType || !mood)}>
              ✨ Suggest Meals
            </button>
          </div>
        )}

        {step === "loading" && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: "48px", animation: "spin 1.5s linear infinite" }}>🍳</div>
            <div style={{ fontSize: "16px", fontWeight: "600", color: "#2D2D2D", marginTop: "16px" }}>Curating matching recipes...</div>
          </div>
        )}

        {step === "results" && !selectedRecipe && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <div style={{ fontSize: "18px", fontWeight: "700" }}>Today's Suggestions</div>
                <div style={{ fontSize: "12px", color: "#8E8E93" }}>{mealType} • {MOODS.find(m => m.value === mood)?.label}</div>
              </div>
              <button onClick={reset} style={S.ghost}>Change</button>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {suggestions.map((dish, i) => (
                <button key={i} onClick={() => fetchRecipe(dish)} style={{ ...S.card(false), display: "flex", alignItems: "center", gap: "14px" }}>
                  <div style={{ fontSize: "28px", width: "46px", height: "46px", display: "flex", alignItems: "center", justifyContent: "center", background: "#F5F5F7", borderRadius: "10px" }}>{dish.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "16px", fontWeight: "600" }}>{dish.name}</div>
                    <div style={{ fontSize: "13px", color: "#666666", marginTop: "2px" }}>{dish.vibe}</div>
                    <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
                      <span style={S.tag}>⏱️ {dish.time}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === "results" && selectedRecipe && (
          <div>
            <button onClick={() => { setSelectedRecipe(null); setRecipeDetail(null); }} style={{ ...S.ghost, marginBottom: "20px" }}>← Back to options</button>
            
            <div style={{ ...S.section, textAlign: "center", background: "#FDF6ED", borderColor: "#F5E6D3" }}>
              <div style={{ fontSize: "40px" }}>{selectedRecipe.emoji}</div>
              <div style={{ fontSize: "22px", fontWeight: "700", marginTop: "8px" }}>{selectedRecipe.name}</div>
              <div style={{ fontSize: "14px", color: "#666666", fontStyle: "italic" }}>{selectedRecipe.hinglish_name}</div>
            </div>

            {recipeLoading && <div style={{ textAlign: "center", padding: "40px 0" }}><div style={{ fontSize: "32px", animation: "spin 1.5s linear infinite" }}>🥘</div></div>}
            
            {recipeDetail && !recipeDetail.error && (
              <div>
                <div style={S.section}>
                  <div style={S.label}>Ingredients ({recipeDetail.serves})</div>
                  {recipeDetail.ingredients?.map((ing, i) => (
                    <div key={i} style={{ padding: "8px 0", borderBottom: "1px solid #F5F5F7", color: "#48484A", fontSize: "14px" }}>
                      • {ing}
                    </div>
                  ))}
                </div>
                
                <div style={S.section}>
                  <div style={S.label}>Steps to Cook</div>
                  {recipeDetail.steps?.map((s, i) => (
                    <div key={i} style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
                      <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#E28743", color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold", flexShrink: 0 }}>{i + 1}</div>
                      <div style={{ color: "#48484A", fontSize: "14px", lineHeight: "1.5" }}>{s}</div>
                    </div>
                  ))}
                </div>

                {recipeDetail.tip && (
                  <div style={{ background: "#F5F5F7", borderRadius: "12px", padding: "14px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
                    <span>💡</span>
                    <div style={{ fontSize: "14px", color: "#48484A" }}><strong>Chef's Tip:</strong> {recipeDetail.tip}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
          </>
        )}
      </div>
      <div style={S.bottomNav}>
        <button type="button" onClick={() => setActiveTab("home")} style={activeTab === "home" ? { ...S.bottomNavButton, ...S.bottomNavActive } : S.bottomNavButton}>
          🏠 Home
        </button>
        <button type="button" onClick={() => setActiveTab("inventory")} style={activeTab === "inventory" ? { ...S.bottomNavButton, ...S.bottomNavActive } : S.bottomNavButton}>
          🛒 Inventory
        </button>
      </div>
    </div>
  </AppStoreProvider>
  );
}