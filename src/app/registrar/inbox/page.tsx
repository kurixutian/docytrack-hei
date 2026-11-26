"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  { value: "approved", label: "Approved" },
  { value: "released", label: "Released" },
  { value: "rejected", label: "Rejected" },
  { value: "archived", label: "Archived" },
];

export default function RegistrarInboxPage() {
  const { profile } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    fetchDocuments();
  }, [activeTab]);

  const fetchDocuments = async () => {
    const supabase = createClient();
    let query = supabase
      .from("documents")
      .select(`
        *,
        document_types ( type_name )
      `)
      .order("updated_at", { ascending: false });

    if (activeTab !== "all") {
      query = query.eq("current_status", activeTab);
    }

    const { data, error } = await query;
    if (!error && data) {
      setDocuments(data as Document[]);
    }
    setLoading(false);
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
            <h1 className="text-2xl font-bold">Registrar Inbox</h1>
            <p className="text-muted-foreground">All documents for final review</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            {statusTabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
            ))}
          </TabsList>

          {statusTabs.map((tab) => (
            <TabsContent key={tab.value} value={tab.value} className="mt-4">
              <Card>
                <CardContent className="pt-0">
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : documents.length === 0 ? (
                    <div className="text-center py-12">
                      <Inbox className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
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
                            <TableHead>College</TableHead>
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
                              <TableCell>{doc.college}</TableCell>
                              <TableCell>{doc.document_types?.type_name || doc.document_type_id}</TableCell>
                              <TableCell>{renderStatusBadge(doc.current_status)}</TableCell>
                              <TableCell>{formatDate(doc.submitted_at)}</TableCell>
                              <TableCell>{formatRelativeTime(doc.updated_at)}</TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="sm" asChild>
                                  <Link href={`/registrar/documents/${doc.id}`}>
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
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}