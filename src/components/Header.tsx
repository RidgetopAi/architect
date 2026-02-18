import { Save } from "lucide-react";

interface HeaderProps {
  isSaving: boolean;
  onSave: () => void;
}

export function Header({ isSaving, onSave }: HeaderProps) {
  return (
    <header className="flex h-12 items-center justify-between border-b bg-background px-4">
      <h1 className="text-sm font-bold tracking-tight">Architect</h1>
      <button
        onClick={onSave}
        disabled={isSaving}
        className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
      >
        <Save className="h-3.5 w-3.5" />
        {isSaving ? "Saving…" : "Save"}
      </button>
    </header>
  );
}
