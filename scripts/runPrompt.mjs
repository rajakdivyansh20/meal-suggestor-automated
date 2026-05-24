import { buildMealSuggestionPrompt } from '../src/prompts/mealSuggestionPrompt.js';

const sample = buildMealSuggestionPrompt({
  mealType: 'Dinner',
  mood: 'cozy',
  weather: { temp: 30, condition: 'Clear', city: 'Bengaluru' },
  inventory: ['tomato', 'paneer']
});

console.log(sample);
