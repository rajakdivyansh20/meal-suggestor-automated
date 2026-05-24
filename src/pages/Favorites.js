import React from "react";
import { useAppStore } from "../context/AppStore";
import RecipeCard from "../components/RecipeCard";

export default function Favorites() {
  const { savedRecipes, setSavedRecipes } = useAppStore();

  const remove = (dish) => {
    const filtered = savedRecipes.filter((r) => r.name !== dish.name);
    setSavedRecipes(filtered);
  };

  return (
    <div className="favorites-page">
      <div className="bento-card page-card" style={{ padding: 20, marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>❤️ Your Saved Recipes</h2>
      </div>

      {(!savedRecipes || savedRecipes.length === 0) ? (
        <div className="empty-state">No recipes saved yet. Go find something tasty!</div>
      ) : (
        <div className="favorites-grid">
          {savedRecipes.map((dish, i) => (
            <div key={i} className="favorite-card">
              <RecipeCard dish={dish} onSelect={() => { /* noop: selection handled elsewhere */ }} />
              <button className="heart-unsave" onClick={() => remove(dish)} aria-label={`Remove ${dish.name} from favorites`}>Unsave</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
