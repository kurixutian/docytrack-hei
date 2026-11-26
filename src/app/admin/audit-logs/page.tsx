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
import { formatDate, formatDateTime, getRoleLabel, cn } from "@/lib/utils";
import {
  Search,
  Loader2,
  FileText,
  Filter,
  Calendar,
  Download,
} from "lucide-react";

interface AuditLog {
  id: string;
  document_id: string;
  action_taken: string;
  previous_status: string | null;
  new_status: string | null;
  origin_department_id: string | null;
  destination_department_id: string | null;
  handled_by: string | null;
  internal_remarks: string | null;
  public_remarks: string | null;
  created_at: string;
  documents?: { tracking_no: string; student_name: string; student_id: string };
  handled_by_profile?: { full_name: string; email: string; role: string };
  origin_department?: { department_name: string };
  destination_department?: { department_name: string };
}

export default function AdminAuditLogsPage() {
  const { profile } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, dateFrom, dateTo]);

  const fetchLogs = async () => {
    const supabase = createClient();
    let query = supabase
      .from("document_logs")
      .select(`
        *,
        documents ( tracking_no, student_name, student_id ),
        handled_by_profile:profiles!document_logs_handled_by_fkey ( full_name, email, role ),
        origin_department:departments!document_logs_origin_department_id_fkey ( department_name ),
        destination_department:departments!document_logs_destination_department_id_fkey ( department_name )
      `)
      .order("created_at", { ascending: false })
      .limit(500);

    if (actionFilter !== "all") {
      query = query.eq("action_taken", actionFilter);
    }

    if (dateFrom) {
      query = query.gte("created_at", dateFrom);
    }

    if (dateTo) {
      query = query.lte("created_at", dateTo + "T23:59:59");
    }

    const { data, error } = await query;
    if (!error && data) {
      setLogs(data as AuditLog[]);
    }
    setLoading(false);
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.documents?.tracking_no.toLowerCase().includes(search.toLowerCase()) ||
      log.documents?.student_name.toLowerCase().includes(search.toLowerCase()) ||
      log.handled_by_profile?.full_name.toLowerCase().includes(search.toLowerCase()) ||
      log.action_taken.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const actions = [
    "submit", "receive", "start_review", "endorse", "forward", 
    "return", "request_additional_info", "approve", "reject", "release", "archive"
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Audit Logs</h1>
            <p className="text-muted-foreground">System-wide activity and audit trail</p>
          </div>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Logs
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {actions.map(action => (
                    <SelectItem key={action} value={action}>
                      {action.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  placeholder="From"
                  className="w-[160px]"
                />
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  placeholder="To"
                  className="w-[160px]"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">No audit logs found</h3>
                <p className="text-muted-foreground">Try adjusting your filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Document</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Status Change</TableHead>
                      <TableHead>Handler</TableHead>
                      <TableHead>Departments</TableHead>
                      <TableHead>Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-sm">{formatDateTime(log.created_at)}</TableCell>
                        <TableCell className="font-mono">{log.documents?.tracking_no || "N/A"}</TableCell>
                        <TableCell>{log.documents?.student_name || "N/A"} ({log.documents?.student_id || "N/A"})</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">
                            {log.action_taken.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {log.previous_status && log.new_status ? (
                            <>
                              <Badge variant="secondary" className="mr-1">
                                {log.previous_status.replace('_', ' ')}
                              </Badge>
                              <span className="mx-1">→</span>
                              <Badge variant="default">
                                {log.new_status.replace('_', ' ')}
                              </Badge>
                            </>
                          ) : log.new_status ? (
                            <Badge variant="default">{log.new_status.replace('_', ' ')}</Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {log.handled_by_profile && (
                            <div>
                              <p className="font-medium">{log.handled_by_profile.full_name}</p>
                              <p className="text-xs text-muted-foreground capitalize">{getRoleLabel(log.handled_by_profile.role)}</p>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {log.origin_department && log.destination_department && (
                            <>
                              <span className="text-muted-foreground">{log.origin_department.department_name}</span>
                              <span className="mx-1">→</span>
                              <span>{log.destination_department.department_name}</span>
                            </>
                          )} 
                          {log.origin_department && !log.destination_department && log.origin_department.department_name}
                          {!log.origin_department && log.destination_department && log.destination_department.department_name}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          {log.public_remarks && (
                            <span className="italic text-muted-foreground">"{log.public_remarks}"</span>
                          )}
                          {log.internal_remarks && !log.public_remarks && (
                            <span className="text-destructive/80 font-mono text-xs">[Internal: {log.internal_remarks.substring(0, 30)}...]</span>
                          )}
                          {!log.public_remarks && !log.internal_remarks && (
                            <span className="text-muted-foreground">—</span>
                          )}
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