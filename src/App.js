import { useState, useEffect } from "react";
import { AppStoreProvider, useAppStore } from "./context/AppStore";
import Inventory from "./pages/Inventory";
import GroceryList from "./pages/GroceryList";
import Favorites from "./pages/Favorites";
import BentoCard from "./components/BentoCard";
import RecipeCard from "./components/RecipeCard";
import RecipeDetail from "./components/RecipeDetail";
import Planner from "./pages/Planner";
import TopNav from "./components/ui/TopNav";
import PrimaryButton from "./components/PrimaryButton";
import { buildMealSuggestionPrompt, buildRecipeDetailPrompt } from "./prompts/geminiPrompts";

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

function AppShell() {
  const { inventory } = useAppStore();
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
      // reverse geocode to get a friendly city/locality name for prompts
      try {
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`);
        const geo = await geoRes.json();
        const city = geo?.address?.city || geo?.address?.town || geo?.address?.village || geo?.address?.state || geo?.address?.country || null;
        setWeather({ temp, condition, city });
      } catch {
        setWeather({ temp, condition });
      }
    } catch {
      try {
        const res = await fetch("https://api.open-meteo.com/v1/forecast?latitude=12.97&longitude=77.59&current=temperature_2m,weathercode&timezone=auto");
        const data = await res.json();
        const temp = Math.round(data.current.temperature_2m);
        // attempt reverse geocode for fallback coordinates
        try {
          const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=12.97&lon=77.59&addressdetails=1`);
          const geo = await geoRes.json();
          const city = geo?.address?.city || geo?.address?.town || geo?.address?.village || geo?.address?.state || geo?.address?.country || "Bengaluru";
          setWeather({ temp, condition: temp >= 35 ? "Very Hot" : "Hot & Clear", fallback: true, city });
        } catch {
          setWeather({ temp, condition: temp >= 35 ? "Very Hot" : "Hot & Clear", fallback: true });
        }
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
    const prompt = buildMealSuggestionPrompt({ mealType, mood, weather, inventory });
    
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
    const prompt = buildRecipeDetailPrompt(dish.name, weather);
    
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
    root: { minHeight: "100vh", backgroundColor: "#F7F7F8", paddingBottom: "130px", fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif", color: "#111111", position: "relative" },
    header: { backgroundColor: "#FFFFFF", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #EBEBEB", boxShadow: "0 10px 30px rgba(0,0,0,0.05)" },
    body: { maxWidth: "560px", margin: "0 auto", padding: "28px 18px" },
    label: { fontSize: "11px", letterSpacing: "1.5px", textTransform: "uppercase", color: "#8E8E93", marginBottom: "12px", fontWeight: "700" },
    card: (active) => ({ width: "100%", background: active ? "#FFF5EA" : "#FFFFFF", border: active ? "1px solid #E7B188" : "1px solid #EBEBEB", borderRadius: "24px", padding: "18px 18px", color: "#111111", cursor: "pointer", transition: "all 0.2s ease", textAlign: "left", boxShadow: active ? "0 10px 30px rgba(226,135,67,0.12)" : "0 8px 30px rgba(0,0,0,0.04)" }),
    btn: (disabled) => ({ width: "100%", padding: "16px", background: disabled ? "#EAEAEA" : "#E28743", border: "none", borderRadius: "20px", color: disabled ? "#999999" : "#FFFFFF", fontSize: "16px", cursor: disabled ? "not-allowed" : "pointer", fontWeight: "700", transition: "transform 0.2s ease, box-shadow 0.2s ease", boxShadow: disabled ? "none" : "0 10px 24px rgba(226,135,67,0.18)" }),
    ghost: { background: "#FFFFFF", border: "1px solid #EBEBEB", borderRadius: "22px", padding: "8px 16px", color: "#E28743", fontSize: "13px", cursor: "pointer", fontWeight: "700", transition: "transform 0.2s ease, box-shadow 0.2s ease" },
    bottomNav: { position: "fixed", left: 0, right: 0, bottom: 0, display: "flex", justifyContent: "space-around", alignItems: "center", padding: "14px 20px", background: "#FFFFFF", borderTop: "1px solid #EBEBEB", boxShadow: "0 -10px 30px rgba(0,0,0,0.06)", zIndex: 20 },
    bottomNavButton: { minWidth: "120px", border: "none", background: "transparent", color: "#666666", fontSize: "14px", fontWeight: "700", borderRadius: "18px", padding: "12px 16px", cursor: "pointer", transition: "all 0.2s ease" },
    bottomNavActive: { color: "#E28743", background: "#FFF3E8", boxShadow: "0 12px 28px rgba(226,135,67,0.12)" },
    tag: { background: "#F5F5F7", borderRadius: "10px", padding: "6px 12px", fontSize: "12px", color: "#666666", fontWeight: "600" },
    section: { background: "#FFFFFF", border: "1px solid #EBEBEB", borderRadius: "24px", padding: "22px", marginBottom: "18px", boxShadow: "0 10px 30px rgba(0,0,0,0.04)" },
  };

  if (activeTab === "settings") return (
    <div style={S.root}>
      <TopNav activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="center-pane">
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
      </main>
    </div>
  );

  return (
    <div style={S.root}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      
      <TopNav activeTab={activeTab} setActiveTab={setActiveTab} weather={weather} weatherLoading={weatherLoading} />

      <main className="center-pane">
        {activeTab === "inventory/grocery" ? (
          <GroceryList />
        ) : activeTab === "favorites" ? (
          <Favorites />
        ) : activeTab === "inventory" ? (
          <Inventory />
        ) : activeTab === "planner" ? (
          <Planner weather={weather} />
        ) : (
          <>
            {step === "setup" && (
              <div>
            <BentoCard title="Select Meal" subtitle="Pick the meal type that matches your vibe.">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {MEAL_TYPES.map((t) => (
                  <button key={t} onClick={() => setMealType(t)} style={S.card(mealType === t)}>
                    <span style={{ fontSize: "16px", marginRight: "8px" }}>
                      {t === "Breakfast" ? "🌅" : t === "Lunch" ? "☀️" : t === "Evening Snack" ? "🌇" : "🌙"}
                    </span>
                    <span style={{ fontWeight: "600", fontSize: "14px" }}>{t}</span>
                  </button>
                ))}
              </div>
            </BentoCard>

            <BentoCard title="Select Mood" subtitle="Choose the mood that feels right for today." style={{ marginTop: "18px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {MOODS.map((m) => (
                  <button key={m.value} onClick={() => setMood(m.value)} style={{ ...S.card(mood === m.value), display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "20px" }}>{m.emoji}</span>
                    <span style={{ flex: 1, fontWeight: "500" }}>{m.label}</span>
                    {mood === m.value && <span style={{ color: "#E28743", fontWeight: "bold" }}>✓</span>}
                  </button>
                ))}
              </div>
            </BentoCard>

            {error && <div style={{ background: "#FFD6D4", border: "1px solid #FF3B30", borderRadius: "12px", padding: "12px", marginTop: "18px", color: "#FF3B30", fontSize: "13px", textAlign: "center" }}>{error}</div>}

            <PrimaryButton disabled={!mealType || !mood} onClick={generateSuggestions} style={{ marginTop: "20px" }}>
              ✨ Suggest Meals
            </PrimaryButton>
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
            
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {suggestions.map((dish, i) => (
                <RecipeCard key={i} dish={dish} onSelect={fetchRecipe} />
              ))}
            </div>
          </div>
        )}

        {step === "results" && selectedRecipe && (
          <div>
            <button onClick={() => { setSelectedRecipe(null); setRecipeDetail(null); }} style={{ ...S.ghost, marginBottom: "20px" }}>← Back to options</button>
            {recipeLoading ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}><div style={{ fontSize: "32px", animation: "spin 1.5s linear infinite" }}>🥘</div></div>
            ) : (
              recipeDetail && !recipeDetail.error && (
                <RecipeDetail dish={selectedRecipe} recipeDetail={recipeDetail} />
              )
            )}
          </div>
        )}
          </>
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppStoreProvider>
      <AppShell />
    </AppStoreProvider>
  );
}