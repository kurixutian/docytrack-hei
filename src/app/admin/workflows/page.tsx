"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { formatDate, cn } from "@/lib/utils";
import Link from "next/link";
import {
  Settings,
  Search,
  Loader2,
  Edit,
  Trash2,
  Plus,
  GitBranch,
  ListTodo,
} from "lucide-react";

interface WorkflowTemplate {
  id: string;
  name: string;
  document_type_id: string | null;
  is_active: boolean;
  version: number;
  created_at: string;
  document_types?: { type_name: string };
  workflow_steps?: WorkflowStep[];
}

interface WorkflowStep {
  id: string;
  workflow_id: string;
  step_order: number;
  step_name: string;
  assigned_role: string;
  assigned_department_id: string | null;
  allowed_actions: any;
  expected_duration_days: number | null;
}

const roleLabels: Record<string, string> = {
  student: "Student",
  department_chair: "Dept. Chair",
  college_dean: "Dean",
  university_registrar: "Registrar",
  system_admin: "Admin",
};

export default function AdminWorkflowsPage() {
  const { profile } = useAuth();
  const [workflows, setWorkflows] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("workflow_templates")
      .select(`
        *,
        document_types ( type_name ),
        workflow_steps ( * )
      `)
      .order("created_at", { ascending: false });
    if (!error && data) {
      setWorkflows(data as WorkflowTemplate[]);
    }
    setLoading(false);
  };

  const filteredWorkflows = workflows.filter(w => 
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    (w.document_types?.type_name && w.document_types.type_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Workflow Templates</h1>
            <p className="text-muted-foreground">Manage document processing workflows</p>
          </div>
          <Button asChild>
            <Link href="/admin/workflows/new">
              <Plus className="h-4 w-4 mr-2" />
              Create Workflow
            </Link>
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search workflows..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredWorkflows.length === 0 ? (
              <div className="text-center py-12">
                <GitBranch className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">No workflows found</h3>
                <p className="text-muted-foreground">Create your first workflow template.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Document Type</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Steps</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWorkflows.map((wf) => (
                      <TableRow key={wf.id}>
                        <TableCell className="font-medium">{wf.name}</TableCell>
                        <TableCell>{wf.document_types?.type_name || "General"}</TableCell>
                        <TableCell>v{wf.version}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">
                            {wf.workflow_steps?.length || 0} steps
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={wf.is_active ? "success" : "secondary"}>
                            {wf.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(wf.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/workflows/${wf.id}/edit`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
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

        {/* Workflow Details */}
        {filteredWorkflows.length > 0 && (
          <Tabs defaultValue={filteredWorkflows[0].id} className="mt-6">
            <TabsList className="flex-wrap">
              {filteredWorkflows.map((wf) => (
                <TabsTrigger key={wf.id} value={wf.id}>{wf.name}</TabsTrigger>
              ))}
            </TabsList>

            {filteredWorkflows.map((wf) => (
              <TabsContent key={wf.id} value={wf.id} className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{wf.name} - Steps</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Order</TableHead>
                            <TableHead>Step Name</TableHead>
                            <TableHead>Assigned Role</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Allowed Actions</TableHead>
                            <TableHead>Expected Duration</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(wf.workflow_steps || []).sort((a, b) => a.step_order - b.step_order).map((step) => (
                            <TableRow key={step.id}>
                              <TableCell className="font-mono font-medium">{step.step_order}</TableCell>
                              <TableCell className="font-medium">{step.step_name}</TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="capitalize">
                                  {roleLabels[step.assigned_role] || step.assigned_role}
                                </Badge>
                              </TableCell>
                              <TableCell>{step.assigned_department_id ? "Specific Department" : "Any"}</TableCell>
                              <TableCell className="max-w-xs">
                                {step.allowed_actions ? (
                                  <div className="flex flex-wrap gap-1">
                                    {Object.entries(step.allowed_actions)
                                      .filter(([, v]) => v)
                                      .map(([k]) => (
                                        <Badge key={k} variant="outline" className="text-xs capitalize">
                                          {k.replace('_', ' ')}
                                        </Badge>
                                      ))}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">All</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {step.expected_duration_days ? `${step.expected_duration_days} day(s)` : "Not set"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
}