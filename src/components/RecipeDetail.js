import { useEffect, useMemo, useState } from "react";
import PrimaryButton from "./PrimaryButton";
import { shareRecipeToWhatsApp } from "../utils/share";

function parseNumber(value) {
  const number = parseFloat(String(value).replace(/[^0-9.]/g, ""));
  return Number.isFinite(number) ? number : 0;
}

function formatNumber(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return Number.isInteger(value) ? value : value.toFixed(1);
}

export default function RecipeDetail({ dish, recipeDetail }) {
  const originalServes = useMemo(() => {
    const parsed = parseInt(String(recipeDetail?.serves || "2"), 10);
    return parsed > 0 ? parsed : 2;
  }, [recipeDetail?.serves]);

  const [servings, setServings] = useState(originalServes);

  useEffect(() => {
    setServings(originalServes);
  }, [originalServes]);

  const multiplier = useMemo(() => servings / (originalServes || 1), [servings, originalServes]);

  const scaledNutrition = useMemo(() => {
    const nutrition = recipeDetail?.nutrition || {};
    return {
      calories: formatNumber(parseNumber(nutrition.calories) * multiplier),
      protein: formatNumber(parseNumber(nutrition.protein) * multiplier),
      carbs: formatNumber(parseNumber(nutrition.carbs) * multiplier),
      fats: formatNumber(parseNumber(nutrition.fats) * multiplier),
    };
  }, [recipeDetail?.nutrition, multiplier]);

  const ingredients = recipeDetail?.ingredients || [];
  const steps = recipeDetail?.steps || [];
  const tip = recipeDetail?.tip || "";

  const handleShare = () => {
    shareRecipeToWhatsApp(dish.name, servings, ingredients, steps, tip);
  };

  return (
    <section className="recipe-detail-card">
      <div className="recipe-detail-header">
        <div>
          <div className="recipe-detail-title">{dish.name}</div>
          {dish.hinglish_name && <div className="recipe-detail-subtitle">{dish.hinglish_name}</div>}
        </div>

        <div className="serving-toggle">
          <button
            type="button"
            className="serving-button"
            onClick={() => setServings((value) => Math.max(1, value - 1))}
            aria-label="Decrease servings"
          >
            −
          </button>
          <span className="serving-value">{servings}</span>
          <button
            type="button"
            className="serving-button"
            onClick={() => setServings((value) => value + 1)}
            aria-label="Increase servings"
          >
            +
          </button>
        </div>
      </div>

      {recipeDetail?.nutrition && (
        <div className="nutrition-grid">
          <div className="nutrition-chip">
            <div className="nutrition-label">Calories</div>
            <strong>{scaledNutrition.calories}</strong>
          </div>
          <div className="nutrition-chip">
            <div className="nutrition-label">Protein</div>
            <strong>{scaledNutrition.protein}g</strong>
          </div>
          <div className="nutrition-chip">
            <div className="nutrition-label">Carbs</div>
            <strong>{scaledNutrition.carbs}g</strong>
          </div>
          <div className="nutrition-chip">
            <div className="nutrition-label">Fats</div>
            <strong>{scaledNutrition.fats}g</strong>
          </div>
        </div>
      )}

      <div className="recipe-detail-section">
        <div className="section-heading">Ingredients</div>
        <ul className="ingredient-list">
          {ingredients.map((item, index) => (
            <li key={index} className="ingredient-item">{item}</li>
          ))}
        </ul>
      </div>

      <div className="recipe-detail-section">
        <div className="section-heading">Steps</div>
        <ol className="steps-list">
          {steps.map((step, index) => (
            <li key={index} className="step-item">{step}</li>
          ))}
        </ol>
      </div>

      {tip && (
        <div className="recipe-detail-note">
          <div className="section-heading">Pro Tip</div>
          <p>{tip}</p>
        </div>
      )}

      <PrimaryButton className="share-whatsapp-btn" onClick={handleShare}>
        📲 Share on WhatsApp
      </PrimaryButton>
    </section>
  );
}
