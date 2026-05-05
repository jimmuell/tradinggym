interface Props {
  wins: number;
  losses: number;
  breakevens: number;
}

export function WinLossStats({ wins, losses, breakevens }: Props) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      <div className="rounded-md border p-3 sm:p-4 text-center min-w-0">
        <div className="text-[10px] sm:text-xs text-muted-foreground mb-1 truncate">Wins</div>
        <div className="text-lg sm:text-xl lg:text-2xl font-bold text-success tabular-nums truncate">{wins}</div>
      </div>
      <div className="rounded-md border p-3 sm:p-4 text-center min-w-0">
        <div className="text-[10px] sm:text-xs text-muted-foreground mb-1 truncate">Losses</div>
        <div className="text-lg sm:text-xl lg:text-2xl font-bold text-destructive tabular-nums truncate">{losses}</div>
      </div>
      <div className="rounded-md border p-3 sm:p-4 text-center min-w-0">
        <div className="text-[10px] sm:text-xs text-muted-foreground mb-1 truncate">Breakevens</div>
        <div className="text-lg sm:text-xl lg:text-2xl font-bold text-muted-foreground tabular-nums truncate">{breakevens}</div>
      </div>
    </div>
  );
}
