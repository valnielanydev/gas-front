export const THEME_STORAGE_KEY = "vaptgas:theme";

/**
 * Inline `<head>` script that applies the saved theme before the first paint, so the
 * page never flashes light while React hydrates. Resolves the "system" preference and
 * keeps following OS changes for as long as the saved preference is still "system".
 * Must stay dependency-free: it runs as a plain string before any bundle loads.
 */
export const themeInitScript = `(function () {
  try {
    var key = ${JSON.stringify(THEME_STORAGE_KEY)};
    var mql = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
    var apply = function () {
      var pref = localStorage.getItem(key);
      var dark = pref === "dark" || (pref === "system" && !!mql && mql.matches);
      document.documentElement.classList.toggle("dark", dark);
      document.documentElement.style.colorScheme = dark ? "dark" : "light";
    };
    apply();
    if (mql) {
      mql.addEventListener("change", function () {
        if (localStorage.getItem(key) === "system") apply();
      });
    }
  } catch (e) {}
})();`;
