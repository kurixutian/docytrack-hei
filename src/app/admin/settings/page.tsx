"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { formatDate, cn } from "@/lib/utils";
import {
  Settings,
  Search,
  Loader2,
  Shield,
  Database,
  Bell,
  Users,
  FileText,
  Save,
} from "lucide-react";

interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  updated_at: string;
}

export default function AdminSettingsPage() {
  const { profile } = useAuth();
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("system_settings")
      .select("*")
      .order("setting_key");
    if (!error && data) {
      setSettings(data);
      const initialData: Record<string, any> = {};
      data.forEach(s => {
        initialData[s.setting_key] = s.setting_value;
      });
      setFormData(initialData);
    }
    setLoading(false);
  };

  const handleChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      for (const [key, value] of Object.entries(formData)) {
        await supabase
          .from("system_settings")
          .upsert({ setting_key: key, setting_value: value });
      }
      await fetchSettings();
      alert("Settings saved successfully!");
    } catch (err: any) {
      alert("Failed to save settings: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">System Settings</h1>
            <p className="text-muted-foreground">Configure system-wide settings</p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save Settings
          </Button>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="processing">Processing</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="app_name">Application Name</Label>
                    <Input
                      id="app_name"
                      value={formData.app_name || "DocuTrack HEI"}
                      onChange={(e) => handleChange("app_name", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="institution_name">Institution Name</Label>
                    <Input
                      id="institution_name"
                      value={formData.institution_name || ""}
                      onChange={(e) => handleChange("institution_name", e.target.value)}
                    />
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="support_email">Support Email</Label>
                  <Input
                    id="support_email"
                    type="email"
                    value={formData.support_email || ""}
                    onChange={(e) => handleChange("support_email", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="support_phone">Support Phone</Label>
                  <Input
                    id="support_phone"
                    value={formData.support_phone || ""}
                    onChange={(e) => handleChange("support_phone", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="processing" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Processing Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="default_processing_days">Default Processing Days</Label>
                    <Input
                      id="default_processing_days"
                      type="number"
                      value={formData.default_processing_days?.days || 3}
                      onChange={(e) => handleChange("default_processing_days", { days: parseInt(e.target.value) || 3 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max_overload_units">Max Overload Units</Label>
                    <Input
                      id="max_overload_units"
                      type="number"
                      value={formData.max_overload_units?.units || 24}
                      onChange={(e) => handleChange("max_overload_units", { units: parseInt(e.target.value) || 24 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inc_completion_deadline_days">INC Completion Deadline (Days)</Label>
                    <Input
                      id="inc_completion_deadline_days"
                      type="number"
                      value={formData.inc_completion_deadline_days?.days || 30}
                      onChange={(e) => handleChange("inc_completion_deadline_days", { days: parseInt(e.target.value) || 30 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shifting_application_period">Shifting Application Period</Label>
                    <Input
                      id="shifting_application_period"
                      value={`${formData.shifting_application_period?.start || ""} to ${formData.shifting_application_period?.end || ""}`}
                      onChange={(e) => handleChange("shifting_application_period", e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">Send email notifications for document updates</p>
                  </div>
                  <Switch
                    checked={formData.email_notifications_enabled !== false}
                    onCheckedChange={(checked) => handleChange("email_notifications_enabled", checked)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Real-time Notifications</p>
                    <p className="text-sm text-muted-foreground">Enable Supabase Realtime for instant updates</p>
                  </div>
                  <Switch
                    checked={formData.realtime_enabled !== false}
                    onCheckedChange={(checked) => handleChange("realtime_enabled", checked)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">SMS Notifications</p>
                    <p className="text-sm text-muted-foreground">Send SMS for critical updates (requires provider)</p>
                  </div>
                  <Switch
                    checked={formData.sms_enabled === true}
                    onCheckedChange={(checked) => handleChange("sms_enabled", checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Session Timeout (Minutes)</p>
                    <p className="text-sm text-muted-foreground">Automatic logout after inactivity</p>
                  </div>
                  <Input
                    type="number"
                    value={formData.session_timeout_minutes || 60}
                    onChange={(e) => handleChange("session_timeout_minutes", parseInt(e.target.value) || 60)}
                    className="w-[100px]"
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Rate Limiting - Public Tracking</p>
                    <p className="text-sm text-muted-foreground">Requests per minute per IP</p>
                  </div>
                  <Input
                    type="number"
                    value={formData.rate_limit_public_tracking || 30}
                    onChange={(e) => handleChange("rate_limit_public_tracking", parseInt(e.target.value) || 30)}
                    className="w-[100px]"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Rate Limiting - Submissions</p>
                    <p className="text-sm text-muted-foreground">Submissions per minute per user</p>
                  </div>
                  <Input
                    type="number"
                    value={formData.rate_limit_submission || 10}
                    onChange={(e) => handleChange("rate_limit_submission", parseInt(e.target.value) || 10)}
                    className="w-[100px]"
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Audit Log Retention (Days)</p>
                    <p className="text-sm text-muted-foreground">How long to keep audit logs</p>
                  </div>
                  <Input
                    type="number"
                    value={formData.audit_log_retention_days || 2555}
                    onChange={(e) => handleChange("audit_log_retention_days", parseInt(e.target.value) || 2555)}
                    className="w-[100px]"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}