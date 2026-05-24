export function buildMealSuggestionPrompt({ mealType, mood, weather, inventory }) {
  const city = weather?.city || "your area";
  const weatherText = weather
    ? `Current weather in ${city}: ${weather.temp}°C and ${weather.condition}.`
    : `Current weather in ${city}: mild and balanced.`;

  const inventoryText = inventory?.length
    ? `The user has: ${inventory.join(", ")}. Use these ingredients as the core of the meal suggestions where possible.`
    : `The user has not provided kitchen inventory. Suggest easy-to-find comfort meals.`;

  return `You are an expert Indian home cook and recipe creator with a clean, modern voice. ${weatherText}
The user wants ${mealType} with a "${mood}" mood.
${inventoryText}
Return exactly 4 meal suggestions in pure JSON array format ONLY (no markdown, no code fences, no extra commentary).
Each item must include the following keys: name, hinglish_name, time, vibe, emoji, nutrition, health_tags.
Example schema:
[{"name":"...","hinglish_name":"...","time":"...","vibe":"...","emoji":"...","nutrition":"...","health_tags":["..."]}]
Prefer practical, pantry-first meals that feel premium and modern.`;
}
