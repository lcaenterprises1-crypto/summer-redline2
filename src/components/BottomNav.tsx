import { Activity, BookOpen, CalendarDays, Dumbbell, ListChecks } from "lucide-react";
import type { ReactNode } from "react";
import type { Screen } from "../types";

interface BottomNavProps {
  active: Screen;
  onChange: (screen: Screen) => void;
}

const items: { screen: Screen; label: string; icon: ReactNode }[] = [
  { screen: "today", label: "Today", icon: <CalendarDays size={21} /> },
  { screen: "plan", label: "Plan", icon: <ListChecks size={21} /> },
  { screen: "drills", label: "Drills", icon: <Dumbbell size={21} /> },
  { screen: "log", label: "Log", icon: <BookOpen size={21} /> },
  { screen: "progress", label: "Progress", icon: <Activity size={21} /> },
];

export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="bottom-nav" aria-label="Primary">
      {items.map((item) => (
        <button
          key={item.screen}
          type="button"
          className={`nav-item ${active === item.screen ? "active" : ""}`}
          onClick={() => onChange(item.screen)}
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
