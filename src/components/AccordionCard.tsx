import { ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Card } from "./Card";

interface AccordionCardProps {
  title: string;
  summary: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

export function AccordionCard({ title, summary, children, defaultOpen = false }: AccordionCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card className={`accordion-card ${open ? "open" : ""}`}>
      <button type="button" className="accordion-trigger" onClick={() => setOpen((current) => !current)}>
        <span>
          <strong>{title}</strong>
          <small>{summary}</small>
        </span>
        <ChevronDown size={19} aria-hidden="true" />
      </button>
      {open ? <div className="accordion-body">{children}</div> : null}
    </Card>
  );
}
