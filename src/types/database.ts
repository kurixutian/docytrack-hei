// Database types generated from Supabase
// Run: npm run db:types to regenerate

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          role: Database["public"]["Enums"]["user_role"];
          department_id: string | null;
          college: string | null;
          program: string | null;
          year_level: number | null;
          student_id: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          email: string;
          role?: Database["public"]["Enums"]["user_role"];
          department_id?: string | null;
          college?: string | null;
          program?: string | null;
          year_level?: number | null;
          student_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          role?: Database["public"]["Enums"]["user_role"];
          department_id?: string | null;
          college?: string | null;
          program?: string | null;
          year_level?: number | null;
          student_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_department_id_fkey";
            columns: ["department_id"];
            isOneToOne: false;
            referencedRelation: "departments";
            referencedColumns: ["id"];
          }
        ];
      };
      departments: {
        Row: {
          id: string;
          department_code: string;
          department_name: string;
          college: string;
          office_location: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          department_code: string;
          department_name: string;
          college: string;
          office_location?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          department_code?: string;
          department_name?: string;
          college?: string;
          office_location?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      document_types: {
        Row: {
          id: string;
          type_name: string;
          description: string | null;
          default_workflow_id: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          type_name: string;
          description?: string | null;
          default_workflow_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          type_name?: string;
          description?: string | null;
          default_workflow_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "document_types_default_workflow_id_fkey";
            columns: ["default_workflow_id"];
            isOneToOne: false;
            referencedRelation: "workflow_templates";
            referencedColumns: ["id"];
          }
        ];
      };
      workflow_templates: {
        Row: {
          id: string;
          name: string;
          document_type_id: string | null;
          is_active: boolean;
          version: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          document_type_id?: string | null;
          is_active?: boolean;
          version?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          document_type_id?: string | null;
          is_active?: boolean;
          version?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workflow_templates_document_type_id_fkey";
            columns: ["document_type_id"];
            isOneToOne: false;
            referencedRelation: "document_types";
            referencedColumns: ["id"];
          }
        ];
      };
      workflow_steps: {
        Row: {
          id: string;
          workflow_id: string;
          step_order: number;
          step_name: string;
          assigned_role: Database["public"]["Enums"]["user_role"];
          assigned_department_id: string | null;
          allowed_actions: Json | null;
          expected_duration_days: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workflow_id: string;
          step_order: number;
          step_name: string;
          assigned_role: Database["public"]["Enums"]["user_role"];
          assigned_department_id?: string | null;
          allowed_actions?: Json | null;
          expected_duration_days?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workflow_id?: string;
          step_order?: number;
          step_name?: string;
          assigned_role?: Database["public"]["Enums"]["user_role"];
          assigned_department_id?: string | null;
          allowed_actions?: Json | null;
          expected_duration_days?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workflow_steps_workflow_id_fkey";
            columns: ["workflow_id"];
            isOneToOne: false;
            referencedRelation: "workflow_templates";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workflow_steps_assigned_department_id_fkey";
            columns: ["assigned_department_id"];
            isOneToOne: false;
            referencedRelation: "departments";
            referencedColumns: ["id"];
          }
        ];
      };
      documents: {
        Row: {
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
          public_lookup_token: string;
        };
        Insert: {
          id?: string;
          tracking_no: string;
          student_id: string;
          student_name: string;
          student_email: string;
          college: string;
          department_id: string;
          program?: string | null;
          year_level?: number | null;
          document_type_id: string;
          current_status: string;
          current_department_id?: string | null;
          current_handler_id?: string | null;
          workflow_template_id: string;
          current_step_id?: string | null;
          submitted_at?: string;
          updated_at?: string;
          completed_at?: string | null;
          public_lookup_token: string;
        };
        Update: {
          id?: string;
          tracking_no?: string;
          student_id?: string;
          student_name?: string;
          student_email?: string;
          college?: string;
          department_id?: string;
          program?: string | null;
          year_level?: number | null;
          document_type_id?: string;
          current_status?: string;
          current_department_id?: string | null;
          current_handler_id?: string | null;
          workflow_template_id?: string;
          current_step_id?: string | null;
          submitted_at?: string;
          updated_at?: string;
          completed_at?: string | null;
          public_lookup_token?: string;
        };
        Relationships: [
          {
            foreignKeyName: "documents_department_id_fkey";
            columns: ["department_id"];
            isOneToOne: false;
            referencedRelation: "departments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "documents_document_type_id_fkey";
            columns: ["document_type_id"];
            isOneToOne: false;
            referencedRelation: "document_types";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "documents_workflow_template_id_fkey";
            columns: ["workflow_template_id"];
            isOneToOne: false;
            referencedRelation: "workflow_templates";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "documents_current_step_id_fkey";
            columns: ["current_step_id"];
            isOneToOne: false;
            referencedRelation: "workflow_steps";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "documents_current_department_id_fkey";
            columns: ["current_department_id"];
            isOneToOne: false;
            referencedRelation: "departments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "documents_current_handler_id_fkey";
            columns: ["current_handler_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      document_logs: {
        Row: {
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
        };
        Insert: {
          id?: string;
          document_id: string;
          action_taken: string;
          previous_status?: string | null;
          new_status?: string | null;
          origin_department_id?: string | null;
          destination_department_id?: string | null;
          handled_by?: string | null;
          internal_remarks?: string | null;
          public_remarks?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          document_id?: string;
          action_taken?: string;
          previous_status?: string | null;
          new_status?: string | null;
          origin_department_id?: string | null;
          destination_department_id?: string | null;
          handled_by?: string | null;
          internal_remarks?: string | null;
          public_remarks?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "document_logs_document_id_fkey";
            columns: ["document_id"];
            isOneToOne: false;
            referencedRelation: "documents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "document_logs_origin_department_id_fkey";
            columns: ["origin_department_id"];
            isOneToOne: false;
            referencedRelation: "departments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "document_logs_destination_department_id_fkey";
            columns: ["destination_department_id"];
            isOneToOne: false;
            referencedRelation: "departments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "document_logs_handled_by_fkey";
            columns: ["handled_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          document_id: string | null;
          title: string;
          message: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          document_id?: string | null;
          title: string;
          message: string;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          document_id?: string | null;
          title?: string;
          message?: string;
          is_read?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_document_id_fkey";
            columns: ["document_id"];
            isOneToOne: false;
            referencedRelation: "documents";
            referencedColumns: ["id"];
          }
        ];
      };
      document_assignments: {
        Row: {
          id: string;
          document_id: string;
          assigned_to: string;
          department_id: string;
          assigned_at: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          document_id: string;
          assigned_to: string;
          department_id: string;
          assigned_at?: string;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          document_id?: string;
          assigned_to?: string;
          department_id?: string;
          assigned_at?: string;
          is_active?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "document_assignments_document_id_fkey";
            columns: ["document_id"];
            isOneToOne: false;
            referencedRelation: "documents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "document_assignments_assigned_to_fkey";
            columns: ["assigned_to"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "document_assignments_department_id_fkey";
            columns: ["department_id"];
            isOneToOne: false;
            referencedRelation: "departments";
            referencedColumns: ["id"];
          }
        ];
      };
      system_settings: {
        Row: {
          id: string;
          setting_key: string;
          setting_value: Json;
          updated_at: string;
        };
        Insert: {
          id?: string;
          setting_key: string;
          setting_value: Json;
          updated_at?: string;
        };
        Update: {
          id?: string;
          setting_key?: string;
          setting_value?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_user_role: {
        Args: { user_id: string };
        Returns: Database["public"]["Enums"]["user_role"];
      };
      is_admin: {
        Args: { user_id: string };
        Returns: boolean;
      };
      can_access_document: {
        Args: { user_id: string; document_id: string };
        Returns: boolean;
      };
      generate_tracking_number: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      get_workflow_steps: {
        Args: { workflow_id: string };
        Returns: {
          id: string;
          step_order: number;
          step_name: string;
          assigned_role: Database["public"]["Enums"]["user_role"];
          assigned_department_id: string | null;
          allowed_actions: Json | null;
          expected_duration_days: number | null;
        }[];
      };
      transition_document: {
        Args: {
          p_document_id: string;
          p_action: string;
          p_user_id: string;
          p_internal_remarks: string | null;
          p_public_remarks: string | null;
          p_destination_department_id: string | null;
        };
        Returns: boolean;
      };
    };
    Enums: {
      user_role: "student" | "department_chair" | "college_dean" | "university_registrar" | "system_admin";
      document_status: "submitted" | "received" | "under_review" | "endorsed" | "forwarded" | "returned" | "additional_info_requested" | "approved" | "rejected" | "released" | "archived";
      document_action: "submit" | "receive" | "start_review" | "endorse" | "forward" | "return" | "request_additional_info" | "approve" | "reject" | "release" | "archive";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}