import { useState } from "react";
import {
  Check,
  Image,
  Palette,
  Plus,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import {
  buildCustomTheme,
  predefinedThemes,
  wallpaperOptions,
} from "./themes";
import { useTheme } from "./useTheme";

const customDefaults = predefinedThemes[0].variables;

const customFields = [
  { key: "primary", label: "Primary", variable: "--color-primary" },
  { key: "background", label: "Background", variable: "--color-bg" },
  { key: "card", label: "Card", variable: "--color-card" },
  { key: "myBubble", label: "My Bubble", variable: "--color-bubble-me" },
  { key: "otherBubble", label: "Other Bubble", variable: "--color-bubble-them" },
  { key: "text", label: "Text", variable: "--color-fg" },
];

function createInitialCustomTheme() {
  return {
    name: "",
    primary: customDefaults["--color-primary"],
    background: customDefaults["--color-bg"],
    card: customDefaults["--color-card"],
    myBubble: customDefaults["--color-bubble-me"],
    otherBubble: customDefaults["--color-bubble-them"],
    text: customDefaults["--color-fg"],
  };
}

export default function ThemeSettings() {
  const {
    activeThemeId,
    deleteCustomTheme,
    hasUnsavedTheme,
    previewTheme,
    resetTheme,
    resetWallpaper,
    saveCustomTheme,
    savedThemeId,
    saveTheme,
    setWallpaper,
    setWallpaperImage,
    themes,
    wallpaper,
    wallpaperImage,
  } = useTheme();

  const [customTheme, setCustomTheme] = useState(createInitialCustomTheme);

  const updateCustomTheme = (key, value) => {
    setCustomTheme((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const createCustomTheme = (e) => {
    e.preventDefault();

    const name = customTheme.name.trim();

    if (!name) {
      toast.error("Theme name is required");
      return;
    }

    const theme = buildCustomTheme({
      ...customTheme,
      id: `custom-${Date.now()}`,
      name,
    });

    saveCustomTheme(theme);
    previewTheme(theme.id);
    setCustomTheme(createInitialCustomTheme());
    toast.success("Custom theme previewed");
  };

  const applyCustomWallpaper = () => {
    const value = wallpaperImage.trim();

    if (!value) {
      toast.error("Enter an image URL first");
      return;
    }

    setWallpaper("custom", value);
    toast.success("Custom wallpaper applied");
  };

  const handleSaveTheme = () => {
    saveTheme();
    toast.success("Theme saved");
  };

  const handleResetTheme = () => {
    resetTheme();
    toast.success("Theme reset to Ocean Blue");
  };

  return (
    <div className="space-y-5">
      <section className="glass-surface rounded-3xl border border-[var(--color-border)] p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[var(--color-secondary)]">
              <Sparkles size={18} />
              <span className="text-xs font-semibold uppercase tracking-[0.2em]">
                Theme Manager
              </span>
            </div>

            <h2 className="mt-2 text-2xl font-bold">
              Settings / Themes
            </h2>

            <p className="mt-1 max-w-2xl text-sm text-[var(--color-muted-fg)]">
              Preview themes instantly, then save when the app feels right.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleResetTheme}
            >
              <RotateCcw size={16} />
              Reset
            </Button>

            <Button
              type="button"
              onClick={handleSaveTheme}
              className={hasUnsavedTheme ? "shadow-[var(--shadow-menu)]" : ""}
            >
              <Save size={16} />
              Save Theme
            </Button>
          </div>
        </div>

        {hasUnsavedTheme && (
          <div className="mt-4 rounded-2xl border border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] px-4 py-3 text-sm text-[var(--color-fg)]">
            Preview active. Save theme to keep it after refresh.
          </div>
        )}

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {themes.map((theme) => {
            const previewed = activeThemeId === theme.id;
            const saved = savedThemeId === theme.id;

            return (
              <motion.div
                key={theme.id}
                whileHover={{ y: -3 }}
                className={`rounded-2xl border p-3 transition ${
                  previewed
                    ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] shadow-[var(--shadow-card)]"
                    : "border-[var(--color-border)] bg-[var(--color-elevated)]/70 hover:bg-[var(--color-hover)]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => previewTheme(theme.id)}
                  className="w-full text-left"
                >
                  <div
                    className="mb-3 h-24 overflow-hidden rounded-2xl border border-[var(--color-border)] p-3"
                    style={{
                      background: `linear-gradient(135deg, ${theme.variables["--color-bg"]}, ${theme.variables["--color-card"]})`,
                    }}
                  >
                    <div
                      className="mb-2 h-3 w-20 rounded-full"
                      style={{ background: theme.variables["--color-muted"] }}
                    />

                    <div
                      className="ml-auto h-7 w-28 rounded-2xl rounded-br-md"
                      style={{ background: theme.variables["--color-bubble-me"] }}
                    />

                    <div
                      className="mt-2 h-7 w-32 rounded-2xl rounded-bl-md"
                      style={{ background: theme.variables["--color-bubble-them"] }}
                    />
                  </div>

                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">
                        {theme.name}
                      </div>

                      <div className="mt-1 text-xs text-[var(--color-muted-fg)]">
                        {theme.description}
                      </div>
                    </div>

                    <div className="flex gap-1">
                      {saved && (
                        <span className="rounded-full border border-[var(--color-success-border)] bg-[var(--color-success-soft)] px-2 py-1 text-[10px] font-semibold text-[var(--color-success)]">
                          Current
                        </span>
                      )}

                      {previewed && (
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-primary-fg)]">
                          <Check size={14} />
                        </span>
                      )}
                    </div>
                  </div>
                </button>

                {theme.custom && (
                  <button
                    type="button"
                    onClick={() => deleteCustomTheme(theme.id)}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)]"
                  >
                    <Trash2 size={15} />
                    Delete custom theme
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      </section>

      <form
        onSubmit={createCustomTheme}
        className="glass-surface rounded-3xl border border-[var(--color-border)] p-5"
      >
        <div className="flex items-center gap-2">
          <Palette size={18} className="text-[var(--color-secondary)]" />
          <h2 className="text-lg font-semibold">
            Create Custom Theme
          </h2>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">
              Theme Name
            </label>

            <Input
              value={customTheme.name}
              onChange={(e) => updateCustomTheme("name", e.target.value)}
              placeholder="My Pulse Theme"
            />
          </div>

          {customFields.map((field) => (
            <label
              key={field.key}
              className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-elevated)]/70 p-3"
            >
              <span className="text-sm font-medium">
                {field.label}
              </span>

              <input
                type="color"
                value={customTheme[field.key]}
                onChange={(e) => updateCustomTheme(field.key, e.target.value)}
                className="h-10 w-14 cursor-pointer rounded-xl border border-[var(--color-border)] bg-[var(--color-input)]"
              />
            </label>
          ))}
        </div>

        <Button type="submit" className="mt-5 w-full">
          <Plus size={16} />
          Create Preview Theme
        </Button>
      </form>

      <section className="glass-surface rounded-3xl border border-[var(--color-border)] p-5">
        <div className="flex items-center gap-2">
          <Image size={18} className="text-[var(--color-secondary)]" />
          <h2 className="text-lg font-semibold">
            Wallpaper Manager
          </h2>
        </div>

        <p className="mt-1 text-sm text-[var(--color-muted-fg)]">
          Wallpaper is fixed behind the scroll layer so only messages move.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {wallpaperOptions.map((option) => {
            const active = wallpaper === option.id;

            return (
              <motion.button
                key={option.id}
                type="button"
                whileHover={{ y: -2 }}
                onClick={() => setWallpaper(option.id)}
                className={`rounded-2xl border p-3 text-left transition ${
                  active
                    ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]"
                    : "border-[var(--color-border)] bg-[var(--color-elevated)]/70 hover:bg-[var(--color-hover)]"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">
                    {option.name}
                  </span>

                  {active && (
                    <Check size={16} className="text-[var(--color-secondary)]" />
                  )}
                </div>

                <div className="mt-1 text-xs text-[var(--color-muted-fg)]">
                  {option.description}
                </div>
              </motion.button>
            );
          })}
        </div>

        {wallpaper === "custom" && (
          <div className="mt-4 grid gap-2 md:grid-cols-[1fr_auto]">
            <Input
              value={wallpaperImage}
              onChange={(e) => setWallpaperImage(e.target.value)}
              placeholder="https://example.com/wallpaper.jpg"
            />

            <Button type="button" onClick={applyCustomWallpaper}>
              Apply Image
            </Button>
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          onClick={resetWallpaper}
          className="mt-4 w-full"
        >
          <RotateCcw size={16} />
          Reset Wallpaper
        </Button>
      </section>
    </div>
  );
}
