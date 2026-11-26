"use client";

import { FormEvent, useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import { Edit, FileText, Loader2, Plus, Search, Trash2 } from "lucide-react";

interface DocumentType {
  id: string;
  type_name: string;
  description: string | null;
  default_workflow_id: string | null;
  is_active: boolean;
  created_at: string;
  workflow_templates?: { name: string } | null;
}

interface Workflow {
  id: string;
  name: string;
  is_active: boolean;
}

export default function AdminDocumentTypesPage() {
  const [docTypes, setDocTypes] = useState<DocumentType[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DocumentType | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [workflowId, setWorkflowId] = useState("");
  const [deleting, setDeleting] = useState<DocumentType | null>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const [typesResult, workflowsResult] = await Promise.all([
        supabase.from("document_types").select("*, workflow_templates ( name )").order("type_name"),
        supabase.from("workflow_templates").select("id, name, is_active").order("name"),
      ]);
      if (typesResult.error) setError(typesResult.error.message);
      else setDocTypes((typesResult.data || []) as DocumentType[]);
      if (!workflowsResult.error) setWorkflows((workflowsResult.data || []) as Workflow[]);
      setLoading(false);
    };
    void load();
  }, []);

  const openForm = (type?: DocumentType) => {
    setError("");
    setEditing(type || null);
    setName(type?.type_name || "");
    setDescription(type?.description || "");
    setWorkflowId(type?.default_workflow_id || "");
    setDialogOpen(true);
  };

  const saveType = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    const supabase = createClient();
    const values = { type_name: name.trim(), description: description.trim() || null, default_workflow_id: workflowId || null };
    const result = editing
      ? await supabase.from("document_types").update(values).eq("id", editing.id)
      : await supabase.from("document_types").insert({ ...values, is_active: true });

    if (result.error) {
      setError(result.error.message.includes("document_types_type_name_key") ? "A document type with this name already exists." : result.error.message);
      setSaving(false);
      return;
    }

    const { data } = await supabase.from("document_types").select("*, workflow_templates ( name )").order("type_name");
    if (data) setDocTypes(data as DocumentType[]);
    setDialogOpen(false);
    setSaving(false);
  };

  const toggleActive = async (type: DocumentType) => {
    setError("");
    const nextActive = !type.is_active;
    const { error: updateError } = await createClient().from("document_types").update({ is_active: nextActive }).eq("id", type.id);
    if (updateError) setError(updateError.message);
    else setDocTypes((items) => items.map((item) => item.id === type.id ? { ...item, is_active: nextActive } : item));
  };

  const deleteType = async () => {
    if (!deleting) return;
    setError("");
    const supabase = createClient();
    const { data: requests, error: requestError } = await supabase.from("documents").select("id").eq("document_type_id", deleting.id).limit(1);
    if (requestError) {
      setError(requestError.message);
      return;
    }
    if (requests?.length) {
      setError("This type is used by existing requests. Deactivate it instead so those records keep their category.");
      return;
    }

    const { error: deleteError } = await supabase.from("document_types").delete().eq("id", deleting.id);
    if (deleteError) setError(deleteError.message);
    else {
      setDocTypes((items) => items.filter((item) => item.id !== deleting.id));
      setDeleting(null);
    }
  };

  const filteredTypes = docTypes.filter((type) =>
    `${type.type_name} ${type.description || ""}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Document Types</h1>
            <p className="text-muted-foreground">Manage request categories and their default workflows.</p>
          </div>
          <Button onClick={() => openForm()}><Plus className="mr-2 h-4 w-4" />Add Document Type</Button>
        </div>

        {error && !dialogOpen && !deleting && <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        <Card>
          <CardContent className="pt-6">
            <div className="relative mb-6 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input aria-label="Search document types" placeholder="Search by name or description" value={search} onChange={(event) => setSearch(event.target.value)} className="pl-10" />
            </div>
            {loading ? <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : filteredTypes.length === 0 ? (
              <div className="py-12 text-center"><FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" /><h3 className="mb-2 text-lg font-medium">No document types found</h3><p className="text-muted-foreground">Add a document type to make it available for requests.</p></div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Description</TableHead><TableHead>Default Workflow</TableHead><TableHead>Status</TableHead><TableHead>Created</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                  <TableBody>{filteredTypes.map((type) => <TableRow key={type.id}>
                    <TableCell className="font-medium">{type.type_name}</TableCell>
                    <TableCell className="max-w-xs truncate">{type.description || "—"}</TableCell>
                    <TableCell>{type.workflow_templates?.name || "Not configured"}</TableCell>
                    <TableCell><Switch checked={type.is_active} onCheckedChange={() => void toggleActive(type)} aria-label={`${type.is_active ? "Deactivate" : "Activate"} ${type.type_name}`} /></TableCell>
                    <TableCell>{formatDate(type.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" aria-label={`Edit ${type.type_name}`} onClick={() => openForm(type)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" aria-label={`Delete ${type.type_name}`} className="text-destructive hover:text-destructive" onClick={() => { setError(""); setDeleting(type); }}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>)}</TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit document type" : "Add document type"}</DialogTitle><DialogDescription>Set the category students will choose when making a request.</DialogDescription></DialogHeader>
          <form id="document-type-form" onSubmit={saveType} className="space-y-4">
            {error && <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
            <div className="space-y-2"><Label htmlFor="type-name">Name</Label><Input id="type-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={255} required /></div>
            <div className="space-y-2"><Label htmlFor="type-description">Description</Label><Textarea id="type-description" value={description} onChange={(event) => setDescription(event.target.value)} rows={3} /></div>
            <div className="space-y-2"><Label htmlFor="type-workflow">Default workflow</Label>
              <Select value={workflowId || "none"} onValueChange={(value) => setWorkflowId(value === "none" ? "" : value)}>
                <SelectTrigger id="type-workflow"><SelectValue placeholder="Choose a workflow" /></SelectTrigger>
                <SelectContent><SelectItem value="none">No workflow selected</SelectItem>{workflows.map((workflow) => <SelectItem key={workflow.id} value={workflow.id}>{workflow.name}{workflow.is_active ? "" : " (inactive)"}</SelectItem>)}</SelectContent>
              </Select>
              {!workflows.length && <p className="text-xs text-muted-foreground">Create a workflow before assigning one to this type.</p>}
            </div>
          </form>
          <DialogFooter><Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button type="submit" form="document-type-form" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editing ? "Save changes" : "Create document type"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(open) => { if (!open) { setDeleting(null); setError(""); } }}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete {deleting?.type_name}?</AlertDialogTitle><AlertDialogDescription>Deletion is only available when no requests use this category. You can deactivate it to prevent new requests while preserving history.</AlertDialogDescription></AlertDialogHeader>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={(event) => { event.preventDefault(); void deleteType(); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete type</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
