import React, { createContext, useContext, useEffect, useState } from "react";

const AppStoreContext = createContext(null);

const STORAGE_KEYS = {
  inventory: "kyaBanaye_inventory",
  savedRecipes: "kyaBanaye_savedRecipes",
  groceryList: "kyaBanaye_groceryList",
};

const parseLocalStorage = (key, fallback) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
};

const generateId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const normalizeGroceryItem = (item) => {
  if (!item) return null;
  if (typeof item === "string") {
    return {
      id: generateId(),
      name: item.trim(),
      category: "recipe",
      source: "Imported",
      checked: false,
    };
  }
  if (typeof item === "object") {
    return {
      id: item.id || generateId(),
      name: (item.name || "").trim(),
      category: ["monthly", "instant", "recipe"].includes(item.category) ? item.category : "recipe",
      source: typeof item.source === "string" && item.source.trim() ? item.source : item.category === "manual" ? "Manual" : item.source || "Imported",
      checked: typeof item.checked === "boolean" ? item.checked : false,
    };
  }
  return null;
};

const normalizeGroceryList = (raw) => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(normalizeGroceryItem)
    .filter((item) => item && item.name.length > 0)
    .reduce((acc, item) => {
      if (!acc.some((existing) => existing.name.toLowerCase() === item.name.toLowerCase() && existing.category === item.category)) {
        acc.push(item);
      }
      return acc;
    }, []);
};

const createGroceryItem = ({ name, category = "monthly", source = "Manual" }) => ({
  id: generateId(),
  name: name.trim(),
  category: ["monthly", "instant", "recipe"].includes(category) ? category : "monthly",
  source: source.trim() || "Manual",
  checked: false,
});

export function AppStoreProvider({ children }) {
  const [inventory, setInventory] = useState(() => parseLocalStorage(STORAGE_KEYS.inventory, []));
  const [savedRecipes, setSavedRecipes] = useState(() => parseLocalStorage(STORAGE_KEYS.savedRecipes, []));
  const [groceryList, setGroceryList] = useState(() => normalizeGroceryList(parseLocalStorage(STORAGE_KEYS.groceryList, [])));

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.inventory, JSON.stringify(inventory));
    } catch {
      // ignore write errors
    }
  }, [inventory]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.savedRecipes, JSON.stringify(savedRecipes));
    } catch {
      // ignore write errors
    }
  }, [savedRecipes]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.groceryList, JSON.stringify(groceryList));
    } catch {
      // ignore write errors
    }
  }, [groceryList]);

  const addManualItem = (name, category = "monthly") => {
    const trimmed = (name || "").trim();
    if (!trimmed) return;
    setGroceryList((prev) => {
      const newItem = createGroceryItem({ name: trimmed, category, source: "Manual" });
      const exists = prev.some((item) => item.name.toLowerCase() === newItem.name.toLowerCase() && item.category === newItem.category);
      return exists ? prev : [...prev, newItem];
    });
  };

  return (
    <AppStoreContext.Provider
      value={{
        inventory,
        setInventory,
        savedRecipes,
        setSavedRecipes,
        groceryList,
        setGroceryList,
        addManualItem,
      }}
    >
      {children}
    </AppStoreContext.Provider>
  );
}

export function useAppStore() {
  const context = useContext(AppStoreContext);
  if (!context) {
    throw new Error("useAppStore must be used within AppStoreProvider");
  }
  return context;
}
