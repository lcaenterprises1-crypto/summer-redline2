import { Download, RotateCcw, Trash2, Upload } from "lucide-react";
import type { ChangeEvent } from "react";
import type { AppBackup } from "../logic/storage";
import type { Settings } from "../types";
import { plyoGuidanceCards, referenceCards } from "../data/referenceCards";
import { warmupCards } from "../data/warmups";
import { Button } from "../components/Button";
import { Card } from "../components/Card";

interface ReferenceSettingsProps {
  settings: Settings;
  logCount: number;
  checkInCount: number;
  onUpdateSettings: (settings: Settings) => void;
  onResetPlan: () => void;
  onResetApp: () => void;
  onExportLogs: () => void;
  onExportJson: () => void;
  onImportJson: (backup: AppBackup) => void;
}

export function ReferenceSettings({
  settings,
  logCount,
  checkInCount,
  onUpdateSettings,
  onResetPlan,
  onResetApp,
  onExportLogs,
  onExportJson,
  onImportJson,
}: ReferenceSettingsProps) {
  const handleImport = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const backup = JSON.parse(String(reader.result)) as AppBackup;
        onImportJson(backup);
        event.target.value = "";
      } catch {
        window.alert("That backup file could not be imported.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="screen stack">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Reference / Settings</span>
          <h2>Control Room</h2>
        </div>
      </div>

      <Card accent>
        <div className="stack">
          <label className="field">
            <span>Start date</span>
            <input
              type="date"
              value={settings.startDate}
              onChange={(event) => onUpdateSettings({ ...settings, startDate: event.target.value })}
            />
          </label>
          <p className="muted-line">
            Changing the date here updates settings. Use reset plan if you want the whole schedule regenerated.
          </p>
          <div className="metric-grid small">
            <div className="mini-metric">
              <span>Logs</span>
              <strong>{logCount}</strong>
            </div>
            <div className="mini-metric">
              <span>Check-ins</span>
              <strong>{checkInCount}</strong>
            </div>
          </div>
          <div className="button-stack">
            <Button variant="primary" icon={<Download size={18} />} onClick={onExportLogs} fullWidth>
              Export Logs CSV
            </Button>
            <Button variant="secondary" icon={<Download size={18} />} onClick={onExportJson} fullWidth>
              Export All Data JSON
            </Button>
            <label className="file-button">
              <Upload size={18} />
              <span>Import JSON Backup</span>
              <input type="file" accept="application/json" onChange={handleImport} />
            </label>
            <Button variant="ghost" icon={<RotateCcw size={18} />} onClick={onResetPlan} fullWidth>
              Reset Plan to Default
            </Button>
            <Button variant="danger" icon={<Trash2 size={18} />} onClick={onResetApp} fullWidth>
              Reset App Data
            </Button>
          </div>
        </div>
      </Card>

      <div className="section-heading">
        <div>
          <span className="eyebrow">Short rules</span>
          <h2>Reference</h2>
        </div>
      </div>
      <div className="card-list">
        {referenceCards.map((card) => (
          <RuleCard key={card.id} title={card.title} bullets={card.bullets} />
        ))}
      </div>

      <div className="section-heading">
        <div>
          <span className="eyebrow">Plyos</span>
          <h2>Guidance</h2>
        </div>
      </div>
      <div className="card-list">
        {plyoGuidanceCards.map((card) => (
          <RuleCard key={card.id} title={card.title} bullets={card.bullets} />
        ))}
      </div>

      <div className="section-heading">
        <div>
          <span className="eyebrow">Warmup</span>
          <h2>Templates</h2>
        </div>
      </div>
      <div className="card-list">
        {warmupCards.map((card) => (
          <RuleCard key={card.id} title={card.title} bullets={card.steps} />
        ))}
      </div>
    </div>
  );
}

function RuleCard({ title, bullets }: { title: string; bullets: string[] }) {
  return (
    <Card>
      <h3>{title}</h3>
      <ul className="tight-list">
        {bullets.map((bullet) => (
          <li key={bullet}>{bullet}</li>
        ))}
      </ul>
    </Card>
  );
}
