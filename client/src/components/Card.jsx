const SUIT_SYMBOL = {
  copas: "♥",
  ouros: "♦",
  espadas: "♠",
  paus: "♣",
};

const SUIT_COLOR = {
  copas: "#a63d2f",
  ouros: "#a63d2f",
  espadas: "#1a1a1a",
  paus: "#1a1a1a",
};

export default function Card({ card, onClick, disabled, small, faceDown, highlight }) {
  if (faceDown) {
    return (
      <div className={`sc-card sc-card-back ${small ? "sc-card-small" : ""}`} aria-hidden="true" />
    );
  }

  return (
    <button
      className={`sc-card ${small ? "sc-card-small" : ""} ${disabled ? "sc-card-disabled" : ""} ${highlight ? "sc-card-highlight" : ""}`}
      onClick={() => !disabled && onClick?.(card)}
      disabled={disabled}
      style={{ color: SUIT_COLOR[card.suit] }}
      aria-label={`${card.rank} de ${card.suit}`}
    >
      <span className="sc-card-corner sc-card-corner-top">
        {card.rank}
        <br />
        {SUIT_SYMBOL[card.suit]}
      </span>
      <span className="sc-card-center">{SUIT_SYMBOL[card.suit]}</span>
      <span className="sc-card-corner sc-card-corner-bottom">
        {card.rank}
        <br />
        {SUIT_SYMBOL[card.suit]}
      </span>
    </button>
  );
}
