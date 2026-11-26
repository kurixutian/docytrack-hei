"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { formatDate, getStatusLabel, getStatusColor, generateTrackingNumber, generatePublicLookupToken, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Loader2,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  GraduationCap,
  Mail,
  User,
  Building2,
  Calendar,
  HelpCircle,
} from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

const submissionSchema = z.object({
  student_id: z.string().min(1, "Student ID is required"),
  student_name: z.string().min(1, "Full name is required"),
  student_email: z.string().email("Invalid email address"),
  college: z.string().min(1, "College is required"),
  department_id: z.string().min(1, "Department is required"),
  program: z.string().min(1, "Program is required"),
  year_level: z.coerce.number().min(1).max(10),
  document_type_id: z.string().min(1, "Document type is required"),
  purpose: z.string().min(10, "Purpose must be at least 10 characters"),
  additional_info: z.string().optional(),
});

type SubmissionForm = z.infer<typeof submissionSchema>;

interface DocumentType {
  id: string;
  type_name: string;
  description: string | null;
}

interface Department {
  id: string;
  department_code: string;
  department_name: string;
  college: string;
}

export default function NewRequestPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");

  const form = useForm<SubmissionForm>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      student_id: profile?.student_id || "",
      student_name: profile?.full_name || "",
      student_email: profile?.email || "",
      college: profile?.college || "",
      department_id: "",
      program: profile?.program || "",
      year_level: profile?.year_level || 1,
      document_type_id: "",
      purpose: "",
      additional_info: "",
    },
  });

  useEffect(() => {
    fetchDocumentTypes();
    fetchDepartments();
  }, []);

  const fetchDocumentTypes = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("document_types")
      .select("*")
      .eq("is_active", true)
      .order("type_name");
    if (!error && data) setDocumentTypes(data);
  };

  const fetchDepartments = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("departments")
      .select("*")
      .eq("is_active", true)
      .order("department_name");
    if (!error && data) setDepartments(data);
  };

  const onSubmit = async (values: SubmissionForm) => {
    setSubmitting(true);
    try {
      const supabase = createClient();
      
      // Get the default workflow for this document type
      const { data: docType } = await supabase
        .from("document_types")
        .select("default_workflow_id")
        .eq("id", values.document_type_id)
        .single();

      if (!docType?.default_workflow_id) {
        throw new Error("No workflow configured for this document type");
      }

      // Get first workflow step
      const { data: firstStep } = await supabase
        .from("workflow_steps")
        .select("id")
        .eq("workflow_id", docType.default_workflow_id)
        .order("step_order")
        .limit(1)
        .single();

      // Generate tracking number and lookup token securely
      const trackingNo = generateTrackingNumber();
      const lookupToken = generatePublicLookupToken();

      // Create document
      const { data: document, error: docError } = await supabase
        .from("documents")
        .insert({
          tracking_no: trackingNo,
          student_id: values.student_id,
          student_name: values.student_name,
          student_email: values.student_email,
          college: values.college,
          department_id: values.department_id,
          program: values.program,
          year_level: values.year_level,
          document_type_id: values.document_type_id,
          current_status: "submitted",
          current_department_id: values.department_id,
          workflow_template_id: docType.default_workflow_id,
          current_step_id: firstStep?.id,
          public_lookup_token: lookupToken,
        })
        .select()
        .single();

      if (docError) throw docError;

      // Create initial log
      await supabase.from("document_logs").insert({
        document_id: document.id,
        action_taken: "submit",
        previous_status: null,
        new_status: "submitted",
        origin_department_id: null,
        destination_department_id: values.department_id,
        handled_by: profile?.id,
        internal_remarks: "Document submitted by student",
        public_remarks: "Document submitted and awaiting department review",
      });

      // Notify department chair
      const { data: chairs } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "department_chair")
        .eq("department_id", values.department_id)
        .eq("is_active", true);

      if (chairs?.length) {
        await supabase.from("notifications").insert(
          chairs.map((chair) => ({
            user_id: chair.id,
            document_id: document.id,
            title: "New Document Submitted",
            message: `A new ${documentTypes.find(dt => dt.id === values.document_type_id)?.type_name} request (${trackingNo}) has been submitted and assigned to your department.`,
          }))
        );
      }

      setTrackingNumber(trackingNo);
      setSuccess(true);
    } catch (err: any) {
      form.setError("purpose", { message: err.message || "Failed to submit request. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStatusBadge = (status: string) => (
    <Badge className={cn(getStatusColor(status), "capitalize")}>
      {getStatusLabel(status)}
    </Badge>
  );

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">New Academic Request</h1>
            <p className="text-muted-foreground">Submit a new academic document request for processing</p>
          </div>
        </div>

        <AlertDialog open={success} onOpenChange={setSuccess}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="flex items-center gap-2 text-success mb-2">
                <CheckCircle className="h-6 w-6" />
                <AlertDialogTitle className="text-xl">Request Submitted Successfully!</AlertDialogTitle>
              </div>
              <AlertDialogDescription className="space-y-3 pt-2 text-foreground/90">
                <p>Your academic request has been received and entered into the routing queue.</p>
                <div className="p-3 bg-muted rounded-md font-mono text-center font-bold text-lg select-all border">
                  {trackingNumber}
                </div>
                <p className="text-sm text-muted-foreground">
                  Keep this tracking number handy. You can use it anytime on the tracking page to follow real-time progress.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2 sm:gap-0">
              <AlertDialogCancel onClick={() => { setSuccess(false); router.push("/student/requests"); }}>
                View All Requests
              </AlertDialogCancel>
              <AlertDialogAction onClick={() => router.push(`/track?tracking=${trackingNumber}`)}>
                Track Progress Now
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Card>
          <CardHeader>
            <CardTitle>Request Details</CardTitle>
            <CardDescription>Fill in the required information to submit your academic request.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Student Info Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Student Information
                </h3>
                <Separator />
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="student_id">Student ID *</Label>
                    <Input
                      id="student_id"
                      {...form.register("student_id")}
                      disabled
                      value={form.watch("student_id")}
                    />
                    <p className="text-xs text-muted-foreground">Your student ID (auto-filled)</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student_name">Full Name *</Label>
                    <Input
                      id="student_name"
                      {...form.register("student_name")}
                      disabled
                      value={form.watch("student_name")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student_email">Institutional Email *</Label>
                    <Input
                      id="student_email"
                      type="email"
                      {...form.register("student_email")}
                      disabled
                      value={form.watch("student_email")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="college">College *</Label>
                    <Input
                      id="college"
                      {...form.register("college")}
                      disabled
                      value={form.watch("college")}
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="department_id">Department *</Label>
                    <Select
                      value={form.watch("department_id")}
                      onValueChange={(v) => form.setValue("department_id", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.department_name} ({dept.department_code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.department_id && (
                      <p className="text-sm text-destructive">{form.formState.errors.department_id.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="program">Program/Course *</Label>
                    <Input
                      id="program"
                      {...form.register("program")}
                    />
                    {form.formState.errors.program && (
                      <p className="text-sm text-destructive">{form.formState.errors.program.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="year_level">Year Level *</Label>
                    <Select
                      value={form.watch("year_level").toString()}
                      onValueChange={(v) => form.setValue("year_level", parseInt(v))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1,2,3,4,5,6].map((y) => (
                          <SelectItem key={y} value={y.toString()}>Year {y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Document Details Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Document Details
                </h3>
                <Separator />
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="document_type_id">Document Category *</Label>
                    <Select
                      value={form.watch("document_type_id")}
                      onValueChange={(v) => form.setValue("document_type_id", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select document type" />
                      </SelectTrigger>
                      <SelectContent>
                        {documentTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.type_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.document_type_id && (
                      <p className="text-sm text-destructive">{form.formState.errors.document_type_id.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="purpose">Purpose / Description *</Label>
                    <Textarea
                      id="purpose"
                      {...form.register("purpose")}
                      placeholder="Describe the purpose of your request in detail..."
                      rows={4}
                    />
                    {form.formState.errors.purpose && (
                      <p className="text-sm text-destructive">{form.formState.errors.purpose.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground">Minimum 10 characters</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="additional_info">Additional Information</Label>
                    <Textarea
                      id="additional_info"
                      {...form.register("additional_info")}
                      placeholder="Any additional information or special circumstances..."
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-4 pt-4 border-t">
                <Button type="submit" className="flex-1" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Submit Request
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Document Types Info */}
        <Card>
          <CardHeader>
            <CardTitle>Available Document Types</CardTitle>
            <CardDescription>Select the appropriate document type for your request.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {documentTypes.map((type) => (
                <div key={type.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <FileText className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">{type.type_name}</p>
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
