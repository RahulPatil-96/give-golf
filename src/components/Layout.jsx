import { Outlet, Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { base44 } from "@/api/supabaseClient";
import { Menu, X, Heart, Trophy, LayoutDashboard, Users, LogOut, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

import { useAuth } from "@/lib/AuthContext";

export default function Layout() {
  const { user, isAdmin, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const isHome = location.pathname === "/";

  const navLinks = [
    { label: "How It Works", href: "/#how-it-works" },
    { label: "Charities", href: "/charities" },
    { label: "Results", href: "/draw-results" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                <Heart className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-serif text-xl font-bold tracking-tight">GiveGolf</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map(link => (
                <Link key={link.href} to={link.href} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <>
                  <Link to="/dashboard">
                    <Button variant="ghost" size="sm" className="gap-2">
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Button>
                  </Link>
                  {isAdmin && (
                    <Link to="/admin">
                      <Button variant="ghost" size="sm" className="gap-2">
                        <Users className="w-4 h-4" />
                        Admin
                      </Button>
                    </Link>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => logout()}>
                    <LogOut className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="ghost" size="sm">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/subscribe">
                    <Button size="sm" className="bg-primary hover:bg-primary/90 rounded-full px-6">
                      Subscribe
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-background pt-20"
          >
            <div className="flex flex-col items-center gap-6 p-8">
              {navLinks.map(link => (
                <Link key={link.href} to={link.href} className="text-lg font-medium">
                  {link.label}
                </Link>
              ))}
              {user ? (
                <>
                  <Link to="/dashboard" className="text-lg font-medium">Dashboard</Link>
                  {isAdmin && <Link to="/admin" className="text-lg font-medium">Admin</Link>}
                  <Button variant="outline" onClick={() => logout()}>Sign Out</Button>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="outline">Sign In</Button>
                  </Link>
                  <Link to="/subscribe">
                    <Button className="bg-primary rounded-full px-8">Subscribe Now</Button>
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-foreground text-background py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                  <Heart className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-serif text-xl font-bold">GiveGolf</span>
              </div>
              <p className="text-background/60 max-w-sm text-sm leading-relaxed">
                Play golf, win prizes, change lives. Every subscription fuels a monthly draw and supports the charities you love.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <div className="flex flex-col gap-2">
                <Link to="/charities" className="text-sm text-background/60 hover:text-background transition-colors">Charities</Link>
                <Link to="/draw-results" className="text-sm text-background/60 hover:text-background transition-colors">Draw Results</Link>
                <Link to="/subscribe" className="text-sm text-background/60 hover:text-background transition-colors">Subscribe</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Account</h4>
              <div className="flex flex-col gap-2">
                <Link to="/dashboard" className="text-sm text-background/60 hover:text-background transition-colors">Dashboard</Link>
                <Link to="/dashboard/scores" className="text-sm text-background/60 hover:text-background transition-colors">My Scores</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-background/10 mt-12 pt-8 text-center text-sm text-background/40">
            © {new Date().getFullYear()} GiveGolf. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}