// This layout can be used for admin-specific global elements,
// like a sub-navigation bar or authentication checks in the future.
// For now, it will just pass children through.

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
