export default function BottomNav({ activeTab, onChange }) {
  return (
    <div className="bottom-nav">
      <button type="button" className={`bottom-nav-button ${activeTab === "home" ? "active" : ""}`} onClick={() => onChange("home")}>
        🏠 Home
      </button>
      <button type="button" className={`bottom-nav-button ${activeTab === "inventory" ? "active" : ""}`} onClick={() => onChange("inventory")}>
        🛒 Inventory
      </button>
    </div>
  );
}
