import { WASTE_TYPES, getDecayStage, yearsToTick } from "../data/wasteTypes";
import { WasteIllustration } from "./WasteIllustration";

export default function ComparisonBoard({ simYears, selectedId, onSelect }) {
  return (
    <section className="comparison-board panel" aria-labelledby="comparison-heading">
      <div className="comparison-header">
        <div>
          <p className="section-kicker">PAPAN INFORMASI SAMPAH TERURAI</p>
          <h2 id="comparison-heading">Perbandingan waktu urai di laut</h2>
        </div>
        <div className="comparison-scale-legend" aria-hidden="true">
          <span>0</span>
          <span>3 bln</span>
          <span>20 thn</span>
          <span>100 thn</span>
          <span>500+ thn</span>
        </div>
      </div>

      <div className="comparison-list">
        {WASTE_TYPES.map((waste) => {
          const targetTick = waste.durationYears > 500 ? 1000 : yearsToTick(waste.durationYears);
          const barWidth = Math.max(8, (targetTick / 1000) * 100);
          const decay = Math.min(1, simYears / waste.durationYears);
          const stage = getDecayStage(decay, waste);
          const isSelected = waste.id === selectedId;

          return (
            <button
              key={waste.id}
              type="button"
              className={`comparison-row ${isSelected ? "is-selected" : ""}`}
              onClick={() => onSelect(waste.id)}
              style={{ "--waste-color": waste.color, "--waste-tint": waste.tint }}
            >
              <span className="comparison-item">
                <span className="comparison-thumb">
                  <WasteIllustration type={waste.id} />
                </span>
                <span className="comparison-copy">
                  <strong>{waste.name}</strong>
                  <small>{waste.durationLabel}</small>
                </span>
              </span>

              <span className="comparison-bar-track" aria-hidden="true">
                <span
                  className="comparison-bar-fill"
                  style={{ width: `${barWidth}%` }}
                />
                <span
                  className="comparison-bar-marker"
                  style={{ left: `${Math.min(100, (yearsToTick(simYears) / 1000) * 100)}%` }}
                />
              </span>

              <span className={`stage-pill stage-${stage.tone}`}>
                {stage.label}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
