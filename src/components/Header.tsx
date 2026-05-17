import { Settings } from "lucide-react";
import { Button } from "./Button";

interface HeaderProps {
  dateLabel: string;
  onOpenSettings: () => void;
}

export function Header({ dateLabel, onOpenSettings }: HeaderProps) {
  return (
    <header className="app-header">
      <div>
        <div className="eyebrow">{dateLabel}</div>
        <h1>Summer Redline</h1>
        <p>Baseball Development Dashboard</p>
      </div>
      <Button
        variant="ghost"
        className="icon-button"
        icon={<Settings size={20} />}
        aria-label="Open reference and settings"
        title="Reference and settings"
        onClick={onOpenSettings}
      >
        <span className="sr-only">Settings</span>
      </Button>
    </header>
  );
}
