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
  AlertTriangle,
  Download,
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
  { value: "submitted", label: "Submitted" },
  { value: "received", label: "Received" },
  { value: "under_review", label: "Under Review" },
  { value: "endorsed", label: "Endorsed" },
  { value: "forwarded", label: "Forwarded" },
  { value: "returned", label: "Returned" },
  { value: "additional_info_requested", label: "Add. Info" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "released", label: "Released" },
  { value: "archived", label: "Archived" },
];

export default function StudentDocumentsPage() {
  const { profile } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [docTypeFilter, setDocTypeFilter] = useState("all");
  const [docTypes, setDocTypes] = useState<Array<{id: string, type_name: string}>>([]);

  useEffect(() => {
    fetchDocuments();
    fetchDocTypes();
  }, [activeTab]);

  const fetchDocuments = async () => {
    if (!profile?.student_id) return;
    const supabase = createClient();
    let query = supabase
      .from("documents")
      .select(`
        *,
        document_types ( type_name )
      `)
      .eq("student_id", profile.student_id)
      .order("submitted_at", { ascending: false });

    if (activeTab !== "all") {
      query = query.eq("current_status", activeTab);
    }

    if (docTypeFilter !== "all") {
      query = query.eq("document_type_id", docTypeFilter);
    }

    const { data, error } = await query;
    if (!error && data) {
      setDocuments(data as Document[]);
    }
    setLoading(false);
  };

  const fetchDocTypes = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("document_types")
      .select("id, type_name")
      .eq("is_active", true);
    if (data) setDocTypes(data);
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = 
      doc.tracking_no.toLowerCase().includes(search.toLowerCase()) ||
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
            <h1 className="text-2xl font-bold">My Documents</h1>
            <p className="text-muted-foreground">View and track all your academic requests</p>
          </div>
          <Button asChild>
            <Link href="/student/requests/new">
              <FileText className="h-4 w-4 mr-2" />
              New Request
            </Link>
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tracking number or type..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={docTypeFilter} onValueChange={setDocTypeFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Document Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {docTypes.map(dt => (
                    <SelectItem key={dt.id} value={dt.id}>{dt.type_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                {statusTabs.slice(0, 4).map((tab) => (
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
                              <TableCell>{doc.document_types?.type_name || doc.document_type_id}</TableCell>
                              <TableCell>{renderStatusBadge(doc.current_status)}</TableCell>
                              <TableCell>{formatDate(doc.submitted_at)}</TableCell>
                              <TableCell>{formatRelativeTime(doc.updated_at)}</TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="sm" asChild>
                                  <Link href={`/student/requests/${doc.id}`}>
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