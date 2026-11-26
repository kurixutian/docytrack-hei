"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "signin" | "reset" | "access";

const roleDashboards: Record<string, string> = {
  student: "/student/dashboard",
  department_chair: "/department/dashboard",
  college_dean: "/dean/dashboard",
  university_registrar: "/registrar/dashboard",
  system_admin: "/admin/dashboard",
};

export function AuthDialog({
  open,
  onOpenChange,
  callbackUrl,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  callbackUrl?: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError(null);
    setNotice(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);
    const supabase = createClient();

    try {
      if (mode === "reset") {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (resetError) throw resetError;
        setNotice("Reset link sent. Check your email.");
        return;
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;

      let role = data.user?.app_metadata?.role || (data.user?.user_metadata as { role?: string } | undefined)?.role;
      if (!role && data.user) {
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
        role = profile?.role;
      }
      const destination = callbackUrl && callbackUrl !== "/" ? callbackUrl : roleDashboards[role || ""] || "/student/dashboard";
      onOpenChange(false);
      router.push(destination);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Sign in failed. Check your details and try again.");
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { role: "Student", email: "student@demo.edu" },
    { role: "Dept Chair", email: "chair@demo.edu" },
    { role: "College Dean", email: "dean@demo.edu" },
    { role: "Registrar", email: "registrar@demo.edu" },
    { role: "Admin", email: "admin@demo.edu" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl tracking-tight">
            {mode === "signin" ? "Welcome back" : mode === "reset" ? "Reset your password" : "Request account access"}
          </DialogTitle>
          <DialogDescription>
            {mode === "signin" ? "Sign in to continue to your campus workspace." : mode === "reset" ? "We’ll email you a link to choose a new password." : "Accounts are provided by your institution. Contact your department or registrar to get access."}
          </DialogDescription>
        </DialogHeader>

        {mode === "access" ? (
          <div className="space-y-4 pt-2">
            <div className="rounded-md bg-muted/60 p-4 text-sm leading-6 text-muted-foreground">Ask your department office or the Office of the University Registrar to create an account for you.</div>
            <Button className="w-full" onClick={() => switchMode("signin")}>Back to sign in</Button>
          </div>
        ) : (
          <>
            {error && <div role="alert" className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
            {notice && <div role="status" className="rounded-md bg-success/10 p-3 text-sm text-success">{notice}</div>}
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="auth-email">Email</Label>
                <div className="relative"><Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="auth-email" type="email" autoComplete="email" placeholder="you@university.edu.ph" className="pl-10" value={email} onChange={(event) => setEmail(event.target.value)} required disabled={loading} /></div>
              </div>
              {mode === "signin" && <div className="space-y-2">
                <div className="flex items-center justify-between"><Label htmlFor="auth-password">Password</Label><button type="button" onClick={() => switchMode("reset")} className="text-sm text-primary hover:underline">Forgot password?</button></div>
                <div className="relative"><Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="auth-password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" className="pl-10 pr-10" value={password} onChange={(event) => setPassword(event.target.value)} required disabled={loading} /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>
              </div>}
              <Button type="submit" className="w-full" size="lg" disabled={loading}>{loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{mode === "reset" ? "Sending link…" : "Signing in…"}</> : mode === "reset" ? "Send reset link" : "Sign in"}</Button>
            </form>
            {mode === "signin" && <div className="space-y-3 pt-1"><div className="relative"><div className="absolute inset-0 flex items-center"><Separator /></div><div className="relative flex justify-center text-xs"><span className="bg-background px-2 text-muted-foreground">Demo access</span></div></div><div className="grid grid-cols-2 gap-2">{demoAccounts.map((account) => <button key={account.email} type="button" aria-label={`Autofill as ${account.role} (${account.email})`} onClick={() => { setEmail(account.email); setPassword("demo123456"); }} className="flex min-w-0 items-center justify-between gap-2 rounded-md border bg-muted/30 px-2.5 py-2 text-left text-xs hover:border-primary/50 hover:bg-primary/5"><span className="font-medium">{account.role}</span><span className="truncate text-muted-foreground">{account.email}</span></button>)}</div><p className="text-center text-xs text-muted-foreground">Demo password: demo123456</p></div>}
            <p className="text-center text-sm text-muted-foreground">{mode === "reset" ? <button type="button" className="font-medium text-primary hover:underline" onClick={() => switchMode("signin")}>Back to sign in</button> : <>Need an account? <button type="button" className="font-medium text-primary hover:underline" onClick={() => switchMode("access")}>Request access</button></>}</p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
