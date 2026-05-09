import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { Drill } from "../types";
import { drillCategories } from "../data/drills";
import { Card } from "../components/Card";
import { DrillCard } from "../components/DrillCard";

interface DrillsProps {
  drills: Drill[];
}

export function Drills({ drills }: DrillsProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return drills.filter((drill) => {
      const matchesCategory =
        category === "All" ||
        drill.category === category ||
        (category === "Warmup" && drill.category === "Plyos");
      const haystack = `${drill.name} ${drill.category} ${drill.problem} ${drill.useWhen} ${drill.cue}`.toLowerCase();
      return matchesCategory && (!normalized || haystack.includes(normalized));
    });
  }, [category, drills, query]);

  return (
    <div className="screen stack">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Library</span>
          <h2>Drills</h2>
        </div>
      </div>

      <Card>
        <label className="search-field">
          <Search size={18} />
          <input
            placeholder="Search drills, cues, problems"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <div className="chip-row" role="list" aria-label="Drill filters">
          {drillCategories.map((item) => (
            <button
              key={item}
              type="button"
              className={`chip ${category === item ? "active" : ""}`}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </Card>

      <div className="card-list">
        {filtered.map((drill) => (
          <DrillCard key={drill.id} drill={drill} />
        ))}
      </div>
    </div>
  );
}
