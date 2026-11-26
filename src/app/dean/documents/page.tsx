"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

const statusTabs = [
  { value: "all", label: "All" },
  { value: "forwarded", label: "Forwarded" },
  { value: "endorsed", label: "Endorsed" },
  { value: "received", label: "Received" },
  { value: "under_review", label: "Under Review" },
  { value: "returned", label: "Returned" },
];

export default function DeanDocumentsPage() {
  const { profile } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [departments, setDepartments] = useState<string[]>([]);

  useEffect(() => {
    fetchDocuments();
    fetchDepartments();
  }, [activeTab]);

  const fetchDocuments = async () => {
    if (!profile?.college) return;
    const supabase = createClient();
    let query = supabase
      .from("documents")
      .select(`
        *,
        document_types ( type_name )
      `)
      .eq("college", profile.college)
      .order("updated_at", { ascending: false });

    if (activeTab !== "all") {
      query = query.eq("current_status", activeTab);
    }

    if (deptFilter !== "all") {
      query = query.eq("department_id", deptFilter);
    }

    const { data, error } = await query;
    if (!error && data) {
      setDocuments(data as Document[]);
    }
    setLoading(false);
  };

  const fetchDepartments = async () => {
    if (!profile?.college) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("departments")
      .select("department_name")
      .eq("college", profile.college)
      .eq("is_active", true);
    if (data) {
      setDepartments(data.map(d => d.department_name));
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = 
      doc.tracking_no.toLowerCase().includes(search.toLowerCase()) ||
      doc.student_name.toLowerCase().includes(search.toLowerCase()) ||
      doc.student_id.toLowerCase().includes(search.toLowerCase()) ||
      doc.document_types?.type_name.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

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
            <h1 className="text-2xl font-bold">All Documents</h1>
            <p className="text-muted-foreground">Documents for {profile?.college}</p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tracking, student, or type..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={deptFilter} onValueChange={setDeptFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                {statusTabs.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
                ))}
              </TabsList>

              {statusTabs.map((tab) => (
                <TabsContent key={tab.value} value={tab.value} className="mt-4">
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : filteredDocuments.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                      <h3 className="text-lg font-medium mb-2">No {tab.label.toLowerCase()} documents</h3>
                      <p className="text-muted-foreground">Documents with this status will appear here.</p>
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
                          {filteredDocuments.map((doc) => (
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
                                  </Link>
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}