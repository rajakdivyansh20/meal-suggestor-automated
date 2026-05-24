export function buildWeeklyPlannerPrompt({ dietPreference = "balanced", weather = {} } = {}) {
  const city = weather?.city || "your area";
  const weatherText = weather?.temp && weather?.condition
    ? `Current weather in ${city} is ${weather.temp}°C and ${weather.condition}.`
    : `The weather is mild and comfortable.`;

  return `You are an expert weekly meal planner for a modern Indian home. ${weatherText}
Create a 7-day meal plan in strict JSON only, with no markdown, no extra text, and no code fences.
Return an object with a "week" array containing 7 days from Monday to Sunday.
Each day should include:
- "day": day name
- "dish_name": meal name
- "short_vibe": a short premium mood line
- "ingredients": array of ingredient strings
Use the user's diet preference: ${dietPreference}.
Example structure:
{"week":[{"day":"Monday","dish_name":"...","short_vibe":"...","ingredients":["...","..."]},...]} `;
}
