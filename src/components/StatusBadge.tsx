import type { ArmStatus } from "../types";

interface StatusBadgeProps {
  status: ArmStatus | "not checked";
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return <span className={`status-badge status-${status.replace(" ", "-")}`}>{status}</span>;
}
