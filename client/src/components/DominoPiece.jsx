function Pips({ n }) {
  // layout simples de pintas num grelha 3x3
  const layouts = {
    0: [],
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8],
  };
  const active = new Set(layouts[n] ?? []);
  return (
    <div className="dm-pips">
      {Array.from({ length: 9 }).map((_, i) => (
        <span key={i} className={`dm-pip ${active.has(i) ? "dm-pip-on" : ""}`} />
      ))}
    </div>
  );
}

export default function DominoPiece({ piece, onClick, disabled, selected, vertical, small }) {
  return (
    <button
      className={`dm-piece ${vertical ? "dm-piece-vertical" : ""} ${small ? "dm-piece-small" : ""} ${disabled ? "dm-piece-disabled" : ""} ${selected ? "dm-piece-selected" : ""}`}
      onClick={() => !disabled && onClick?.(piece)}
      disabled={disabled}
      aria-label={`Peça ${piece.a}-${piece.b}`}
    >
      <Pips n={piece.a} />
      <span className="dm-piece-divider" />
      <Pips n={piece.b} />
    </button>
  );
}
