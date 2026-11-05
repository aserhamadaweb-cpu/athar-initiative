export function NoticeIcon({ kind }: { kind: "warning" | "promotion" }) {
  if (kind === "warning") {
    return (
      <svg className="org-notice-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 3.1 1.7 21h20.6L12 3.1Zm0 6.1a1 1 0 0 1 1 1v4.4a1 1 0 1 1-2 0v-4.4a1 1 0 0 1 1-1Zm0 9.3a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4Z"
        />
      </svg>
    );
  }

  return (
    <svg className="org-notice-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="m12 2.2 2.8 5.7 6.3.9-4.6 4.4 1.1 6.3L12 16.6 6.4 19.5l1.1-6.3L2.9 8.8l6.3-.9L12 2.2Z"
      />
    </svg>
  );
}
