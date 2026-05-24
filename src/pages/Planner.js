import { useEffect, useState } from "react";
import { useAppStore } from "../context/AppStore";
import BentoCard from "../components/BentoCard";
import PrimaryButton from "../components/PrimaryButton";
import { buildWeeklyPlannerPrompt } from "../prompts/geminiPrompts";

const DIET_OPTIONS = [
  { label: "Balanced", value: "balanced" },
  { label: "Vegetarian", value: "vegetarian" },
  { label: "Low-carb", value: "low carb" },
  { label: "High-protein", value: "high protein" },
];

const getKey = () => localStorage.getItem("gemini_api_key") || process.env.REACT_APP_GEMINI_KEY || "";

export default function Planner({ weather }) {
  const { groceryList, setGroceryList } = useAppStore();
  const [dietPreference, setDietPreference] = useState("balanced");
  const [weeklyPlan, setWeeklyPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const generatePlan = async () => {
    const key = getKey();
    if (!key) {
      setError("Please save your Gemini API key in Settings first.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const prompt = buildWeeklyPlannerPrompt({ dietPreference, weather });
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" },
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message || "AI error");
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      const parsed = JSON.parse(text.trim());
      if (!parsed?.week || !Array.isArray(parsed.week)) {
        throw new Error("Invalid planner response");
      }
      setWeeklyPlan(parsed.week);
    } catch (err) {
      setError(err.message || "Failed to generate plan.");
    } finally {
      setLoading(false);
    }
  };

  const addToGroceryList = () => {
    if (!weeklyPlan) return;
    const rawItems = weeklyPlan.flatMap((day) => day.ingredients || []);
    const cleaned = rawItems
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
    const normalizedMap = new Map();
    cleaned.forEach((item) => {
      const key = item.toLowerCase();
      if (!normalizedMap.has(key)) normalizedMap.set(key, item);
    });
    const uniqueItems = Array.from(normalizedMap.values());
    const existing = new Set(groceryList.map((item) => item.trim().toLowerCase()));
    const toAdd = uniqueItems.filter((item) => !existing.has(item.toLowerCase()));
    if (toAdd.length > 0) {
      setGroceryList([...groceryList, ...toAdd]);
    }
    setToast("Added to your Grocery List!");
  };

  return (
    <div className="planner-page">
      {toast && <div className="toast-message">{toast}</div>}

      <BentoCard title="Your Weekly Menu" subtitle="Create a clean 7-day meal plan and extract the grocery list in one tap." className="planner-header-card">
        <div className="planner-controls">
          <div>
            <label className="planner-label" htmlFor="diet-select">Diet preference</label>
            <select
              id="diet-select"
              className="planner-select"
              value={dietPreference}
              onChange={(e) => setDietPreference(e.target.value)}
            >
              {DIET_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <PrimaryButton onClick={generatePlan} disabled={loading}>
            {loading ? "Generating…" : "✨ Generate 7-Day Plan"}
          </PrimaryButton>
        </div>
        {error && <div className="planner-error">{error}</div>}
      </BentoCard>

      {weeklyPlan && (
        <div className="planner-grid">
          {weeklyPlan.map((day) => (
            <section key={day.day} className="planner-day-card">
              <div className="planner-day-name">{day.day}</div>
              <div className="planner-dish-name">{day.dish_name}</div>
              <div className="planner-vibe">{day.short_vibe}</div>
            </section>
          ))}
        </div>
      )}

      {weeklyPlan && (
        <div className="planner-footer">
          <PrimaryButton className="planner-add-button" onClick={addToGroceryList}>
            🛒 Add Week's Ingredients to Grocery List
          </PrimaryButton>
        </div>
      )}
    </div>
  );
}
