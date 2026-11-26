"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Toaster } from "sonner";
import { GraduationCap, Eye, EyeOff, Loader2, Mail, Lock, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const { user, profile } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  const roleDashboards: Record<string, string> = {
    student: "/student/dashboard",
    department_chair: "/department/dashboard",
    college_dean: "/dean/dashboard",
    university_registrar: "/registrar/dashboard",
    system_admin: "/admin/dashboard",
  };

  useEffect(() => {
    if (user && profile) {
      const dest = callbackUrl && callbackUrl !== "/" ? callbackUrl : (roleDashboards[profile.role] || "/student/dashboard");
      router.replace(dest);
    }
  }, [user, profile, callbackUrl, router]);

  const demoAccounts = [
    { role: "Student", email: "student@demo.edu" },
    { role: "Dept Chair", email: "chair@demo.edu" },
    { role: "College Dean", email: "dean@demo.edu" },
    { role: "Registrar", email: "registrar@demo.edu" },
    { role: "Admin", email: "admin@demo.edu" },
  ];

  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      let role = data.user?.app_metadata?.role || (data.user?.user_metadata as any)?.role;
      if (!role && data.user) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();
        role = prof?.role;
      }

      const defaultDashboard = (role && roleDashboards[role]) || "/student/dashboard";
      const destination = callbackUrl && callbackUrl !== "/" ? callbackUrl : defaultDashboard;

      router.push(destination);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError(null);
    setResetSuccess(false);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setResetSuccess(true);
    } catch (err: any) {
      setResetError(err.message || "Failed to send reset email. Please try again.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background flex items-center justify-center px-4 py-12">
      <Toaster position="top-right" />
      
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center gap-2">
            <GraduationCap className="h-12 w-12 text-primary" />
            <span className="text-2xl font-bold text-primary">DocuTrack HEI</span>
          </Link>
          <p className="text-muted-foreground mt-2">Academic Document Tracking System</p>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader className="text-center">
            {showForgotPassword ? (
              <>
                <CardTitle>Forgot Password?</CardTitle>
                <CardDescription>
                  Enter your email address and we'll send you a link to reset your password.
                </CardDescription>
              </>
            ) : (
              <>
                <CardTitle>Welcome Back</CardTitle>
                <CardDescription>Sign in to access your dashboard</CardDescription>
              </>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            {resetError && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                {resetError}
              </div>
            )}

            {resetSuccess && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-success/10 text-success text-sm">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                Password reset email sent! Check your inbox.
              </div>
            )}

            <form onSubmit={showForgotPassword ? handleForgotPassword : handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={showForgotPassword ? "reset-email" : "email"}>
                  {showForgotPassword ? "Email Address" : "Email"}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id={showForgotPassword ? "reset-email" : "email"}
                    type="email"
                    placeholder={showForgotPassword ? "you@university.edu.ph" : "Enter your email"}
                    value={showForgotPassword ? resetEmail : email}
                    onChange={(e) => showForgotPassword ? setResetEmail(e.target.value) : setEmail(e.target.value)}
                    className="pl-10"
                    required
                    disabled={loading || resetLoading}
                    autoComplete={showForgotPassword ? "email" : "email"}
                  />
                </div>
              </div>

              {!showForgotPassword && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      required
                      disabled={loading}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={loading || resetLoading}>
                {loading || resetLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {showForgotPassword ? "Sending..." : "Signing in..."}
                  </>
                ) : showForgotPassword ? (
                  "Send Reset Link"
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            {!showForgotPassword && (
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div>
            )}

            <div className="text-center text-sm">
              {showForgotPassword ? (
                <>
                  <Link href="/login" className="text-primary hover:underline" onClick={(e) => { e.preventDefault(); setShowForgotPassword(false); }}>
                    Back to Sign In
                  </Link>
                </>
              ) : (
                <>
                  <p className="text-muted-foreground">
                    Don't have an account?{" "}
                    <Link href="/register" className="text-primary hover:underline font-medium">
                      Contact your administrator
                    </Link>
                  </p>

                  <div className="mt-4 pt-3 border-t text-left">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-foreground">
                        Demo Accounts (Tap to autofill):
                      </span>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        pass: demo123456
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {demoAccounts.map((acc) => (
                        <button
                          key={acc.email}
                          type="button"
                          onClick={() => {
                            setEmail(acc.email);
                            setPassword("demo123456");
                          }}
                          className="flex items-center justify-between px-2.5 py-1.5 rounded-md border bg-muted/40 hover:bg-primary/10 hover:border-primary transition-all text-xs text-left"
                        >
                          <span className="font-medium text-foreground">{acc.role}</span>
                          <span className="text-[11px] text-muted-foreground">{acc.email}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-xs text-muted-foreground">
              By signing in, you agree to our{" "}
              <Link href="#" className="text-primary hover:underline">Terms of Service</Link>
              {" "}and{" "}
              <Link href="#" className="text-primary hover:underline">Privacy Policy</Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}