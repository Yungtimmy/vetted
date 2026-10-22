import Link from "next/link";

export function LoadNote({
  message,
  action,
  actionHref,
}: {
  message: string;
  action: string;
  actionHref: string;
}) {
  return (
    <p className="text-sm text-muted">
      {message}{" "}
      <Link href={actionHref} className="link">
        {action}
      </Link>
    </p>
  );
}

/** Stand-in for a figure the live provider does not read yet. */
export function NotTracked() {
  return (
    <span title="Not tracked yet">
      <span aria-hidden="true">—</span>{" "}
      <span className="font-sans text-xs font-normal text-muted">
        Not tracked yet
      </span>
    </span>
  );
}
