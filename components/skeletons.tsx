function Bar({ className }: { className: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function LeaderboardSkeleton() {
  return (
    <div aria-busy="true">
      <p className="sr-only">Loading scores</p>
      <div className="mb-6">
        <h1>Leaderboard</h1>
        <p className="mt-2 max-w-[44rem] text-sm leading-5 text-muted">
          On-chain grades for Portaldot validators. Stake with a published score, not a feeling.
        </p>
      </div>
      <div className="mb-5 flex gap-1 border-b border-line">
        <Bar className="mb-[-1px] h-9 w-28" />
        <Bar className="mb-[-1px] h-9 w-32" />
        <Bar className="mb-[-1px] h-9 w-32" />
      </div>
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div className="min-h-[84px] rounded-[12px] border border-line bg-panel px-[18px] py-4" key={index}>
            <Bar className="h-3 w-24" />
            <Bar className="mt-3 h-7 w-12" />
            <Bar className="mt-3 h-3 w-32" />
          </div>
        ))}
      </div>
      <div className="overflow-hidden rounded-[12px] border border-line bg-panel">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="flex h-16 items-center gap-4 border-b border-line px-4 last:border-b-0" key={index}>
            <div className="min-w-0 flex-1 space-y-2">
              <Bar className="h-3 w-40 max-w-full" />
              <Bar className="h-3 w-28" />
            </div>
            <Bar className="h-7 w-7 rounded-[6px]" />
            <Bar className="hidden h-3 w-16 lg:block" />
            <Bar className="hidden h-1 w-32 lg:block" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ReportSkeleton() {
  return (
    <div aria-busy="true">
      <p className="sr-only">Loading report</p>
      <Bar className="h-3 w-28" />
      <Bar className="mt-3 h-8 w-64 max-w-full" />
      <div className="mt-5 grid gap-3 lg:grid-cols-[200px_minmax(0,1fr)_minmax(0,1fr)]">
        <section className="card flex flex-col items-start gap-3">
          <Bar className="h-14 w-14 rounded-[10px]" />
          <Bar className="h-5 w-16" />
          <Bar className="h-4 w-full" />
        </section>
        <section className="card space-y-3">
          {Array.from({ length: 4 }, (_, index) => (
            <Bar className="h-4 w-full" key={index} />
          ))}
        </section>
        <section className="card space-y-3">
          {Array.from({ length: 4 }, (_, index) => (
            <div className="flex gap-3" key={index}>
              <Bar className="h-4 w-16" />
              <Bar className="h-4 flex-1" />
            </div>
          ))}
        </section>
      </div>
      <section className="card mt-4">
        <Bar className="h-4 w-36" />
        <Bar className="mt-4 h-[150px] w-full" />
      </section>
    </div>
  );
}

export function NominateSkeleton() {
  return (
    <div aria-busy="true">
      <p className="sr-only">Loading nomination set</p>
      <div className="mb-4 flex gap-2">
        <Bar className="h-7 w-24 rounded-full" />
        <Bar className="h-7 w-24 rounded-full" />
        <Bar className="h-7 w-20 rounded-full" />
      </div>
      <div className="mb-5">
        <Bar className="h-8 w-72 max-w-full" />
        <Bar className="mt-2 h-4 w-96 max-w-full" />
      </div>
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <div className="card space-y-3" key={index}>
              <Bar className="h-8 w-8 rounded-[7px]" />
              <Bar className="h-4 w-32" />
              <Bar className="h-3 w-24" />
              <Bar className="h-1 w-full" />
            </div>
          ))}
        </div>
        <div className="card space-y-3">
          <Bar className="h-3 w-20" />
          <Bar className="h-8 w-16" />
          <Bar className="h-2 w-full" />
          <Bar className="h-16 w-full" />
          <Bar className="h-10 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
