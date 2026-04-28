interface HintButtonProps {
  disabled?: boolean;
  onHoldStart: () => void;
  onHoldEnd: () => void;
  onClickPeek: () => void;
}

export default function HintButton({
  disabled,
  onHoldStart,
  onHoldEnd,
  onClickPeek,
}: HintButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onMouseDown={onHoldStart}
      onMouseUp={onHoldEnd}
      onMouseLeave={onHoldEnd}
      onTouchStart={onHoldStart}
      onTouchEnd={onHoldEnd}
      onClick={onClickPeek}
      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
    >
      Gợi ý
    </button>
  );
}
