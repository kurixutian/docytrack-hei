"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  FileText,
  Inbox,
  Users,
  Settings,
  BarChart3,
  FileCheck,
  Archive,
  LogOut,
  User,
  Bell,
  ChevronLeft,
  ChevronRight,
  Menu,
  GraduationCap,
  Building2,
  Shield,
  Search,
} from "lucide-react";

const navigation = {
  student: [
    { href: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/student/requests", label: "My Requests", icon: FileText },
    { href: "/student/requests/new", label: "New Request", icon: FileCheck },
    { href: "/notifications", label: "Notifications", icon: Bell },
    { href: "/profile", label: "Profile", icon: User },
  ],
  department_chair: [
    { href: "/department/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/department/inbox", label: "Inbox", icon: Inbox },
    { href: "/department/documents", label: "All Documents", icon: FileText },
    { href: "/notifications", label: "Notifications", icon: Bell },
    { href: "/profile", label: "Profile", icon: User },
  ],
  college_dean: [
    { href: "/dean/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dean/inbox", label: "Inbox", icon: Inbox },
    { href: "/dean/documents", label: "All Documents", icon: FileText },
    { href: "/notifications", label: "Notifications", icon: Bell },
    { href: "/profile", label: "Profile", icon: User },
  ],
  university_registrar: [
    { href: "/registrar/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/registrar/inbox", label: "Inbox", icon: Inbox },
    { href: "/registrar/documents", label: "All Documents", icon: FileText },
    { href: "/registrar/archive", label: "Archive", icon: Archive },
    { href: "/notifications", label: "Notifications", icon: Bell },
    { href: "/profile", label: "Profile", icon: User },
  ],
  system_admin: [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/users", label: "User Management", icon: Users },
    { href: "/admin/departments", label: "Departments", icon: Building2 },
    { href: "/admin/document-types", label: "Document Types", icon: FileText },
    { href: "/admin/workflows", label: "Workflows", icon: Settings },
    { href: "/admin/audit-logs", label: "Audit Logs", icon: Search },
    { href: "/admin/settings", label: "Settings", icon: Settings },
    { href: "/profile", label: "Profile", icon: User },
  ],
};

const roleLabels: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  student: { label: "Student", icon: GraduationCap },
  department_chair: { label: "Department Chairperson", icon: Building2 },
  college_dean: { label: "College Dean", icon: GraduationCap },
  university_registrar: { label: "University Registrar", icon: Shield },
  system_admin: { label: "System Administrator", icon: Settings },
};

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile, signOut, loading } = useAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const navItems = profile ? navigation[profile.role as keyof typeof navigation] || [] : [];
  const roleInfo = profile ? roleLabels[profile.role] : { label: "User", icon: User };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sidebar-collapsed");
      if (saved !== null) setCollapsed(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", JSON.stringify(collapsed));
  }, [collapsed]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!profile) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Redirecting...</div>;
  }

  const RoleIcon = roleInfo.icon;

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 lg:hidden transition-opacity",
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 bg-card border-r transition-all duration-300",
          collapsed ? "w-16" : "w-64",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className={cn("flex h-16 items-center justify-between border-b px-4", collapsed && "justify-center")}>
            <Link href="/" className="flex items-center gap-2" style={{ display: collapsed ? "none" : "flex" }}>
              <GraduationCap className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-primary">DocuTrack HEI</span>
            </Link>
            <Link href="/" className="flex items-center justify-center" style={{ display: collapsed ? "flex" : "none" }}>
              <GraduationCap className="h-8 w-8 text-primary" />
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (typeof window !== "undefined" && window.innerWidth < 1024) {
                  setSidebarOpen(false);
                } else {
                  setCollapsed(!collapsed);
                }
              }}
              className="flex items-center justify-center"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 py-4">
            <nav className="px-2 space-y-1" aria-label="Main navigation">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                      collapsed && "justify-center"
                    )}
                    title={collapsed ? item.label : undefined}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>

          {/* User Info & Footer */}
          <div className="border-t p-4">
            <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                  {profile.full_name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{profile.full_name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{roleInfo.label}</p>
                </div>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn("w-full justify-start mt-2", collapsed && "justify-center")}
                  title={collapsed ? "User menu" : undefined}
                >
                  <LogOut className="h-4 w-4 mr-2" aria-hidden="true" />
                  {!collapsed && <span>Sign Out</span>}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{profile.full_name}</p>
                    <p className="text-xs text-muted-foreground">{profile.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" onClick={() => setSidebarOpen(false)}>
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/notifications" onClick={() => setSidebarOpen(false)}>
                    <Bell className="h-4 w-4 mr-2" />
                    Notifications
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    await signOut();
                    setSidebarOpen(false);
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={cn("lg:pl-64 transition-all duration-300", collapsed && "lg:pl-16")}>
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-16 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="flex h-full items-center justify-between px-4 lg:px-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-lg font-semibold hidden sm:block">
                {navItems.find((item) => pathname === item.href || pathname.startsWith(item.href + "/"))?.label || "Dashboard"}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/notifications">
                  <Bell className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}