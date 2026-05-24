import React, { useMemo, useState } from "react";
import { useAppStore } from "../context/AppStore";
import BentoCard from "../components/BentoCard";
import { openShoppingApp } from "../utils/openShoppingApp";

const CATEGORY_LABELS = {
  recipe: "Recipe Grocery",
  manual: "Manually Added",
  shopping: "To Be Brought From",
};

const storeLabel = (category) => {
  if (category === "monthly") return "D-Mart";
  if (category === "instant") return "Blinkit";
  return "Other";
};

export default function GroceryList() {
  const { groceryList, setGroceryList, addManualItem } = useAppStore();
  const [manualName, setManualName] = useState("");
  const [manualCategory, setManualCategory] = useState("monthly");
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const recipeItems = useMemo(
    () => (groceryList || []).filter((item) => item.category === "recipe" && item.source !== "Manual"),
    [groceryList]
  );

  const manualItems = useMemo(
    () => (groceryList || []).filter((item) => item.source === "Manual"),
    [groceryList]
  );

  const purchaseItems = useMemo(
    () => (groceryList || []).filter((item) => item.category !== "recipe" && item.source !== "Manual"),
    [groceryList]
  );

  const updateChecked = (itemId) => {
    setGroceryList((prev) => prev.map((item) => item.id === itemId ? { ...item, checked: !item.checked } : item));
  };

  const toggleSelected = (itemId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const clearChecked = () => {
    setGroceryList((prev) => prev.filter((item) => !item.checked));
  };

  const discardSelected = () => {
    if (selectedIds.size === 0) return;
    setGroceryList((prev) => prev.filter((item) => !selectedIds.has(item.id)));
    setSelectedIds(new Set());
  };

  const discardBlock = (blockItems) => {
    const blockIds = new Set(blockItems.map((item) => item.id));
    setGroceryList((prev) => prev.filter((item) => !blockIds.has(item.id)));
    setSelectedIds((prev) => new Set(Array.from(prev).filter((id) => !blockIds.has(id))));
  };

  const toggleBlockSelection = (blockItems) => {
    const blockIds = new Set(blockItems.map((item) => item.id));
    const allSelected = blockItems.every((item) => selectedIds.has(item.id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        blockItems.forEach((item) => next.delete(item.id));
      } else {
        blockItems.forEach((item) => next.add(item.id));
      }
      return next;
    });
  };

  const addItem = () => {
    if (!manualName.trim()) return;
    addManualItem(manualName, manualCategory);
    setManualName("");
  };

  const blocks = [
    { id: "recipe", title: CATEGORY_LABELS.recipe, items: recipeItems },
    { id: "manual", title: CATEGORY_LABELS.manual, items: manualItems },
    { id: "shopping", title: CATEGORY_LABELS.shopping, items: purchaseItems },
  ];

  return (
    <div className="grocery-page">
      <BentoCard title="🛒 Smart Pantry Hub" subtitle="Manage recipe groceries, manual items, and purchase-from action blocks in one clean view." className="grocery-header">
        <div className="pantry-action-row">
          <input
            className="pantry-input"
            value={manualName}
            onChange={(e) => setManualName(e.target.value)}
            placeholder="Add an item, like Paneer or Eggs"
          />
          <select className="pantry-select" value={manualCategory} onChange={(e) => setManualCategory(e.target.value)}>
            <option value="monthly">🛒 Monthly D-Mart</option>
            <option value="instant">⚡ Instant Blinkit</option>
          </select>
          <button className="primary-button pantry-add-button" onClick={addItem}>
            Add
          </button>
        </div>
        <div className="pantry-header-actions">
          <button className="ghost-text-btn" onClick={clearChecked}>
            Clear Checked Items
          </button>
          <button className="ghost-text-btn" onClick={discardSelected}>
            Discard Selected
          </button>
        </div>
      </BentoCard>

      {blocks.map(({ id, title, items }) => (
        <section key={id} className="category-section">
          <div className="category-header-row">
            <div>
              <div className="category-heading">{title}</div>
              <div className="category-subtext">{items.length} item{items.length === 1 ? "" : "s"}</div>
            </div>
            <div className="category-controls">
              <button className="ghost-text-btn" onClick={() => toggleBlockSelection(items)}>
                {items.every((item) => selectedIds.has(item.id)) ? "Unselect All" : "Select All"}
              </button>
              <button className="ghost-text-btn" onClick={() => discardBlock(items)}>
                Discard Block
              </button>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="empty-section-note">No items in this block yet.</div>
          ) : (
            <div className="category-list">
              {items.map((item) => (
                <div key={item.id} className={`pantry-row ${item.checked ? "checked" : ""} ${selectedIds.has(item.id) ? "selected" : ""}`}>
                  <div className="pantry-left">
                    <button
                      className={`select-dot ${selectedIds.has(item.id) ? "selected" : ""}`}
                      onClick={() => toggleSelected(item.id)}
                      aria-pressed={selectedIds.has(item.id)}
                      aria-label={`Select ${item.name}`}
                    />
                    <button
                      className={`grocery-checkbox ${item.checked ? "on" : ""}`}
                      onClick={() => updateChecked(item.id)}
                      aria-pressed={item.checked}
                      aria-label={`Mark ${item.name} as bought`}
                    />
                    <div className="pantry-content">
                      <div className="grocery-text">{item.name}</div>
                      <div className="grocery-source">{item.source === "Manual" ? "Added manually" : `Added from ${item.source}`}</div>
                    </div>
                  </div>
                  <div className="pantry-actions">
                    <div className="store-pill">{item.category !== "recipe" ? storeLabel(item.category) : "Recipe"}</div>
                    <button className="deal-pill blinkit" onClick={() => openShoppingApp("blinkit", item.name)}>
                      Blinkit
                    </button>
                    <button className="deal-pill amazon" onClick={() => openShoppingApp("amazon", item.name)}>
                      Amazon
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ))}

      {groceryList.length === 0 && (
        <div className="empty-state">No pantry items yet. Add your first staple or pull ingredients from the weekly menu.</div>
      )}
    </div>
  );
}
