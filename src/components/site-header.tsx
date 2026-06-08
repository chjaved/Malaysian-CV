import { useState, useCallback } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, X, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const toggleMenu = useCallback(() => setMenuOpen((prev) => !prev), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const handleLogout = async () => {
    closeMenu();
    await signOut();
    toast.success("Logged out");
    void navigate({ to: "/" });
  };

  const navLinks = [
    { label: "Home", to: "/", isHash: false },
    { label: "LinkedIn Review", to: "/linkedin-review", isHash: false },
    { label: "How It Works", to: "/#how-it-works", isHash: true },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl font-extrabold tracking-tight text-primary">
            ResuMY
          </span>
          <span className="text-xl" aria-hidden>🇲🇾</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <Link to="/linkedin-review" className="hover:text-primary transition-colors">LinkedIn Review</Link>
          <a href="/#how-it-works" className="hover:text-primary transition-colors">How It Works</a>
          {user && (
            <Link to="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
          )}
        </nav>

        {/* Desktop CTA + Auth */}
        <div className="hidden items-center gap-3 sm:flex">
          {user ? (
            <>
              <span className="max-w-[180px] truncate text-sm text-muted-foreground" title={user.email ?? ""}>
                {user.email}
              </span>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                <LogOut className="size-4" /> Log Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                Log In
              </Link>
              <Link
                to="/signup"
                className="inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
              >
                Sign Up
              </Link>
            </>
          )}
          <Link
            to="/analyze"
            className="inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            Analyze CV
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={toggleMenu}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground sm:hidden"
        >
          {menuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {/* Mobile dropdown */}
      <div
        className={`
          sm:hidden overflow-hidden bg-background border-b border-border/60 transition-all duration-300 ease-in-out
          ${menuOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}
        `}
      >
        <div className="mx-auto max-w-6xl px-4 py-4 flex flex-col gap-4">
          {navLinks.map((link) =>
            link.isHash ? (
              <a
                key={link.label}
                href={link.to}
                onClick={closeMenu}
                className="block rounded-lg px-3 py-2.5 text-base font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.label}
                to={link.to}
                onClick={closeMenu}
                className="block rounded-lg px-3 py-2.5 text-base font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                {link.label}
              </Link>
            )
          )}
          {user ? (
            <>
              <Link
                to="/dashboard"
                onClick={closeMenu}
                className="block rounded-lg px-3 py-2.5 text-base font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Dashboard
              </Link>
              <div className="px-3 py-2 text-sm text-muted-foreground truncate" title={user.email ?? ""}>
                {user.email}
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-base font-medium text-foreground hover:bg-accent transition-colors"
              >
                <LogOut className="size-4" /> Log Out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                onClick={closeMenu}
                className="block rounded-lg px-3 py-2.5 text-base font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Log In
              </Link>
              <Link
                to="/signup"
                onClick={closeMenu}
                className="block w-full rounded-lg bg-primary px-4 py-3 text-center text-base font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
              >
                Sign Up
              </Link>
            </>
          )}
          <Link
            to="/analyze"
            onClick={closeMenu}
            className="block w-full rounded-lg bg-primary px-4 py-3 text-center text-base font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            Analyze CV
          </Link>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-secondary/30">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6">
        <p>© 2026 ResuMY. Built for Malaysia.</p>
        <div className="flex items-center gap-4">
          <Link to="/employer/login" className="text-xs text-muted-foreground/80 hover:text-primary transition-colors">
            For Employers
          </Link>
          <p>Made with love in Malaysia 🇲🇾</p>
        </div>
      </div>
    </footer>
  );
}
