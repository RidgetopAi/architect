import { Save, Moon, Sun, Eraser, Check, Monitor, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";

interface HeaderProps {
  isSaving: boolean;
  onSave: () => void;
  onClearAi?: () => void;
  hasAiElements?: boolean;
  desktopTemplate?: boolean;
  mobileTemplate?: boolean;
  onToggleDesktopTemplate?: () => void;
  onToggleMobileTemplate?: () => void;
}

export function Header({
  isSaving,
  onSave,
  onClearAi,
  hasAiElements,
  desktopTemplate,
  mobileTemplate,
  onToggleDesktopTemplate,
  onToggleMobileTemplate,
}: HeaderProps) {
  const [isDark, setIsDark] = useState(
    () => document.documentElement.classList.contains("dark")
  );
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  function handleSave() {
    onSave();
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  }

  return (
    <header className="flex h-11 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-bold tracking-tight">Architect</h1>
        <span className="text-xs text-muted-foreground">AI Canvas</span>
      </div>

      <div className="flex items-center gap-1">
        {onToggleDesktopTemplate && (
          <button
            onClick={onToggleDesktopTemplate}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
              desktopTemplate
                ? "bg-purple-500/15 text-purple-500"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
            title="Toggle desktop template guide"
          >
            <Monitor className="h-3.5 w-3.5" />
            Desktop
          </button>
        )}

        {onToggleMobileTemplate && (
          <button
            onClick={onToggleMobileTemplate}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
              mobileTemplate
                ? "bg-purple-500/15 text-purple-500"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
            title="Toggle mobile template guide"
          >
            <Smartphone className="h-3.5 w-3.5" />
            Mobile
          </button>
        )}

        <div className="mx-1 h-4 w-px bg-border" />

        {hasAiElements && onClearAi && (
          <button
            onClick={onClearAi}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-orange-500 transition-colors hover:bg-orange-500/10"
            title="Clear AI elements"
          >
            <Eraser className="h-3.5 w-3.5" />
            Clear AI
          </button>
        )}

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
          title="Save canvas (Ctrl+S)"
        >
          {showSaved ? (
            <Check className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          {isSaving ? "Saving…" : showSaved ? "Saved" : "Save"}
        </button>

        <button
          onClick={() => setIsDark(!isDark)}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          title="Toggle theme"
        >
          {isDark ? (
            <Sun className="h-3.5 w-3.5" />
          ) : (
            <Moon className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </header>
  );
}
