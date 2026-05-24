import { useState } from "react";
import { useAppStore } from "../context/AppStore";

export default function Inventory() {
  const { inventory, setInventory } = useAppStore();
  const [ingredientInput, setIngredientInput] = useState("");

  const addIngredient = () => {
    const value = ingredientInput.trim();
    if (!value) return;
    if (inventory.includes(value)) {
      setIngredientInput("");
      return;
    }
    setInventory([...inventory, value]);
    setIngredientInput("");
  };

  const removeIngredient = (item) => {
    setInventory(inventory.filter((entry) => entry !== item));
  };

  const styles = {
    page: { minHeight: "100%", background: "#FAFAFA", color: "#2D2D2D", paddingBottom: "120px" },
    topSection: { background: "#FFFFFF", border: "1px solid #EAEAEA", borderRadius: "24px", padding: "24px", boxShadow: "0 12px 32px rgba(0,0,0,0.05)", marginBottom: "20px" },
    heading: { fontSize: "24px", fontWeight: "700", marginBottom: "8px", letterSpacing: "-0.4px" },
    subtext: { fontSize: "14px", color: "#666666", lineHeight: "1.7" },
    inputRow: { display: "flex", gap: "10px", marginTop: "20px" },
    input: { flex: 1, padding: "14px 16px", borderRadius: "16px", border: "1px solid #EAEAEA", background: "#F5F5F7", fontSize: "15px", color: "#2D2D2D", outline: "none" },
    addButton: { minWidth: "120px", background: "#E28743", border: "none", borderRadius: "16px", color: "#FFFFFF", fontWeight: "700", cursor: "pointer", padding: "14px 18px", boxShadow: "0 12px 24px rgba(226,135,67,0.2)" },
    pillGrid: { display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "24px" },
    pill: { display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 14px", borderRadius: "999px", background: "#F5F5F7", color: "#666666", fontSize: "14px", fontWeight: "600" },
    removeButton: { background: "transparent", border: "none", color: "#A0A0A0", cursor: "pointer", fontSize: "14px", padding: 0, marginLeft: "4px" },
    actionCard: { position: "sticky", bottom: "24px", left: 0, right: 0, marginTop: "20px", padding: "18px", margin: "0 auto", background: "#FFFFFF", borderRadius: "22px", border: "1px solid #EAEAEA", boxShadow: "0 18px 40px rgba(0,0,0,0.05)", maxWidth: "640px" },
    actionButton: { width: "100%", padding: "16px 18px", borderRadius: "18px", border: "none", background: "#E28743", color: "#FFFFFF", fontWeight: "700", fontSize: "16px", cursor: "pointer", boxShadow: "0 14px 28px rgba(226,135,67,0.22)" },
  };

  return (
    <div style={styles.page}>
      <div style={styles.topSection}>
        <div style={styles.heading}>Smart Kitchen Inventory</div>
        <div style={styles.subtext}>
          Add the ingredients you already have and let Kya Banaye help you discover meals that make the most of your pantry.
        </div>

        <div style={styles.inputRow}>
          <input
            type="text"
            placeholder="Add an ingredient like Paneer or Tomato"
            value={ingredientInput}
            onChange={(e) => setIngredientInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addIngredient()}
            style={styles.input}
          />
          <button type="button" onClick={addIngredient} style={styles.addButton}>
            Add
          </button>
        </div>

        <div style={styles.pillGrid}>
          {inventory.length === 0 ? (
            <div style={{ color: "#999999", fontSize: "14px" }}>No ingredients yet. Start typing to build your inventory.</div>
          ) : (
            inventory.map((item) => (
              <div key={item} style={styles.pill}>
                {item}
                <button type="button" aria-label={`Remove ${item}`} onClick={() => removeIngredient(item)} style={styles.removeButton}>
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={styles.actionCard}>
        <button type="button" style={styles.actionButton} onClick={() => {}}>
          ✨ Suggest Meals with these
        </button>
      </div>
    </div>
  );
}
