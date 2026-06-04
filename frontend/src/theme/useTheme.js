import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CUSTOM_THEMES_STORAGE_KEY,
  DEFAULT_THEME_ID,
  THEME_STORAGE_KEY,
  THEME_VARIABLES,
  WALLPAPER_IMAGE_STORAGE_KEY,
  WALLPAPER_STORAGE_KEY,
  predefinedThemes,
} from "./themes";

const ThemeContext = createContext(null);

function readJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function normalizeThemeId(themeId) {
  if (
    !themeId ||
    themeId === "dark" ||
    themeId === "pulse-dark" ||
    themeId === "pulse-midnight"
  ) {
    return DEFAULT_THEME_ID;
  }

  if (themeId === "light" || themeId === "pulse-light") {
    return "arctic-white";
  }

  return themeId;
}

function findTheme(themes, themeId) {
  return themes.find((theme) => theme.id === normalizeThemeId(themeId)) || themes[0];
}

export function applyTheme(theme) {
  if (!theme || typeof document === "undefined") return;

  const root = document.documentElement;
  const variables = theme.variables || {};

  root.dataset.theme = theme.id;
  root.classList.toggle("dark", !theme.light);

  THEME_VARIABLES.forEach((name) => {
    const value = variables[name];

    if (value) {
      root.style.setProperty(name, value);
    }
  });

  root.style.setProperty("--color-sidebar", "color-mix(in srgb, var(--color-bg) 72%, var(--color-card))");
  root.style.setProperty("--color-elevated", "color-mix(in srgb, var(--color-card) 86%, var(--color-secondary) 14%)");
  root.style.setProperty("--color-input", "color-mix(in srgb, var(--color-card) 88%, var(--color-bg))");
  root.style.setProperty("--color-input-fg", "var(--color-fg)");
  root.style.setProperty("--color-input-placeholder", "var(--color-muted-fg)");
  root.style.setProperty("--color-menu", "color-mix(in srgb, var(--color-card) 90%, var(--color-bg))");
  root.style.setProperty("--color-menu-fg", "var(--color-fg)");
  root.style.setProperty("--color-menu-hover", "color-mix(in srgb, var(--color-muted) 76%, var(--color-primary) 12%)");
  root.style.setProperty("--color-hover", "color-mix(in srgb, var(--color-muted) 82%, var(--color-primary) 10%)");
  root.style.setProperty("--color-primary-hover", "color-mix(in srgb, var(--color-primary) 82%, white 18%)");
  root.style.setProperty("--color-primary-fg", variables["--color-primary-fg"] || "var(--color-fg)");
  root.style.setProperty("--color-primary-soft", "color-mix(in srgb, var(--color-primary) 16%, transparent)");
  root.style.setProperty("--color-primary-border", "color-mix(in srgb, var(--color-primary) 34%, transparent)");
  root.style.setProperty("--color-secondary-soft", "color-mix(in srgb, var(--color-secondary) 18%, transparent)");
  root.style.setProperty("--color-overlay", "color-mix(in srgb, var(--color-bg) 94%, transparent)");
  root.style.setProperty("--color-overlay-soft", "color-mix(in srgb, var(--color-fg) 10%, transparent)");
  root.style.setProperty("--color-overlay-muted", "color-mix(in srgb, var(--color-fg) 6%, transparent)");
  root.style.setProperty("--color-scrim", "color-mix(in srgb, var(--color-bg) 72%, transparent)");
  root.style.setProperty("--color-bubble-me-fg", variables["--color-bubble-me-fg"] || "var(--color-fg)");
  root.style.setProperty("--color-bubble-them-fg", "var(--color-fg)");
  root.style.setProperty("--color-bubble-meta", "color-mix(in srgb, var(--color-muted-fg) 88%, var(--color-fg))");
  root.style.setProperty("--color-bubble-hover", "color-mix(in srgb, var(--color-bubble-them) 84%, var(--color-primary) 10%)");
  root.style.setProperty("--color-bubble-soft", "color-mix(in srgb, var(--color-fg) 9%, transparent)");
  root.style.setProperty("--color-danger-hover", "color-mix(in srgb, var(--color-danger) 84%, white 16%)");
  root.style.setProperty("--color-danger-soft", "color-mix(in srgb, var(--color-danger) 15%, transparent)");
  root.style.setProperty("--color-danger-fg", "var(--color-primary-fg)");
  root.style.setProperty("--color-success-soft", "color-mix(in srgb, var(--color-success) 15%, transparent)");
  root.style.setProperty("--color-success-border", "color-mix(in srgb, var(--color-success) 34%, transparent)");
  root.style.setProperty("--color-reaction-bg", "color-mix(in srgb, var(--color-menu) 88%, transparent)");
  root.style.setProperty("--color-reaction-selected", "color-mix(in srgb, var(--color-primary) 25%, transparent)");
  root.style.setProperty("--color-reaction-border", "color-mix(in srgb, var(--color-fg) 13%, transparent)");
  root.style.setProperty("--color-status-seen", "var(--color-secondary)");
}

export function applyWallpaper(wallpaperId, imageUrl = "") {
  if (typeof document === "undefined") return;

  const root = document.documentElement;

  root.dataset.wallpaper = wallpaperId || "gradient";

  if (imageUrl) {
    root.style.setProperty("--chat-wallpaper-image", `url("${imageUrl}")`);
  } else {
    root.style.removeProperty("--chat-wallpaper-image");
  }
}

export function initializeTheme() {
  if (typeof localStorage === "undefined") return;

  const customThemes = readJson(CUSTOM_THEMES_STORAGE_KEY, []);
  const allThemes = [...predefinedThemes, ...customThemes];
  const activeTheme = findTheme(
    allThemes,
    localStorage.getItem(THEME_STORAGE_KEY) || localStorage.getItem("theme")
  );
  const wallpaperId = localStorage.getItem(WALLPAPER_STORAGE_KEY) || "gradient";
  const wallpaperImage = localStorage.getItem(WALLPAPER_IMAGE_STORAGE_KEY) || "";

  applyTheme(activeTheme);
  applyWallpaper(wallpaperId, wallpaperImage);
}

export function ThemeProvider({ children }) {
  const [customThemes, setCustomThemes] = useState(() =>
    readJson(CUSTOM_THEMES_STORAGE_KEY, [])
  );
  const [savedThemeId, setSavedThemeId] = useState(() =>
    normalizeThemeId(localStorage.getItem(THEME_STORAGE_KEY) || localStorage.getItem("theme"))
  );
  const [previewThemeId, setPreviewThemeId] = useState(savedThemeId);
  const [wallpaper, setWallpaperState] = useState(() =>
    localStorage.getItem(WALLPAPER_STORAGE_KEY) || "gradient"
  );
  const [wallpaperImage, setWallpaperImageState] = useState(() =>
    localStorage.getItem(WALLPAPER_IMAGE_STORAGE_KEY) || ""
  );

  const themes = useMemo(
    () => [...predefinedThemes, ...customThemes],
    [customThemes]
  );

  const activeTheme = useMemo(
    () => findTheme(themes, previewThemeId),
    [previewThemeId, themes]
  );

  const savedTheme = useMemo(
    () => findTheme(themes, savedThemeId),
    [savedThemeId, themes]
  );

  useEffect(() => {
    applyTheme(activeTheme);
  }, [activeTheme]);

  useEffect(() => {
    applyWallpaper(wallpaper, wallpaperImage);
  }, [wallpaper, wallpaperImage]);

  const previewTheme = useCallback((themeId) => {
    setPreviewThemeId(normalizeThemeId(themeId));
  }, []);

  const saveTheme = useCallback((themeId = previewThemeId) => {
    const normalized = normalizeThemeId(themeId);

    localStorage.setItem(THEME_STORAGE_KEY, normalized);
    localStorage.setItem("theme", normalized);
    setSavedThemeId(normalized);
    setPreviewThemeId(normalized);
  }, [previewThemeId]);

  const resetTheme = useCallback(() => {
    localStorage.setItem(THEME_STORAGE_KEY, DEFAULT_THEME_ID);
    localStorage.setItem("theme", DEFAULT_THEME_ID);
    setSavedThemeId(DEFAULT_THEME_ID);
    setPreviewThemeId(DEFAULT_THEME_ID);
  }, []);

  const saveCustomTheme = useCallback((theme) => {
    setCustomThemes((prev) => {
      const next = [...prev.filter((item) => item.id !== theme.id), theme];

      writeJson(CUSTOM_THEMES_STORAGE_KEY, next);
      return next;
    });
  }, []);

  const deleteCustomTheme = useCallback((themeId) => {
    setCustomThemes((prev) => {
      const next = prev.filter((theme) => theme.id !== themeId);
      writeJson(CUSTOM_THEMES_STORAGE_KEY, next);
      return next;
    });

    if (savedThemeId === themeId || previewThemeId === themeId) {
      resetTheme();
    }
  }, [previewThemeId, resetTheme, savedThemeId]);

  const setWallpaper = useCallback((wallpaperId, imageUrl = wallpaperImage) => {
    localStorage.setItem(WALLPAPER_STORAGE_KEY, wallpaperId);
    setWallpaperState(wallpaperId);

    if (wallpaperId === "custom" && imageUrl) {
      localStorage.setItem(WALLPAPER_IMAGE_STORAGE_KEY, imageUrl);
      setWallpaperImageState(imageUrl);
      return;
    }

    if (wallpaperId !== "custom") {
      localStorage.removeItem(WALLPAPER_IMAGE_STORAGE_KEY);
      setWallpaperImageState("");
    }
  }, [wallpaperImage]);

  const resetWallpaper = useCallback(() => {
    localStorage.setItem(WALLPAPER_STORAGE_KEY, "gradient");
    localStorage.removeItem(WALLPAPER_IMAGE_STORAGE_KEY);
    setWallpaperState("gradient");
    setWallpaperImageState("");
  }, []);

  const value = useMemo(
    () => ({
      activeTheme,
      activeThemeId: activeTheme.id,
      customThemes,
      deleteCustomTheme,
      hasUnsavedTheme: activeTheme.id !== savedTheme.id,
      previewTheme,
      resetTheme,
      resetWallpaper,
      saveCustomTheme,
      savedTheme,
      savedThemeId: savedTheme.id,
      saveTheme,
      setTheme: saveTheme,
      setWallpaper,
      setWallpaperImage: setWallpaperImageState,
      themes,
      wallpaper,
      wallpaperImage,
    }),
    [
      activeTheme,
      customThemes,
      deleteCustomTheme,
      previewTheme,
      resetTheme,
      resetWallpaper,
      saveCustomTheme,
      savedTheme,
      saveTheme,
      setWallpaper,
      themes,
      wallpaper,
      wallpaperImage,
    ]
  );

  return createElement(
    ThemeContext.Provider,
    { value },
    children
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
}
