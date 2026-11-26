"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { formatDate, cn } from "@/lib/utils";
import Link from "next/link";
import {
  FileText,
  Search,
  Loader2,
  Edit,
  Trash2,
  Plus,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface DocumentType {
  id: string;
  type_name: string;
  description: string | null;
  default_workflow_id: string | null;
  is_active: boolean;
  created_at: string;
  workflow_templates?: { name: string };
}

export default function AdminDocumentTypesPage() {
  const { profile } = useAuth();
  const [docTypes, setDocTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchDocTypes();
  }, []);

  const fetchDocTypes = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("document_types")
      .select(`
        *,
        workflow_templates ( name )
      `)
      .order("type_name");
    if (!error && data) {
      setDocTypes(data as any);
    }
    setLoading(false);
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("document_types")
      .update({ is_active: !currentStatus })
      .eq("id", id);
    if (!error) {
      setDocTypes(prev => prev.map(d => d.id === id ? { ...d, is_active: !currentStatus } : d));
    }
  };

  const filteredDocTypes = docTypes.filter(d => 
    d.type_name.toLowerCase().includes(search.toLowerCase()) ||
    (d.description && d.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Document Types</h1>
            <p className="text-muted-foreground">Manage academic document categories</p>
          </div>
          <Button asChild>
            <Link href="/admin/document-types/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Document Type
            </Link>
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search document types..."
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
            ) : filteredDocTypes.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">No document types found</h3>
                <p className="text-muted-foreground">Add your first document type to get started.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Default Workflow</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocTypes.map((docType) => (
                      <TableRow key={docType.id}>
                        <TableCell className="font-medium">{docType.type_name}</TableCell>
                        <TableCell className="max-w-xs truncate">{docType.description || "—"}</TableCell>
                        <TableCell>{docType.workflow_templates?.name || "Not configured"}</TableCell>
                        <TableCell>
                          <Switch
                            checked={docType.is_active}
                            onCheckedChange={() => toggleActive(docType.id, docType.is_active)}
                          />
                        </TableCell>
                        <TableCell>{formatDate(docType.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/document-types/${docType.id}/edit`}>
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
      </div>
    </DashboardLayout>
  );
}