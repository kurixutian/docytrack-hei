"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { formatDate, formatRelativeTime, getStatusLabel, getStatusColor, cn } from "@/lib/utils";
import Link from "next/link";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Inbox,
  ArrowRight,
  Search,
  Filter,
  Eye,
  Loader2,
  Users,
  TrendingUp,
  GraduationCap,
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
  document_types?: { type_name: string };
}

interface Stats {
  incoming: number;
  pending_approval: number;
  awaiting_action: number;
  returned: number;
  recently_processed: number;
  dept_stats: number;
}

export default function DeanDashboard() {
  const { profile } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    incoming: 0,
    pending_approval: 0,
    awaiting_action: 0,
    returned: 0,
    recently_processed: 0,
    dept_stats: 0,
  });

  useEffect(() => {
    fetchDocuments();
    fetchStats();
  }, [profile]);

  const fetchDocuments = async () => {
    if (!profile?.college) return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("documents")
      .select(`
        *,
        document_types ( type_name )
      `)
      .eq("college", profile.college)
      .order("updated_at", { ascending: false })
      .limit(20);
    if (!error && data) {
      setDocuments(data as Document[]);
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    if (!profile?.college) return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("documents")
      .select("current_status")
      .eq("college", profile.college);
    if (!error && data) {
      setStats({
        incoming: data.filter(d => d.current_status === "forwarded").length,
        pending_approval: data.filter(d => ["endorsed", "forwarded", "received"].includes(d.current_status)).length,
        awaiting_action: data.filter(d => ["received", "under_review"].includes(d.current_status)).length,
        returned: data.filter(d => d.current_status === "returned").length,
        recently_processed: data.filter(d => ["approved", "rejected"].includes(d.current_status)).length,
        dept_stats: data.length,
      });
    }
  };

  const renderStatusBadge = (status: string) => (
    <Badge className={cn(getStatusColor(status), "capitalize")}>
      {getStatusLabel(status)}
    </Badge>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">College Dean Dashboard</h1>
            <p className="text-muted-foreground">Manage documents for {profile?.college}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Incoming Endorsed</CardTitle>
              <Inbox className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.incoming}</div>
              <p className="text-xs text-muted-foreground">From departments</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{stats.pending_approval}</div>
              <p className="text-xs text-muted-foreground">Awaiting decision</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Awaiting Action</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.awaiting_action}</div>
              <p className="text-xs text-muted-foreground">Received, not reviewed</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Returned</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.returned}</div>
              <p className="text-xs text-muted-foreground">Sent back to dept</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recently Processed</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{stats.recently_processed}</div>
              <p className="text-xs text-muted-foreground">Approved or rejected</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.dept_stats}</div>
              <p className="text-xs text-muted-foreground">All time for college</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <Button variant="outline" asChild className="h-24 flex-col gap-2">
              <Link href="/dean/inbox">
                <Inbox className="h-8 w-8" />
                <span>View Inbox</span>
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-24 flex-col gap-2">
              <Link href="/dean/documents">
                <FileText className="h-8 w-8" />
                <span>All Documents</span>
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-24 flex-col gap-2">
              <Link href="/dean/dashboard">
                <Search className="h-8 w-8" />
                <span>Search Documents</span>
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Documents in College</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dean/documents">
                View All
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">No documents in college</h3>
                <p className="text-muted-foreground">Documents for your college will appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tracking No.</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Document Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Last Update</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-mono font-medium">{doc.tracking_no}</TableCell>
                        <TableCell>{doc.student_name} ({doc.student_id})</TableCell>
                        <TableCell>{doc.department_id}</TableCell>
                        <TableCell>{doc.document_types?.type_name || doc.document_type_id}</TableCell>
                        <TableCell>{renderStatusBadge(doc.current_status)}</TableCell>
                        <TableCell>{formatDate(doc.submitted_at)}</TableCell>
                        <TableCell>{formatRelativeTime(doc.updated_at)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/dean/documents/${doc.id}`}>
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">View details</span>
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}