interface Props {
  wins: number;
  losses: number;
  breakevens: number;
}

export function WinLossStats({ wins, losses, breakevens }: Props) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="rounded-md border p-4 text-center">
        <div className="text-xs text-muted-foreground mb-1">Wins</div>
        <div className="text-2xl font-bold text-success">{wins}</div>
      </div>
      <div className="rounded-md border p-4 text-center">
        <div className="text-xs text-muted-foreground mb-1">Losses</div>
        <div className="text-2xl font-bold text-destructive">{losses}</div>
      </div>
      <div className="rounded-md border p-4 text-center">
        <div className="text-xs text-muted-foreground mb-1">Breakevens</div>
        <div className="text-2xl font-bold text-muted-foreground">{breakevens}</div>
      </div>
    </div>
  );
}
