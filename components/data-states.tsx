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
