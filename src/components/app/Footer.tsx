export default function Footer() {
  return (
    <footer className="bg-card shadow-md mt-auto">
      <div className="container mx-auto px-4 py-6 text-center text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} NEXUS Coding Club. All rights reserved.</p>
        <p className="text-sm">Empowering Secure and Transparent Elections.</p>
      </div>
    </footer>
  );
}
