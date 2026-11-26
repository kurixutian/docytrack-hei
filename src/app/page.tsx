"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";
import { AuthDialog } from "@/components/AuthDialog";
import {
  Search,
  Shield,
  Clock,
  Users,
  FileText,
  ArrowRight,
  GraduationCap,
  Building2,
  CheckCircle,
  ChevronRight,
  ArrowUpRight,
  CircleDot,
  Landmark,
} from "lucide-react";

export default function HomePage() {
  const { user, profile } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || undefined;

  useEffect(() => {
    if (!user && searchParams.get("auth") === "signin") setAuthOpen(true);
  }, [user, searchParams]);

  const roleDashboardMap: Record<string, string> = {
    student: "/student/dashboard",
    department_chair: "/department/dashboard",
    college_dean: "/dean/dashboard",
    university_registrar: "/registrar/dashboard",
    system_admin: "/admin/dashboard",
  };
  const dashboardHref = (profile?.role && roleDashboardMap[profile.role]) || "/student/dashboard";

  const documentTypes = [
    { name: "Adding of Subjects", icon: FileText, description: "Request to add subjects after enrollment period" },
    { name: "Dropping of Subjects", icon: FileText, description: "Request to drop enrolled subjects within allowed period" },
    { name: "Shifting Application", icon: GraduationCap, description: "Application to shift to a different program/course" },
    { name: "Completion of INC Grades", icon: CheckCircle, description: "Request for completion of incomplete grades" },
    { name: "Removal of INC Grades", icon: CheckCircle, description: "Request for removal of incomplete grades through examination" },
    { name: "Graduation Clearance", icon: Building2, description: "Clearance processing for graduating students" },
    { name: "Overload Permit", icon: FileText, description: "Permit to enroll in more than maximum allowed units" },
  ];

  const features = [
    { icon: Shield, title: "Secure & Private", description: "Role-based access control with row-level security protects sensitive student data." },
    { icon: Clock, title: "Real-time Tracking", description: "Track document progress in real-time with detailed workflow history and timestamps." },
    { icon: Users, title: "Multi-role Workflow", description: "Department Chair → College Dean → Registrar routing with configurable workflows." },
    { icon: FileText, title: "Audit Trail", description: "Complete immutable audit logs for accountability and compliance." },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border/80 bg-background/90 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground"><Landmark className="h-5 w-5" /></span>
            <span className="text-lg font-semibold tracking-tight text-foreground">DocuTrack <span className="font-normal text-muted-foreground">HEI</span></span>
          </div>
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              How It Works
            </Link>
            <Link href="#document-types" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Document Types
            </Link>
            {user ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={dashboardHref}>
                  Dashboard
                </Link>
              </Button>
            ) : (
              <button type="button" onClick={() => setAuthOpen(true)} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                Sign in
              </button>
            )}
            <Button asChild>
              <Link href="/track" className="inline-flex items-center gap-2">
                <Search className="h-4 w-4" />
                Track Document
              </Link>
            </Button>
          </div>

          {/* Mobile Navigation Buttons */}
          <div className="flex md:hidden items-center gap-2">
            {user ? (
              <Button size="sm" asChild>
                <Link href={dashboardHref}>Dashboard</Link>
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setAuthOpen(true)}>Sign in</Button>
            )}
            <Button size="sm" variant={user ? "outline" : "default"} asChild>
              <Link href="/track" className="inline-flex items-center gap-1.5">
                <Search className="h-3.5 w-3.5" />
                Track
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border bg-[#e9eee7]">
        <div className="container relative mx-auto grid min-h-[610px] items-center gap-12 px-4 py-16 lg:grid-cols-[1.08fr_.92fr] lg:py-24">
          <div className="max-w-2xl">
            <div className="mb-7 flex items-center gap-2 text-sm font-medium text-primary"><span className="h-px w-8 bg-primary" />A clearer route through campus</div>
            <h1 className="mb-6 max-w-xl font-serif text-5xl leading-[1.08] tracking-[-.04em] text-[#183b35] sm:text-6xl lg:text-[4.4rem]">Every request has a next step.</h1>
            <p className="mb-9 max-w-lg text-lg leading-8 text-[#53615a]">Follow academic documents from your desk to the right campus office. See where a request is, who has it, and what happens next.</p>
            <div className="flex flex-wrap items-center gap-4">
              <Button size="lg" asChild className="h-12 rounded-md px-6 shadow-none"><Link href="/track">Track a request <ArrowUpRight className="ml-2 h-4 w-4" /></Link></Button>
              {user ? <Link href={dashboardHref} className="inline-flex h-12 items-center gap-2 px-3 text-sm font-medium text-[#294a42] hover:underline">Open dashboard<ChevronRight className="h-4 w-4" /></Link> : <button type="button" onClick={() => setAuthOpen(true)} className="inline-flex h-12 items-center gap-2 px-3 text-sm font-medium text-[#294a42] hover:underline">Staff sign in<ChevronRight className="h-4 w-4" /></button>}
            </div>
            <div className="mt-12 flex items-center gap-3 border-t border-[#cbd5cc] pt-5 text-sm text-[#53615a]"><Shield className="h-4 w-4 text-primary" />Private by design. Public tracking shows progress only.</div>
          </div>
          <div className="relative mx-auto w-full max-w-[520px] lg:ml-auto">
            <div className="absolute -right-8 -top-8 h-44 w-44 rounded-full border border-[#9caf9f]/50" />
            <div className="relative rounded-lg border border-[#c9d3ca] bg-white p-6 shadow-[0_24px_60px_-34px_rgba(29,57,47,.34)] sm:p-8">
              <div className="mb-7 flex items-start justify-between gap-4"><div><p className="text-sm font-medium text-muted-foreground">Request lookup</p><h2 className="mt-1 text-2xl font-semibold tracking-tight">Where is it now?</h2></div><span className="grid h-11 w-11 place-items-center rounded-md bg-[#e9f1ec] text-primary"><Search className="h-5 w-5" /></span></div>
              <form action="/track" method="GET" className="space-y-3">
                <label htmlFor="hero-tracking" className="text-sm font-medium">Tracking number</label>
                <input id="hero-tracking" name="tracking" required placeholder="DT-2026-ABC12345" className="h-12 w-full rounded-md border border-input bg-white px-4 font-mono text-sm outline-none placeholder:font-sans placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-primary/30" />
                <Button type="submit" className="h-12 w-full rounded-md">Find my request <ArrowUpRight className="ml-2 h-4 w-4" /></Button>
              </form>
              <div className="mt-8 border-t border-border pt-6">
                <p className="mb-4 text-xs font-semibold text-muted-foreground">A request moves through</p>
                <div className="flex items-center justify-between gap-1 text-center text-xs font-medium text-[#455851]">
                  {["Department", "Dean", "Registrar"].map((office, index) => <div key={office} className="flex flex-1 items-center gap-1"><div className="flex flex-col items-center gap-2"><span className={`grid h-8 w-8 place-items-center rounded-full ${index === 0 ? "bg-primary text-white" : "bg-[#edf1ed] text-primary"}`}>{index === 0 ? <CircleDot className="h-4 w-4" /> : index + 1}</span><span>{office}</span></div>{index < 2 && <span className="mb-5 h-px flex-1 bg-[#cdd7ce]" />}</div>)}
                </div>
              </div>
            </div>
            <div className="absolute -bottom-5 -left-6 hidden items-center gap-3 rounded-md border border-[#d4ddd5] bg-white px-4 py-3 shadow-sm sm:flex"><span className="h-2.5 w-2.5 rounded-full bg-[#b97828]" /><span className="text-sm font-medium">Status updates as offices act</span></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Why Choose DocuTrack HEI?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built specifically for Philippine higher education institutions with institutional workflows in mind.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={feature.title} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <feature.icon className="h-10 w-10 text-primary mb-4" />
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 lg:py-28 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">How Document Tracking Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A simple, transparent process from submission to completion.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Submit Request",
                description: "Student submits academic request online with required details and attachments.",
                icon: FileText,
              },
              {
                title: "Department Review",
                description: "Department Chairperson receives, reviews, and endorses or returns the request.",
                icon: Users,
              },
              {
                title: "Dean Approval",
                description: "College Dean reviews endorsed documents and approves or requests changes.",
                icon: GraduationCap,
              },
              {
                title: "Registrar Action",
                description: "University Registrar performs final review, approval, and release.",
                icon: Building2,
              },
              {
                title: "Track Progress",
                description: "Real-time tracking with unique tracking number - no login required for students.",
                icon: Search,
              },
              {
                title: "Complete & Archive",
                description: "Document released to student and archived with full audit trail.",
                icon: CheckCircle,
              },
            ].map((item) => (
              <Card key={item.title} className="hover:border-foreground/30 transition-colors">
                <CardHeader>
                  <item.icon className="h-8 w-8 text-primary mb-3" />
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{item.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Document Types Section */}
      <section id="document-types" className="py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Supported Academic Requests</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              All common academic document types are supported and configurable by administrators.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documentTypes.map((docType) => (
              <Card key={docType.name} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <docType.icon className="h-8 w-8 text-primary" />
                    <CardTitle className="text-lg">{docType.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{docType.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Public Tracking Search */}
      <section className="py-20 lg:py-28 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Track Your Document</h2>
            <p className="text-primary-foreground/80 mb-8">
              Enter your tracking number to check the status of your academic request.
              No login required.
            </p>
            <form action="/track" method="GET" className="flex flex-col sm:flex-row gap-4">
              <Input
                name="tracking"
                placeholder="DT-2026-XXXXXXXX"
                className="flex-1 bg-background/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 focus:border-primary-foreground focus:ring-primary"
                required
              />
              <Button type="submit" size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                <Search className="h-5 w-5 mr-2" />
                Track
              </Button>
            </form>
            <p className="text-sm text-primary-foreground/60 mt-4">
              Tracking format: <code className="px-1.5 py-0.5 rounded bg-primary-foreground/10">DT-2026-ABC12345</code>
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <GraduationCap className="h-8 w-8 text-primary" />
                <span className="text-xl font-bold text-primary">DocuTrack HEI</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Academic Document Tracking & Routing System for Philippine Higher Education Institutions.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/track" className="hover:text-foreground transition-colors">Track Document</Link></li>
                <li>{user ? <Link href={dashboardHref} className="hover:text-foreground transition-colors">Dashboard</Link> : <button type="button" onClick={() => setAuthOpen(true)} className="hover:text-foreground transition-colors">Sign in</button>}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Office of the University Registrar</li>
                <li>Email: registrar@university.edu.ph</li>
                <li>Phone: +63 (XX) XXX-XXXX</li>
              </ul>
            </div>

          </div>
          <Separator />
          <p className="text-center text-sm text-muted-foreground mt-8">
            © {new Date().getFullYear()} DocuTrack HEI. All rights reserved.
          </p>
        </div>
      </footer>
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} callbackUrl={callbackUrl} />
    </div>
  );
}
