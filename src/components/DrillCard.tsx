import { ExternalLink } from "lucide-react";
import type { Drill } from "../types";
import { Button } from "./Button";
import { Card } from "./Card";

interface DrillCardProps {
  drill: Drill;
  compact?: boolean;
  embedded?: boolean;
}

export function DrillCard({ drill, compact = false, embedded = false }: DrillCardProps) {
  const content = (
    <>
      <div className="card-topline">
        <span>{drill.category}</span>
        <span>{drill.dose}</span>
      </div>
      <h3>{drill.name}</h3>
      {!compact ? (
        <>
          <p>
            <strong>Problem:</strong> {drill.problem}
          </p>
          <p>
            <strong>Use when:</strong> {drill.useWhen}
          </p>
        </>
      ) : null}
      <p>
        <strong>Cue:</strong> {drill.cue}
      </p>
      {!compact && drill.avoidIf ? (
        <p>
          <strong>Avoid if:</strong> {drill.avoidIf}
        </p>
      ) : null}
      {drill.mediaUrl ? (
        <Button
          variant="ghost"
          icon={<ExternalLink size={17} />}
          onClick={() => window.open(drill.mediaUrl, "_blank", "noopener,noreferrer")}
        >
          {drill.mediaLabel ?? "Watch"}
        </Button>
      ) : null}
    </>
  );

  if (embedded) {
    return <div className={`drill-card embedded-drill ${compact ? "compact" : ""}`}>{content}</div>;
  }

  return (
    <Card className={`drill-card ${compact ? "compact" : ""}`}>
      {content}
    </Card>
  );
}
