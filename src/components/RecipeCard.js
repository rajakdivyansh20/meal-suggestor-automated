export default function RecipeCard({ dish, onSelect }) {
  return (
    <button type="button" className="recipe-card interactive-card" onClick={() => onSelect(dish)}>
      <div className="recipe-card-emoji">{dish.emoji}</div>
      <div className="recipe-card-body">
        <div className="recipe-card-title">{dish.name}</div>
        <div className="recipe-card-copy">{dish.vibe}</div>
        <div className="recipe-card-meta">
          <span>{dish.time}</span>
          {dish.health_tags?.length ? <span>{dish.health_tags.join(" · ")}</span> : null}
        </div>
      </div>
    </button>
  );
}
