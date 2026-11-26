"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Building2,
  User,
  Mail,
  Calendar,
  MapPin,
  ArrowRight,
  ChevronRight,
  AlertTriangle,
  Copy,
  Check,
} from "lucide-react";
import { formatDate, formatDateTime, formatRelativeTime, getStatusLabel, getStatusColor, cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { AuthDialog } from "@/components/AuthDialog";

interface DocumentLog {
  id: string;
  action_taken: string;
  previous_status: string | null;
  new_status: string | null;
  origin_department_id: string | null;
  destination_department_id: string | null;
  handled_by: string | null;
  internal_remarks: string | null;
  public_remarks: string | null;
  created_at: string;
}

interface Document {
  id: string;
  tracking_no: string;
  document_type_id: string;
  current_status: string;
  current_department_id: string | null;
  workflow_template_id: string;
  current_step_id: string | null;
  submitted_at: string;
  updated_at: string;
  completed_at: string | null;
}

interface WorkflowStep {
  id: string;
  step_order: number;
  step_name: string;
}

async function fetchDocumentByTracking(trackingNo: string) {
  const supabase = createClient({ "x-tracking-no": trackingNo });
  const { data, error } = await supabase
    .from("documents")
    .select("id, tracking_no, document_type_id, current_status, current_department_id, workflow_template_id, current_step_id, submitted_at, updated_at, completed_at")
    .eq("tracking_no", trackingNo)
    .single();
  if (error) throw error;
  return data as Document;
}

async function fetchDocumentLogs(documentId: string, trackingNo: string) {
  const supabase = createClient({ "x-tracking-no": trackingNo });
  const { data, error } = await supabase
    .from("document_logs")
    .select("id, action_taken, previous_status, new_status, origin_department_id, destination_department_id, handled_by, public_remarks, created_at")
    .eq("document_id", documentId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data as DocumentLog[];
}

async function fetchWorkflowSteps(workflowId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("workflow_steps")
    .select("id, step_order, step_name")
    .eq("workflow_id", workflowId)
    .order("step_order", { ascending: true });
  if (error) throw error;
  return data as WorkflowStep[];
}

async function fetchDocumentType(documentTypeId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("document_types")
    .select("type_name, description")
    .eq("id", documentTypeId)
    .single();
  if (error) throw error;
  return data;
}

async function fetchDepartment(departmentId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("departments")
    .select("department_name")
    .eq("id", departmentId)
    .single();
  if (error) throw error;
  return data;
}

export default function TrackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [authOpen, setAuthOpen] = useState(false);
  const initialTracking = searchParams.get("tracking") || "";
  const [trackingNumber, setTrackingNumber] = useState(initialTracking);
  const [document, setDocument] = useState<Document | null>(null);
  const [logs, setLogs] = useState<DocumentLog[]>([]);
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([]);
  const [docType, setDocType] = useState<{ type_name: string; description?: string | null } | null>(null);
  const [currentDept, setCurrentDept] = useState<{ department_name: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("timeline");
  const [copied, setCopied] = useState(false);

  const performSearch = async (targetTracking: string) => {
    if (!targetTracking.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const cleanTracking = targetTracking.trim().toUpperCase();
      const doc = await fetchDocumentByTracking(cleanTracking);
      setDocument(doc);
      const [logsData, stepsData, typeData, deptData] = await Promise.all([
        fetchDocumentLogs(doc.id, cleanTracking),
        fetchWorkflowSteps(doc.workflow_template_id),
        fetchDocumentType(doc.document_type_id).catch(() => null),
        doc.current_department_id ? fetchDepartment(doc.current_department_id).catch(() => null) : null,
      ]);
      setLogs(logsData);
      setWorkflowSteps(stepsData);
      setDocType(typeData);
      setCurrentDept(deptData);
      router.push(`/track?tracking=${cleanTracking}`);
    } catch (err) {
      setError("Document not found. Please check your tracking number and try again.");
      setDocument(null);
      setLogs([]);
      setWorkflowSteps([]);
      setDocType(null);
      setCurrentDept(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await performSearch(trackingNumber);
  };

  useEffect(() => {
    if (initialTracking) {
      performSearch(initialTracking);
    }
  }, [initialTracking]);

  const handleCopyTracking = () => {
    if (!document?.tracking_no) return;
    navigator.clipboard?.writeText(document.tracking_no);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getCurrentStepIndex = () => {
    if (!document || !workflowSteps.length) return 0;
    const currentStep = workflowSteps.find(s => s.id === document.current_step_id);
    return currentStep ? currentStep.step_order - 1 : 0;
  };

  const renderStatusBadge = (status: string) => (
    <Badge
      role="status"
      aria-atomic="true"
      className={cn(getStatusColor(status), "capitalize font-semibold px-3 py-1 text-xs sm:text-sm shadow-sm")}
    >
      {getStatusLabel(status)}
    </Badge>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <svg className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-xl font-bold text-primary">DocuTrack HEI</span>
          </Link>
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => setAuthOpen(true)} className="text-sm font-medium text-muted-foreground hover:text-foreground">Sign in</button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {/* Search Form */}
        <div className="mx-auto max-w-3xl mb-8">
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Track Your Document</CardTitle>
              <CardDescription>
                Enter your tracking number to view the current status and progress of your academic request.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
                <Input
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
                  placeholder="DT-2026-XXXXXXXX"
                  className="flex-1 text-center text-lg font-mono"
                  disabled={loading}
                />
                <Button type="submit" size="lg" disabled={loading} className="whitespace-nowrap">
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="h-5 w-5 mr-2" />
                      Track
                    </>
                  )}
                </Button>
              </form>
              <p className="text-center text-sm text-muted-foreground mt-3">
                Tracking format: <code className="px-1.5 py-0.5 rounded bg-muted">DT-2026-ABC12345</code>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Error State */}
        {error && (
          <div className="mx-auto max-w-3xl mb-8">
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 text-destructive">
                  <AlertCircle className="h-6 w-6" />
                  <p>{error}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Document Details */}
        {document && (
          <div className="mx-auto max-w-4xl space-y-6">
            {/* Document Header */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium text-muted-foreground">Tracking Number</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl font-bold font-mono text-foreground">{document.tracking_no}</h1>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handleCopyTracking}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        title="Copy tracking number"
                        aria-label="Copy tracking number"
                      >
                        {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {renderStatusBadge(document.current_status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Document Type</p>
                    <p className="font-medium text-foreground">{docType?.type_name || document.document_type_id}</p>
                  </div>
                  {currentDept && (
                    <div className="sm:col-span-2">
                      <p className="text-sm text-muted-foreground">Current Handling Office</p>
                      <p className="font-medium text-foreground">{currentDept.department_name}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Submitted</p>
                    <p className="font-medium">{formatDateTime(document.submitted_at)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Updated</p>
                    <p className="font-medium">{formatDateTime(document.updated_at)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Progress Stepper */}
            <Card>
              <CardHeader>
                <CardTitle>Processing Progress</CardTitle>
                <CardDescription>Current stage: {workflowSteps[getCurrentStepIndex()]?.step_name || "Unknown"}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {workflowSteps.map((step, index) => {
                    const isCompleted = index < getCurrentStepIndex();
                    const isCurrent = index === getCurrentStepIndex();
                    const isFuture = index > getCurrentStepIndex();
                    const log = logs.find(l => l.new_status === step.step_name.toLowerCase().replace(/\s+/g, '_'));

                    return (
                      <div key={step.id} className="flex gap-4 relative">
                        {/* Vertical line */}
                        <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-border" style={{ display: index === workflowSteps.length - 1 ? 'none' : 'block' }} />
                        {/* Step indicator */}
                        <div className={cn(
                          "relative flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center z-10 transition-colors",
                          isCompleted ? "bg-primary border-primary text-primary-foreground" :
                          isCurrent ? "bg-primary border-primary text-primary-foreground ring-4 ring-primary/20" :
                          "bg-background border-muted text-muted-foreground"
                        )}>
                          {isCompleted ? (
                            <CheckCircle className="h-5 w-5" />
                          ) : isCurrent ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <span className="text-sm font-bold">{index + 1}</span>
                          )}
                        </div>
                        {/* Step content */}
                        <div className="flex-1 min-w-0 pt-1">
                          <div className="flex items-center justify-between">
                            <h4 className={cn(
                              "font-medium",
                              isCompleted ? "text-foreground" : isCurrent ? "text-primary" : "text-muted-foreground"
                            )}>
                              {step.step_name}
                            </h4>
                            {log && (
                              <span className="text-sm text-muted-foreground">
                                {formatRelativeTime(log.created_at)}
                              </span>
                            )}
                          </div>
                          {isCurrent && log && (
                            <p className="text-sm text-primary mt-1">
                              Current handler action: {log.action_taken.replace('_', ' ')}
                            </p>
                          )}
                          {log?.public_remarks && (
                            <p className="text-sm text-muted-foreground mt-1 italic">
                              "{log.public_remarks}"
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Tabs for Timeline and Details */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full">
                <TabsTrigger value="timeline">Activity Timeline</TabsTrigger>
                <TabsTrigger value="details">Document Details</TabsTrigger>
              </TabsList>

              <TabsContent value="timeline" className="mt-4">
                <Card>
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      {logs.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No activity logs available yet.</p>
                        </div>
                      ) : (
                        logs.map((log, index) => (
                          <div key={log.id} className="flex gap-4 pb-4 border-b last:border-0 last:pb-0">
                            <div className="relative flex-shrink-0 w-6">
                              <div className={cn(
                                "absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-0.5",
                                index === logs.length - 1 ? "bg-transparent" : "bg-border"
                              )} />
                              <div className={cn(
                                "relative z-10 w-3 h-3 rounded-full border-2 flex items-center justify-center",
                                log.action_taken === "submit" ? "bg-success border-success" :
                                log.action_taken === "return" || log.action_taken === "reject" ? "bg-destructive border-destructive" :
                                log.action_taken === "release" || log.action_taken === "approve" ? "bg-success border-success" :
                                "bg-primary border-primary"
                              )}>
                                {log.action_taken === "submit" && <CheckCircle className="h-2 w-2 text-white" />}
                                {log.action_taken === "return" && <AlertTriangle className="h-2 w-2 text-white" />}
                                {log.action_taken === "reject" && <AlertCircle className="h-2 w-2 text-white" />}
                                {log.action_taken === "release" && <CheckCircle className="h-2 w-2 text-white" />}
                                {log.action_taken === "approve" && <CheckCircle className="h-2 w-2 text-white" />}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium capitalize">{log.action_taken.replace('_', ' ')}</h4>
                                <span className="text-sm text-muted-foreground">{formatDateTime(log.created_at)}</span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Status: {log.previous_status ? getStatusLabel(log.previous_status) : "—"} → {getStatusLabel(log.new_status || "")}
                              </p>
                              {log.public_remarks && (
                                <p className="text-sm mt-1 italic text-muted-foreground">
                                  "{log.public_remarks}"
                                </p>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="details" className="mt-4">
                <Card>
                  <CardContent className="pt-0">
                    <div className="space-y-6">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Tracking Number</p>
                          <p className="font-mono font-medium">{document.tracking_no}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Current Status</p>
                          <p className="font-medium">{renderStatusBadge(document.current_status)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Submitted At</p>
                          <p className="font-medium">{formatDateTime(document.submitted_at)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Last Updated</p>
                          <p className="font-medium">{formatDateTime(document.updated_at)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Completed At</p>
                          <p className="font-medium">{document.completed_at ? formatDateTime(document.completed_at) : "Not completed"}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Print Receipt */}
            <div className="text-center">
              <Button variant="outline" onClick={() => window.print()}>
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9V2h12v7" />
                  <rect x="2" y="9" width="20" height="12" rx="2" />
                </svg>
                Print Tracking Receipt
              </Button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!document && !error && !loading && (
          <div className="mx-auto max-w-3xl text-center py-16">
            <Search className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Enter a tracking number to begin</h3>
            <p className="text-muted-foreground">
              Your tracking number can be found on your submission receipt or confirmation email.
            </p>
          </div>
        )}
      </main>

      <footer className="border-t py-8 mt-16">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} DocuTrack HEI. All rights reserved.
        </div>
      </footer>
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </div>
  );
}
