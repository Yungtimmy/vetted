import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg py-16">
      <h1>Page not found</h1>
      <p className="mt-2 text-sm text-muted">That page is not part of Vetted.</p>
      <Link href="/" className="btn mt-6">
        Back to the leaderboard
      </Link>
    </div>
  );
}
