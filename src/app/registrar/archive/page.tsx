"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  Archive,
  ArrowRight,
  Search,
  Filter,
  Eye,
  Loader2,
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

export default function RegistrarArchivePage() {
  const { profile } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [collegeFilter, setCollegeFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [colleges, setColleges] = useState<string[]>([]);
  const [years, setYears] = useState<number[]>([]);

  useEffect(() => {
    fetchDocuments();
    fetchFilters();
  }, []);

  const fetchDocuments = async () => {
    const supabase = createClient();
    let query = supabase
      .from("documents")
      .select(`
        *,
        document_types ( type_name )
      `)
      .in("current_status", ["archived", "released"])
      .order("completed_at", { ascending: false });

    if (collegeFilter !== "all") {
      query = query.eq("college", collegeFilter);
    }

    if (yearFilter !== "all") {
      const year = parseInt(yearFilter);
      const start = new Date(year, 0, 1).toISOString();
      const end = new Date(year + 1, 0, 1).toISOString();
      query = query.gte("completed_at", start).lt("completed_at", end);
    }

    const { data, error } = await query;
    if (!error && data) {
      setDocuments(data as Document[]);
    }
    setLoading(false);
  };

  const fetchFilters = async () => {
    const supabase = createClient();
    const [collegeData, yearData] = await Promise.all([
      supabase.from("documents").select("college"),
      supabase.from("documents").select("completed_at").in("current_status", ["archived", "released"]),
    ]);
    if (collegeData.data) {
      const uniqueColleges = Array.from(new Set(collegeData.data.map(d => d.college).filter(Boolean)));
      setColleges(uniqueColleges);
    }
    if (yearData.data) {
      const uniqueYears = Array.from(new Set(yearData.data.map(d => d.completed_at ? new Date(d.completed_at).getFullYear() : null).filter(Boolean))) as number[];
      setYears(uniqueYears.sort((a, b) => b - a));
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
            <h1 className="text-2xl font-bold">Archive</h1>
            <p className="text-muted-foreground">Completed and archived documents</p>
          </div>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Archive
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search archive..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={collegeFilter} onValueChange={setCollegeFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Colleges" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Colleges</SelectItem>
                  {colleges.map(college => (
                    <SelectItem key={college} value={college}>{college}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {years.map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="text-center py-12">
                <Archive className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">No archived documents</h3>
                <p className="text-muted-foreground">Completed documents will appear here.</p>
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
                      <TableHead>Completed</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocuments.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-mono font-medium">{doc.tracking_no}</TableCell>
                        <TableCell>{doc.student_name} ({doc.student_id})</TableCell>
                        <TableCell>{doc.college}</TableCell>
                        <TableCell>{doc.document_types?.type_name || doc.document_type_id}</TableCell>
                        <TableCell>{renderStatusBadge(doc.current_status)}</TableCell>
                        <TableCell>{formatDate(doc.submitted_at)}</TableCell>
                        <TableCell>{doc.completed_at ? formatDate(doc.completed_at) : "—"}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/registrar/documents/${doc.id}`}>
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
      </div>
    </DashboardLayout>
  );
}