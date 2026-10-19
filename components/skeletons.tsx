function Bar({ className }: { className: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function LeaderboardSkeleton() {
  return (
    <div aria-busy="true">
      <p className="sr-only">Loading scores</p>
      <div className="mb-5">
        <h1>Validator report cards</h1>
        <p className="text-sm text-muted">
          Know who you&apos;re staking with. Scores published on-chain every
          era.
        </p>
      </div>
      <div className="mb-[18px] grid grid-cols-2 gap-3 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="card" key={index}>
            <Bar className="h-3 w-24" />
            <Bar className="mt-3 h-7 w-16" />
          </div>
        ))}
      </div>
      <div className="card space-y-4">
        {Array.from({ length: 6 }, (_, index) => (
          <div className="flex items-center gap-4" key={index}>
            <Bar className="h-8 w-8 rounded-[7px]" />
            <div className="min-w-0 flex-1 space-y-2">
              <Bar className="h-3 w-40 max-w-full" />
              <Bar className="h-3 w-24" />
            </div>
            <Bar className="hidden h-5 w-24 xl:block" />
            <Bar className="h-4 w-14" />
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
      <div className="mt-5 grid gap-4 xl:grid-cols-[240px_minmax(0,1fr)_280px]">
        <section className="card flex flex-col items-center gap-3">
          <Bar className="h-[120px] w-[120px] rounded-full" />
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
