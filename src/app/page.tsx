"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";
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
} from "lucide-react";

export default function HomePage() {
  const { user, profile } = useAuth();

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
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-primary">DocuTrack HEI</span>
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
              <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Sign In
              </Link>
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
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
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
      <section className="relative overflow-hidden bg-background border-b py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border bg-muted/60 px-4 py-1.5 text-sm font-medium text-foreground mb-6">
              Academic Document Tracking for Philippine HEIs
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
              Digitized Academic Request
              <br />
              <span className="text-primary">Routing & Verification</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Eliminate lost paperwork and unclear processing status.
              DocuTrack HEI provides real-time verification and role-based clearance routing for colleges and universities.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-in-from-bottom" style={{ animationDelay: "200ms" }}>
              <Button size="lg" asChild className="gap-2">
                <Link href="/track">
                  <Search className="h-5 w-5" />
                  Track Your Document
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href={user ? dashboardHref : "/login"}>
                  {user ? "Go to Dashboard" : "Access Dashboard"}
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
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
                <li><Link href={user ? dashboardHref : "/login"} className="hover:text-foreground transition-colors">{user ? "Dashboard" : "Sign In"}</Link></li>
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
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Data Protection</Link></li>
              </ul>
            </div>
          </div>
          <Separator />
          <p className="text-center text-sm text-muted-foreground mt-8">
            © {new Date().getFullYear()} DocuTrack HEI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}