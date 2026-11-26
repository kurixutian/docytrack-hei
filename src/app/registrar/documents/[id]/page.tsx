"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { formatDate, formatDateTime, formatRelativeTime, getStatusLabel, getStatusColor, cn } from "@/lib/utils";
import Link from "next/link";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  User,
  Mail,
  Building2,
  Calendar,
  MapPin,
  Eye,
  Loader2,
  AlertTriangle,
  ChevronRight,
  ArrowLeft,
  Archive,
} from "lucide-react";

interface Document {
  id: string;
  tracking_no: string;
  student_id: string;
  student_name: string;
  student_email: string;
  college: string;
  department_id: string;
  program: string | null;
  year_level: number | null;
  document_type_id: string;
  current_status: string;
  current_department_id: string | null;
  current_handler_id: string | null;
  workflow_template_id: string;
  current_step_id: string | null;
  submitted_at: string;
  updated_at: string;
  completed_at: string | null;
  public_lookup_token: string;
  document_types?: { type_name: string };
  departments?: { department_name: string; department_code: string };
  current_department?: { department_name: string; department_code: string };
  current_handler?: { full_name: string };
}

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
  handled_by_profile?: { full_name: string };
  origin_department?: { department_name: string };
  destination_department?: { department_name: string };
}

interface WorkflowStep {
  id: string;
  step_order: number;
  step_name: string;
  assigned_role: string;
  assigned_department_id: string | null;
  allowed_actions: any;
  expected_duration_days: number | null;
}

const actionLabels: Record<string, string> = {
  receive: "Receive Document",
  approve: "Approve",
  reject: "Reject",
  release: "Release to Student",
  archive: "Archive",
};

const registrarActions = ["receive", "approve", "reject", "release", "archive"];

export default function RegistrarDocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { profile } = useAuth();
  const [document, setDocument] = useState<Document | null>(null);
  const [logs, setLogs] = useState<DocumentLog[]>([]);
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("timeline");
  const [showActionDialog, setShowActionDialog] = useState<string | null>(null);
  const [actionRemarks, setActionRemarks] = useState("");
  const [publicRemarks, setPublicRemarks] = useState("");

  useEffect(() => {
    fetchDocument();
  }, [params.id]);

  const fetchDocument = async () => {
    if (!params.id) return;
    const supabase = createClient();
    const { data: doc, error } = await supabase
      .from("documents")
      .select(`
        *,
        document_types ( type_name ),
        departments ( department_name, department_code ),
        current_department:departments!documents_current_department_id_fkey ( department_name, department_code ),
        current_handler:profiles!documents_current_handler_id_fkey ( full_name )
      `)
      .eq("id", params.id)
      .single();
    if (error || !doc) return;
    setDocument(doc as Document);

    const [logsData, stepsData] = await Promise.all([
      fetchLogs(doc.id),
      fetchWorkflowSteps(doc.workflow_template_id),
    ]);
    setLogs(logsData);
    setWorkflowSteps(stepsData);
    setLoading(false);
  };

  const fetchLogs = async (documentId: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("document_logs")
      .select(`
        *,
        handled_by_profile:profiles!document_logs_handled_by_fkey ( full_name ),
        origin_department:departments!document_logs_origin_department_id_fkey ( department_name ),
        destination_department:departments!document_logs_destination_department_id_fkey ( department_name )
      `)
      .eq("document_id", documentId)
      .order("created_at", { ascending: true });
    if (error) return [];
    return data as DocumentLog[];
  };

  const fetchWorkflowSteps = async (workflowId: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("workflow_steps")
      .select("*")
      .eq("workflow_id", workflowId)
      .order("step_order", { ascending: true });
    if (error) return [];
    return data as WorkflowStep[];
  };

  const getCurrentStepIndex = () => {
    if (!document || !workflowSteps.length) return 0;
    const currentStep = workflowSteps.find(s => s.id === document.current_step_id);
    return currentStep ? currentStep.step_order - 1 : 0;
  };

  const getCurrentStep = () => {
    return workflowSteps[getCurrentStepIndex()];
  };

  const getAllowedActions = () => {
    const currentStep = getCurrentStep();
    if (!currentStep?.allowed_actions) return registrarActions;
    return Object.keys(currentStep.allowed_actions).filter(key => currentStep.allowed_actions[key]);
  };

  const handleAction = async (action: string) => {
    if (!document || !profile) return;
    
    if (["reject"].includes(action) && !actionRemarks.trim()) {
      alert("Remarks are required for this action");
      return;
    }

    setActionLoading(action);
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("transition_document", {
        p_document_id: document.id,
        p_action: action,
        p_user_id: profile.id,
        p_internal_remarks: actionRemarks || null,
        p_public_remarks: publicRemarks || null,
        p_destination_department_id: null,
      });

      if (error) throw error;
      
      setShowActionDialog(null);
      setActionRemarks("");
      setPublicRemarks("");
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Failed to perform action");
    } finally {
      setActionLoading(null);
    }
  };

  const renderStatusBadge = (status: string) => (
    <Badge className={cn(getStatusColor(status), "capitalize")}>
      {getStatusLabel(status)}
    </Badge>
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!document) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium mb-2">Document not found</h3>
          <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
        </div>
      </DashboardLayout>
    );
  }

  const allowedActions = getAllowedActions();
  const currentStep = getCurrentStep();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <FileText className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">Tracking Number</span>
              </div>
              <h1 className="text-2xl font-bold font-mono">{document.tracking_no}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {renderStatusBadge(document.current_status)}
            <Button variant="outline" asChild>
              <Link href="/track" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Public Tracking
              </Link>
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Document Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Document Type</p>
                <p className="font-medium">{document.document_types?.type_name || document.document_type_id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Student</p>
                <p className="font-medium">{document.student_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Student ID</p>
                <p className="font-mono font-medium">{document.student_id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{document.student_email}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-sm text-muted-foreground">Program / Year</p>
                <p className="font-medium">
                  {document.program} {document.year_level ? `• Year ${document.year_level}` : ""}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">College</p>
                <p className="font-medium">{document.college}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Department</p>
                <p className="font-medium">{document.departments?.department_name || document.department_id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Office</p>
                <p className="font-medium">{document.current_department?.department_name || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Submitted</p>
                <p className="font-medium">{formatDateTime(document.submitted_at)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="font-medium">{formatRelativeTime(document.updated_at)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="font-medium">{document.completed_at ? formatDateTime(document.completed_at) : "Not completed"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current Processing Step</CardTitle>
            <CardDescription>
              {currentStep?.step_name || "Unknown step"} • {currentStep?.assigned_role?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || "Unknown role"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-12 h-12 rounded-full border-2 flex items-center justify-center",
                  "bg-primary border-primary text-primary-foreground"
                )}>
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
                <div>
                  <h4 className="font-medium">{currentStep?.step_name || "Unknown"}</h4>
                  <p className="text-sm text-muted-foreground">
                    Assigned to: {currentStep?.assigned_role?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || "Unknown"}
                    {currentStep?.assigned_department_id && " • Department"}
                  </p>
                  {currentStep?.expected_duration_days && (
                    <p className="text-sm text-muted-foreground">
                      Expected duration: {currentStep.expected_duration_days} day(s)
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {allowedActions.map((action) => (
                  <AlertDialog key={action}>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant={["approve", "release"].includes(action) ? "default" : 
                                 ["reject"].includes(action) ? "destructive" : "outline"}
                        disabled={actionLoading === action}
                        onClick={() => setShowActionDialog(action)}
                      >
                        {actionLoading === action ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        {actionLabels[action] || action}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirm {actionLabels[action] || action}</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to {actionLabels[action].toLowerCase()} this document?
                          {["reject"].includes(action) && " This action requires remarks."}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleAction(action)}
                          disabled={["reject"].includes(action) && !actionRemarks.trim()}
                        >
                          {actionLabels[action] || action}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ))}
              </div>
            </div>

            {showActionDialog && (["reject"].includes(showActionDialog)) && (
              <div className="mt-4 space-y-4 border-t pt-4">
                <div className="space-y-2">
                  <Label htmlFor="internal-remarks">Internal Remarks *</Label>
                  <Textarea
                    id="internal-remarks"
                    value={actionRemarks}
                    onChange={(e) => setActionRemarks(e.target.value)}
                    placeholder="Enter internal remarks for this action..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="public-remarks">Student-Visible Remarks</Label>
                  <Textarea
                    id="public-remarks"
                    value={publicRemarks}
                    onChange={(e) => setPublicRemarks(e.target.value)}
                    placeholder="Enter remarks visible to the student (optional)..."
                    rows={2}
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="default" onClick={() => handleAction(showActionDialog!)} disabled={["reject"].includes(showActionDialog!) && !actionRemarks.trim()}>
                    Confirm {actionLabels[showActionDialog] || showActionDialog}
                  </Button>
                  <Button variant="outline" onClick={() => { setShowActionDialog(null); setActionRemarks(""); setPublicRemarks(""); }}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {showActionDialog && !["reject"].includes(showActionDialog) && (
              <div className="mt-4 space-y-2 border-t pt-4">
                <p className="text-sm text-muted-foreground">
                  Confirm {actionLabels[showActionDialog]?.toLowerCase()} this document?
                </p>
                <div className="flex gap-2">
                  <Button variant={["approve", "release"].includes(showActionDialog!) ? "default" : "outline"} 
                    onClick={() => handleAction(showActionDialog!)} disabled={actionLoading === showActionDialog}>
                    {actionLoading === showActionDialog ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Confirm
                  </Button>
                  <Button variant="outline" onClick={() => setShowActionDialog(null)}>Cancel</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Processing Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {workflowSteps.map((step, index) => {
                const isCompleted = index < getCurrentStepIndex();
                const isCurrent = index === getCurrentStepIndex();
                const log = logs.find(l => l.new_status === step.step_name.toLowerCase().replace(/\s+/g, '_'));

                return (
                  <div key={step.id} className="flex gap-4 relative">
                    <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-border" style={{ display: index === workflowSteps.length - 1 ? 'none' : 'block' }} />
                    <div className={cn(
                      "relative flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center z-10 transition-all",
                      isCompleted ? "bg-primary border-primary text-primary-foreground" :
                      isCurrent ? "bg-primary border-primary text-primary-foreground ring-4 ring-primary/20" :
                      "bg-background border-muted text-muted-foreground"
                    )}>
                      {isCompleted ? <CheckCircle className="h-5 w-5" /> : isCurrent ? <Loader2 className="h-5 w-5 animate-spin" /> : <span className="text-sm font-bold">{index + 1}</span>}
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex items-center justify-between">
                        <h4 className={cn(
                          "font-medium",
                          isCompleted ? "text-foreground" : isCurrent ? "text-primary" : "text-muted-foreground"
                        )}>
                          {step.step_name}
                        </h4>
                        {log && <span className="text-sm text-muted-foreground">{formatRelativeTime(log.created_at)}</span>}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {step.assigned_role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        {step.assigned_department_id && " • Department"}
                      </p>
                      {isCurrent && log && (
                        <p className="text-sm text-primary mt-1">Current action: {log.action_taken.replace('_', ' ')}</p>
                      )}
                      {log?.public_remarks && (
                        <p className="text-sm text-muted-foreground mt-1 italic">"{log.public_remarks}"</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="timeline">Activity Timeline</TabsTrigger>
            <TabsTrigger value="details">Document Details</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="mt-4">
            <Card>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {logs.map((log, index) => (
                    <div key={log.id} className="flex gap-4 pb-4 border-b last:border-0 last:pb-0">
                      <div className="relative flex-shrink-0 w-6">
                        <div className={cn(
                          "absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-0.5",
                          index === logs.length - 1 ? "bg-transparent" : "bg-border"
                        )} />
                        <div className={cn(
                          "relative z-10 w-3 h-3 rounded-full border-2 flex items-center justify-center",
                          log.action_taken === "submit" ? "bg-green-500 border-green-500" :
                          log.action_taken === "return" || log.action_taken === "reject" ? "bg-red-500 border-red-500" :
                          log.action_taken === "release" || log.action_taken === "approve" ? "bg-emerald-500 border-emerald-500" :
                          "bg-primary border-primary"
                        )}>
                          {log.action_taken === "submit" && <CheckCircle className="h-2 w-2 text-white" />}
                          {log.action_taken === "return" && <AlertTriangle className="h-2 w-2 text-white" />}
                          {log.action_taken === "reject" && <XCircle className="h-2 w-2 text-white" />}
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
                        {log.handled_by_profile && (
                          <p className="text-sm text-muted-foreground">By: {log.handled_by_profile.full_name}</p>
                        )}
                        {log.public_remarks && (
                          <p className="text-sm mt-1 italic text-muted-foreground">"{log.public_remarks}"</p>
                        )}
                      </div>
                    </div>
                  ))}
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
                      <p className="text-sm text-muted-foreground">Student Name</p>
                      <p className="font-medium">{document.student_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Student ID</p>
                      <p className="font-mono font-medium">{document.student_id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Student Email</p>
                      <p className="font-medium">{document.student_email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">College</p>
                      <p className="font-medium">{document.college}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Department</p>
                      <p className="font-medium">{document.departments?.department_name || document.department_id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Program</p>
                      <p className="font-medium">{document.program || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Year Level</p>
                      <p className="font-medium">{document.year_level?.toString() || "N/A"}</p>
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

        <div className="text-center">
          <Button variant="outline" onClick={() => window.print()}>
            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9V2h12v7" />
              <rect x="2" y="9" width="20" height="12" rx="2" />
            </svg>
            Print Document
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}