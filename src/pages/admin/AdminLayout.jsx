import { useState } from "react";
import { Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Users, Trophy, Heart, CheckSquare, BarChart3, Menu, X, Home, LogOut, Settings, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const navItems = [
  { label: "Analytics", icon: BarChart3, href: "/admin" },
  { label: "Users", icon: Users, href: "/admin/users" },
  { label: "Draws", icon: Trophy, href: "/admin/draws" },
  { label: "Charities", icon: Heart, href: "/admin/charities" },
  { label: "Winners", icon: CheckSquare, href: "/admin/winners" },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isLoadingAuth } = useAuth();

  const currentNavItem = navItems.find(item => item.href === location.pathname) || { label: "Dashboard" };

  if (isLoadingAuth) return (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#fdfdfc]">
      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#0a1e16] text-white flex flex-col transition-all duration-300 ease-in-out shadow-2xl lg:shadow-none",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <span className="font-serif font-bold text-xl tracking-tight text-white">Give Golf</span>
          </Link>
          <button className="lg:hidden text-white/70 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-2 mt-4">
          {navItems.map(item => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group border border-transparent",
                  isActive
                    ? "bg-primary text-white shadow-lg shadow-primary/20 border-white/10"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                )}>
                <item.icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", isActive ? "text-white" : "text-white/40 group-hover:text-primary")} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10 mt-auto">
          <Link to="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/5 transition-all group">
            <Home className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Back to Site
          </Link>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity" onClick={() => setSidebarOpen(false)} />}

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b sticky top-0 z-30 flex items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden sm:block">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to="/admin">Admin</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="font-semibold text-primary">{currentNavItem.label}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <div className="text-sm font-semibold leading-none">{user?.full_name || "Admin"}</div>
              <div className="text-xs text-muted-foreground mt-1">{user?.email}</div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 overflow-hidden ring-offset-background transition-all hover:ring-2 hover:ring-primary hover:ring-offset-2">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user?.avatar_url} alt={user?.full_name} />
                    <AvatarFallback className="bg-primary/5 text-primary font-bold">
                      {(user?.full_name || user?.email || "A").slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.full_name || "Admin"}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/admin/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={() => logout()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 sm:p-8 max-w-[1600px] mx-auto w-full">
          <Outlet context={{ user }} />
        </main>
      </div>
    </div>
  );
}

