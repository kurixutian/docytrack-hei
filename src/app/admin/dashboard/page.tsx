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
import { formatDate, formatRelativeTime, getStatusLabel, getStatusColor, cn, getRoleLabel } from "@/lib/utils";
import Link from "next/link";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  Building2,
  Settings,
  Search,
  Eye,
  Loader2,
  BarChart3,
  Shield,
  Plus,
  TrendingUp,
} from "lucide-react";

interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
  department_id: string | null;
  college: string | null;
  is_active: boolean;
  created_at: string;
  departments?: { department_name: string };
}

interface Department {
  id: string;
  department_code: string;
  department_name: string;
  college: string;
  office_location: string | null;
  is_active: boolean;
}

interface DocumentType {
  id: string;
  type_name: string;
  description: string | null;
  is_active: boolean;
}

interface Stats {
  totalUsers: number;
  totalDepartments: number;
  totalDocumentTypes: number;
  totalDocuments: number;
  pendingDocuments: number;
}

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalDepartments: 0,
    totalDocumentTypes: 0,
    totalDocuments: 0,
    pendingDocuments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchStats();
  }, [profile]);

  const fetchStats = async () => {
    const supabase = createClient();
    const [users, depts, docTypes, docs] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("departments").select("id", { count: "exact", head: true }),
      supabase.from("document_types").select("id", { count: "exact", head: true }),
      supabase.from("documents").select("current_status", { count: "exact" }),
    ]);
    setStats({
      totalUsers: users.count || 0,
      totalDepartments: depts.count || 0,
      totalDocumentTypes: docTypes.count || 0,
      totalDocuments: docs.count || 0,
      pendingDocuments: docs.data?.filter(d => !["released", "archived", "rejected"].includes(d.current_status)).length || 0,
    });
    setLoading(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">System Administrator Dashboard</h1>
            <p className="text-muted-foreground">System overview and administrative controls</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="departments">Departments</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">Registered accounts</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Departments</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalDepartments}</div>
                  <p className="text-xs text-muted-foreground">Active departments</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Document Types</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalDocumentTypes}</div>
                  <p className="text-xs text-muted-foreground">Configured types</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalDocuments}</div>
                  <p className="text-xs text-muted-foreground">All submissions</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-warning">{stats.pendingDocuments}</div>
                  <p className="text-xs text-muted-foreground">Awaiting processing</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 mt-6 sm:grid-cols-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-3">
                  <Button variant="outline" asChild className="h-24 flex-col gap-2">
                    <Link href="/admin/users">
                      <Plus className="h-8 w-8" />
                      <span>Add User</span>
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="h-24 flex-col gap-2">
                    <Link href="/admin/departments">
                      <Building2 className="h-8 w-8" />
                      <span>Manage Departments</span>
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="h-24 flex-col gap-2">
                    <Link href="/admin/document-types">
                      <FileText className="h-8 w-8" />
                      <span>Document Types</span>
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="h-24 flex-col gap-2">
                    <Link href="/admin/workflows">
                      <Settings className="h-8 w-8" />
                      <span>Workflows</span>
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="h-24 flex-col gap-2">
                    <Link href="/admin/audit-logs">
                      <Search className="h-8 w-8" />
                      <span>Audit Logs</span>
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="h-24 flex-col gap-2">
                    <Link href="/admin/settings">
                      <Shield className="h-8 w-8" />
                      <span>System Settings</span>
                    </Link>
                  </Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>System Health</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Database Connection</span>
                    <Badge className="bg-success/10 text-success">Connected</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Authentication</span>
                    <Badge className="bg-success/10 text-success">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Real-time</span>
                    <Badge className="bg-success/10 text-success">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Storage</span>
                    <Badge className="bg-warning/10 text-warning">75% Used</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>User Management</CardTitle>
                <Button asChild>
                  <Link href="/admin/users/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Add User
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">User management interface - implement user CRUD operations</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="departments" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Department Management</CardTitle>
                <Button asChild>
                  <Link href="/admin/departments/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Department
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Department management interface - implement department CRUD operations</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">System settings configuration - implement settings management</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}