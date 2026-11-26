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
  ArrowRight,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
} from "lucide-react";

interface Document {
  id: string;
  tracking_no: string;
  document_type_id: string;
  current_status: string;
  submitted_at: string;
  updated_at: string;
  completed_at: string | null;
  document_types?: { type_name: string };
}

export default function StudentDashboard() {
  const { profile, refreshProfile } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    rejected: 0,
  });

  useEffect(() => {
    fetchDocuments();
    fetchStats();
  }, [profile]);

  const fetchDocuments = async () => {
    if (!profile) return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("documents")
      .select(`
        *,
        document_types ( type_name )
      `)
      .eq("student_id", profile.student_id || "")
      .order("submitted_at", { ascending: false });
    if (!error && data) {
      setDocuments(data as Document[]);
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    if (!profile) return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("documents")
      .select("current_status")
      .eq("student_id", profile.student_id || "");
    if (!error && data) {
      const total = data.length;
      const pending = data.filter(d => ["submitted", "received", "under_review", "endorsed", "forwarded"].includes(d.current_status)).length;
      const completed = data.filter(d => ["approved", "released", "archived"].includes(d.current_status)).length;
      const rejected = data.filter(d => ["rejected", "returned"].includes(d.current_status)).length;
      setStats({ total, pending, completed, rejected });
    }
  };

  const renderStatusBadge = (status: string) => (
    <Badge
      role="status"
      aria-atomic="true"
      className={cn(getStatusColor(status), "capitalize font-medium")}
    >
      {getStatusLabel(status)}
    </Badge>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {profile?.full_name ? `Good day, ${profile.full_name.split(" ")[0]}` : "Student Portal"}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {stats.pending > 0
                ? `${stats.pending} academic request${stats.pending > 1 ? "s" : ""} currently in active university routing.`
                : "All submitted academic requests are up to date."}
            </p>
          </div>
          <Button asChild>
            <Link href="/student/requests/new">
              <Plus className="h-4 w-4 mr-2" />
              New Request
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold tracking-tight tabular-nums text-foreground">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">All time submissions</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Processing</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold tracking-tight tabular-nums text-warning">{stats.pending}</div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting office review</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold tracking-tight tabular-nums text-success">{stats.completed}</div>
              <p className="text-xs text-muted-foreground mt-1">Approved & released</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Action Needed</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold tracking-tight tabular-nums text-destructive">{stats.rejected}</div>
              <p className="text-xs text-muted-foreground mt-1">Requires student revision</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Documents */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Requests</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/student/requests">
                View All
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">No requests yet</h3>
                <p className="text-muted-foreground mb-4">Submit your first academic request to get started.</p>
                <Button asChild>
                  <Link href="/student/requests/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Submit New Request
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tracking No.</TableHead>
                      <TableHead>Document Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Last Update</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.slice(0, 10).map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-mono font-medium tabular-nums">{doc.tracking_no}</TableCell>
                        <TableCell>{doc.document_types?.type_name || doc.document_type_id}</TableCell>
                        <TableCell>{renderStatusBadge(doc.current_status)}</TableCell>
                        <TableCell className="tabular-nums">{formatDate(doc.submitted_at)}</TableCell>
                        <TableCell>{formatRelativeTime(doc.updated_at)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/student/requests/${doc.id}`} aria-label={`View details for ${doc.tracking_no}`}>
                              <Eye className="h-4 w-4" />
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

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <Button variant="outline" asChild className="h-24 flex-col gap-2">
              <Link href="/student/requests/new">
                <FileText className="h-8 w-8" />
                <span>New Request</span>
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-24 flex-col gap-2">
              <Link href="/student/requests">
                <Search className="h-8 w-8" />
                <span>View All Requests</span>
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-24 flex-col gap-2">
              <Link href="/track">
                <Eye className="h-8 w-8" />
                <span>Track Document</span>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}