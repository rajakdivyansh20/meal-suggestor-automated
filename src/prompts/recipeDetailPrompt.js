export function buildRecipeDetailPrompt(dishName, weather) {
  const city = weather?.city || "your area";
  const weatherText = weather
    ? `Current weather in ${city}: ${weather.temp}°C and ${weather.condition}.`
    : `Current weather in ${city}: mild and balanced.`;

  return `You are an expert Indian home cook explaining a recipe in a clean, modern way. ${weatherText}
Provide a complete recipe for "${dishName}" in Hinglish.
Respond ONLY with a valid JSON object, no markdown, no extra text, and no code fences.
The object MUST include:
{"ingredients":["item with qty"],"steps":["Step 1..."],"tip":"One pro tip in Hinglish","serves":"2 log"}`;
}
