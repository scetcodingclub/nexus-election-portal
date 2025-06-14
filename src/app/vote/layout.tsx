// This layout can be used for vote-flow-specific global elements.
// For now, it will just pass children through.

export default function VoteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
