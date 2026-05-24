export function shareRecipeToWhatsApp(dishName, servings, ingredients, steps, tip) {
  const text = `*${dishName}* (For ${servings} people) 🍲\n\n*Ingredients:*\n- ${ingredients.join("\n- ")}\n\n*Steps:*\n- ${steps.join("\n- ")}\n\n*Pro Tip:* ${tip}\n\nShared via Kya Banaye App ✨`;
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
}
