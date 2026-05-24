export function openShoppingApp(store, itemName) {
  const query = encodeURIComponent(itemName);
  if (store === "blinkit") {
    window.open(`https://blinkit.com/s/?q=${query}`, "_blank");
    return;
  }
  if (store === "amazon") {
    window.open(`https://www.amazon.in/s?k=${query}&i=grocery`, "_blank");
    return;
  }
}
