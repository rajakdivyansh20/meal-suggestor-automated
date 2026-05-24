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

export function AppStoreProvider({ children }) {
  const [inventory, setInventory] = useState(() => parseLocalStorage(STORAGE_KEYS.inventory, []));
  const [savedRecipes, setSavedRecipes] = useState(() => parseLocalStorage(STORAGE_KEYS.savedRecipes, []));
  const [groceryList, setGroceryList] = useState(() => parseLocalStorage(STORAGE_KEYS.groceryList, []));

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

  return (
    <AppStoreContext.Provider
      value={{
        inventory,
        setInventory,
        savedRecipes,
        setSavedRecipes,
        groceryList,
        setGroceryList,
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
