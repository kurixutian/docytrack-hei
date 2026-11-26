-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom enums
CREATE TYPE user_role AS ENUM (
  'student',
  'department_chair',
  'college_dean',
  'university_registrar',
  'system_admin'
);

CREATE TYPE document_status AS ENUM (
  'submitted',
  'received',
  'under_review',
  'endorsed',
  'forwarded',
  'returned',
  'additional_info_requested',
  'approved',
  'rejected',
  'released',
  'archived'
);

CREATE TYPE document_action AS ENUM (
  'submit',
  'receive',
  'start_review',
  'endorse',
  'forward',
  'return',
  'request_additional_info',
  'approve',
  'reject',
  'release',
  'archive'
);

-- Departments table
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_code VARCHAR(20) NOT NULL UNIQUE,
  department_name VARCHAR(255) NOT NULL,
  college VARCHAR(255) NOT NULL,
  office_location VARCHAR(255),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  college VARCHAR(255),
  program VARCHAR(255),
  year_level INTEGER,
  student_id VARCHAR(50) UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Document types table
CREATE TABLE document_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type_name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  default_workflow_id UUID,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Workflow templates table
CREATE TABLE workflow_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  document_type_id UUID REFERENCES document_types(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Workflow steps table
CREATE TABLE workflow_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID NOT NULL REFERENCES workflow_templates(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  step_name VARCHAR(255) NOT NULL,
  assigned_role user_role NOT NULL,
  assigned_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  allowed_actions JSONB,
  expected_duration_days INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workflow_id, step_order)
);

-- Documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tracking_no VARCHAR(50) NOT NULL UNIQUE,
  student_id VARCHAR(50) NOT NULL,
  student_name VARCHAR(255) NOT NULL,
  student_email VARCHAR(255) NOT NULL,
  college VARCHAR(255) NOT NULL,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
  program VARCHAR(255),
  year_level INTEGER,
  document_type_id UUID NOT NULL REFERENCES document_types(id) ON DELETE RESTRICT,
  current_status document_status NOT NULL DEFAULT 'submitted',
  current_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  current_handler_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  workflow_template_id UUID NOT NULL REFERENCES workflow_templates(id) ON DELETE RESTRICT,
  current_step_id UUID REFERENCES workflow_steps(id) ON DELETE SET NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  public_lookup_token VARCHAR(64) NOT NULL UNIQUE
);

-- Document logs (audit trail)
CREATE TABLE document_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  action_taken document_action NOT NULL,
  previous_status document_status,
  new_status document_status,
  origin_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  destination_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  handled_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  internal_remarks TEXT,
  public_remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Document assignments table
CREATE TABLE document_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  assigned_to UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(document_id, assigned_to, is_active)
);

-- System settings table
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_department_id ON profiles(department_id);
CREATE INDEX idx_profiles_student_id ON profiles(student_id);
CREATE INDEX idx_documents_tracking_no ON documents(tracking_no);
CREATE INDEX idx_documents_public_lookup_token ON documents(public_lookup_token);
CREATE INDEX idx_documents_student_id ON documents(student_id);
CREATE INDEX idx_documents_student_email ON documents(student_email);
CREATE INDEX idx_documents_current_status ON documents(current_status);
CREATE INDEX idx_documents_current_department_id ON documents(current_department_id);
CREATE INDEX idx_documents_current_handler_id ON documents(current_handler_id);
CREATE INDEX idx_documents_document_type_id ON documents(document_type_id);
CREATE INDEX idx_documents_submitted_at ON documents(submitted_at);
CREATE INDEX idx_document_logs_document_id ON document_logs(document_id);
CREATE INDEX idx_document_logs_created_at ON document_logs(created_at);
CREATE INDEX idx_document_logs_handled_by ON document_logs(handled_by);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_document_assignments_document_id ON document_assignments(document_id);
CREATE INDEX idx_document_assignments_assigned_to ON document_assignments(assigned_to);
CREATE INDEX idx_workflow_steps_workflow_id ON workflow_steps(workflow_id);
CREATE INDEX idx_workflow_steps_assigned_role ON workflow_steps(assigned_role);
CREATE INDEX idx_workflow_steps_assigned_department_id ON workflow_steps(assigned_department_id);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_document_types_updated_at BEFORE UPDATE ON document_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workflow_templates_updated_at BEFORE UPDATE ON workflow_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workflow_steps_updated_at BEFORE UPDATE ON workflow_steps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Departments policies
CREATE POLICY "Departments are viewable by authenticated users" ON departments
  FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "Admins can manage departments" ON departments
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'system_admin')
  );

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT TO authenticated USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND (
      (SELECT role FROM profiles WHERE id = auth.uid()) = 'system_admin'
      OR (
        role = (SELECT role FROM profiles WHERE id = auth.uid())
        AND is_active = (SELECT is_active FROM profiles WHERE id = auth.uid())
      )
    )
  );

-- Trigger to prevent unauthorized role escalation
CREATE OR REPLACE FUNCTION prevent_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'system_admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only system administrators can alter user roles';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_role_escalation ON profiles;
CREATE TRIGGER trg_prevent_role_escalation
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_role_escalation();

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'system_admin')
  );

CREATE POLICY "Admins can manage all profiles" ON profiles
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'system_admin')
  );

-- Document types policies
CREATE POLICY "Document types are viewable by authenticated users" ON document_types
  FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "Admins can manage document types" ON document_types
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'system_admin')
  );

-- Workflow templates policies
CREATE POLICY "Workflow templates are viewable by authenticated users" ON workflow_templates
  FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "Admins can manage workflow templates" ON workflow_templates
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'system_admin')
  );

-- Workflow steps policies
CREATE POLICY "Workflow steps are viewable by authenticated users" ON workflow_steps
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage workflow steps" ON workflow_steps
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'system_admin')
  );

-- Documents policies
CREATE POLICY "Students can view their own documents" ON documents
  FOR SELECT TO authenticated USING (
    student_id = (SELECT student_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Students can create documents" ON documents
  FOR INSERT TO authenticated WITH CHECK (
    student_id = (SELECT student_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Department chairs can view documents in their department" ON documents
  FOR SELECT TO authenticated USING (
    current_department_id = (SELECT department_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'department_chair'
  );

CREATE POLICY "Department chairs can update documents in their department" ON documents
  FOR UPDATE TO authenticated USING (
    current_department_id = (SELECT department_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'department_chair'
  );

CREATE POLICY "College deans can view documents in their college" ON documents
  FOR SELECT TO authenticated USING (
    college = (SELECT college FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'college_dean'
  );

CREATE POLICY "College deans can update documents in their college" ON documents
  FOR UPDATE TO authenticated USING (
    college = (SELECT college FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'college_dean'
  );

CREATE POLICY "Registrars can view all documents" ON documents
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'university_registrar')
  );

CREATE POLICY "Registrars can update all documents" ON documents
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'university_registrar')
  );

CREATE POLICY "Admins can view all documents" ON documents
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'system_admin')
  );

CREATE POLICY "Admins can manage all documents" ON documents
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'system_admin')
  );

-- Public tracking policy (requires valid tracking number or lookup token to prevent mass scraping)
CREATE POLICY "Public can view document by lookup token" ON documents
  FOR SELECT TO anon USING (
    tracking_no = NULLIF(current_setting('request.headers', true)::json->>'x-tracking-no', '')
    OR public_lookup_token = NULLIF(current_setting('request.headers', true)::json->>'x-lookup-token', '')
  );

-- Secure RPC function for public tracking to fetch document safely
CREATE OR REPLACE FUNCTION get_document_for_tracking(p_tracking_no VARCHAR)
RETURNS SETOF documents
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM documents
  WHERE tracking_no = p_tracking_no
  LIMIT 1;
END;
$$;

-- Document logs policies
CREATE POLICY "Users can view logs for documents they can access" ON document_logs
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM documents d
      WHERE d.id = document_logs.document_id
      AND (
        d.student_id = (SELECT student_id FROM profiles WHERE id = auth.uid())
        OR d.current_department_id = (SELECT department_id FROM profiles WHERE id = auth.uid())
        OR d.college = (SELECT college FROM profiles WHERE id = auth.uid())
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('university_registrar', 'system_admin'))
      )
    )
  );

CREATE POLICY "System can insert logs" ON document_logs
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Admins can view all logs" ON document_logs
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'system_admin')
  );

-- Revoke internal remarks from anon so staff/faculty notes are never exposed publicly
REVOKE SELECT ON document_logs FROM anon;
GRANT SELECT (
  id,
  document_id,
  action_taken,
  previous_status,
  new_status,
  origin_department_id,
  destination_department_id,
  public_remarks,
  created_at
) ON document_logs TO anon;

-- Public tracking logs policy
CREATE POLICY "Public can view public logs by lookup token" ON document_logs
  FOR SELECT TO anon USING (
    EXISTS (
      SELECT 1 FROM documents d
      WHERE d.id = document_logs.document_id
      AND (
        d.tracking_no = NULLIF(current_setting('request.headers', true)::json->>'x-tracking-no', '')
        OR d.public_lookup_token = NULLIF(current_setting('request.headers', true)::json->>'x-lookup-token', '')
      )
    )
  );

-- Public tracking logs RPC (explicitly excludes internal_remarks)
CREATE OR REPLACE FUNCTION get_document_logs_for_tracking(p_document_id UUID)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  action_taken document_action,
  previous_status document_status,
  new_status document_status,
  origin_department_id UUID,
  destination_department_id UUID,
  public_remarks TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    l.document_id,
    l.action_taken,
    l.previous_status,
    l.new_status,
    l.origin_department_id,
    l.destination_department_id,
    l.public_remarks,
    l.created_at
  FROM document_logs l
  WHERE l.document_id = p_document_id
  ORDER BY l.created_at ASC;
END;
$$;

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT TO authenticated WITH CHECK (true);

-- Document assignments policies
CREATE POLICY "Users can view their assignments" ON document_assignments
  FOR SELECT TO authenticated USING (assigned_to = auth.uid());

CREATE POLICY "Department chairs can view assignments in their department" ON document_assignments
  FOR SELECT TO authenticated USING (
    department_id = (SELECT department_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'department_chair'
  );

CREATE POLICY "Admins can manage assignments" ON document_assignments
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'system_admin')
  );

-- System settings policies
CREATE POLICY "Admins can manage system settings" ON system_settings
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'system_admin')
  );

-- Helper functions
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS user_role
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role user_role;
BEGIN
  SELECT role INTO user_role FROM profiles WHERE id = user_id;
  RETURN user_role;
END;
$$;

CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM profiles WHERE id = user_id AND role = 'system_admin');
END;
$$;

CREATE OR REPLACE FUNCTION can_access_document(user_id UUID, document_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role user_role;
  user_department_id UUID;
  user_college VARCHAR(255);
  doc_record RECORD;
BEGIN
  SELECT role, department_id, college INTO user_role, user_department_id, user_college
  FROM profiles WHERE id = user_id;

  IF user_role = 'system_admin' OR user_role = 'university_registrar' THEN
    RETURN TRUE;
  END IF;

  SELECT * INTO doc_record FROM documents WHERE id = document_id;

  IF user_role = 'student' THEN
    RETURN doc_record.student_id = (SELECT student_id FROM profiles WHERE id = user_id);
  ELSIF user_role = 'department_chair' THEN
    RETURN doc_record.current_department_id = user_department_id;
  ELSIF user_role = 'college_dean' THEN
    RETURN doc_record.college = user_college;
  END IF;

  RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION generate_tracking_number()
RETURNS VARCHAR(50)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  tracking_no VARCHAR(50);
  year INTEGER := EXTRACT(YEAR FROM NOW())::INTEGER;
  random_part VARCHAR(8);
BEGIN
  LOOP
    random_part := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 8));
    tracking_no := 'DT-' || year || '-' || random_part;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM documents WHERE tracking_no = generate_tracking_number.tracking_no);
  END LOOP;
  RETURN tracking_no;
END;
$$;

CREATE OR REPLACE FUNCTION get_workflow_steps(workflow_id UUID)
RETURNS TABLE (
  id UUID,
  step_order INTEGER,
  step_name VARCHAR(255),
  assigned_role user_role,
  assigned_department_id UUID,
  allowed_actions JSONB,
  expected_duration_days INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT ws.id, ws.step_order, ws.step_name, ws.assigned_role, ws.assigned_department_id, ws.allowed_actions, ws.expected_duration_days
  FROM workflow_steps ws
  WHERE ws.workflow_id = get_workflow_steps.workflow_id
  ORDER BY ws.step_order;
END;
$$;

CREATE OR REPLACE FUNCTION transition_document(
  p_document_id UUID,
  p_action document_action,
  p_user_id UUID DEFAULT NULL,
  p_internal_remarks TEXT DEFAULT NULL,
  p_public_remarks TEXT DEFAULT NULL,
  p_destination_department_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_document RECORD;
  v_user_role user_role;
  v_user_department_id UUID;
  v_user_college VARCHAR(255);
  v_current_step RECORD;
  v_next_step RECORD;
  v_new_status document_status;
  v_origin_department_id UUID;
  v_destination_department_id UUID := p_destination_department_id;
  v_allowed_actions JSONB;
  v_can_transition BOOLEAN := FALSE;
  v_acting_user_id UUID;
BEGIN
  -- Determine acting user securely: enforce auth.uid() when called from Supabase Auth
  v_acting_user_id := COALESCE(auth.uid(), p_user_id);
  IF v_acting_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: User authentication required';
  END IF;

  -- Block callers from impersonating another user unless caller is system_admin
  IF auth.uid() IS NOT NULL AND p_user_id IS NOT NULL AND auth.uid() <> p_user_id THEN
    IF NOT is_admin(auth.uid()) THEN
      RAISE EXCEPTION 'Unauthorized: Cannot execute transition on behalf of another user';
    END IF;
    v_acting_user_id := p_user_id;
  END IF;

  -- Get user info
  SELECT role, department_id, college INTO v_user_role, v_user_department_id, v_user_college
  FROM profiles WHERE id = v_acting_user_id;

  -- Get document
  SELECT * INTO v_document FROM documents WHERE id = p_document_id;

  -- Get current workflow step
  SELECT * INTO v_current_step FROM workflow_steps WHERE id = v_document.current_step_id;

  -- Verify user can access this document
  IF NOT can_access_document(v_acting_user_id, p_document_id) THEN
    RAISE EXCEPTION 'Unauthorized: Cannot access this document';
  END IF;

  -- Check if action is allowed for current step
  IF v_current_step.allowed_actions IS NOT NULL THEN
    v_allowed_actions := v_current_step.allowed_actions;
    IF NOT (v_allowed_actions ? p_action::TEXT) THEN
      RAISE EXCEPTION 'Action not allowed at current workflow step';
    END IF;
  END IF;

  -- Determine new status based on action
  CASE p_action
    WHEN 'receive' THEN v_new_status := 'received';
    WHEN 'start_review' THEN v_new_status := 'under_review';
    WHEN 'endorse' THEN v_new_status := 'endorsed';
    WHEN 'forward' THEN v_new_status := 'forwarded';
    WHEN 'return' THEN v_new_status := 'returned';
    WHEN 'request_additional_info' THEN v_new_status := 'additional_info_requested';
    WHEN 'approve' THEN v_new_status := 'approved';
    WHEN 'reject' THEN v_new_status := 'rejected';
    WHEN 'release' THEN v_new_status := 'released';
    WHEN 'archive' THEN v_new_status := 'archived';
    ELSE RAISE EXCEPTION 'Invalid action';
  END CASE;

  -- Validate role permissions for action
  CASE p_action
    WHEN 'receive', 'start_review', 'endorse', 'forward', 'return', 'request_additional_info'
      THEN
      IF v_user_role != 'department_chair' AND v_user_role != 'college_dean' AND v_user_role != 'university_registrar' AND v_user_role != 'system_admin' THEN
        RAISE EXCEPTION 'Insufficient permissions for this action';
      END IF;
    WHEN 'approve', 'reject', 'release'
      THEN
      IF v_user_role != 'college_dean' AND v_user_role != 'university_registrar' AND v_user_role != 'system_admin' THEN
        RAISE EXCEPTION 'Insufficient permissions for this action';
      END IF;
    WHEN 'archive'
      THEN
      IF v_user_role != 'university_registrar' AND v_user_role != 'system_admin' THEN
        RAISE EXCEPTION 'Insufficient permissions for this action';
      END IF;
  END CASE;

  -- Validate department scope
  IF v_user_role = 'department_chair' AND v_document.current_department_id != v_user_department_id THEN
    RAISE EXCEPTION 'Cannot act on documents outside your department';
  END IF;

  IF v_user_role = 'college_dean' AND v_document.college != v_user_college THEN
    RAISE EXCEPTION 'Cannot act on documents outside your college';
  END IF;

  -- Require remarks for return and reject
  IF p_action IN ('return', 'reject') AND (p_internal_remarks IS NULL OR p_internal_remarks = '') THEN
    RAISE EXCEPTION 'Remarks are required for this action';
  END IF;

  -- Get next step
  SELECT * INTO v_next_step
  FROM workflow_steps
  WHERE workflow_id = v_document.workflow_template_id
  AND step_order > COALESCE(v_current_step.step_order, 0)
  ORDER BY step_order
  LIMIT 1;

  -- Update document
  v_origin_department_id := v_document.current_department_id;

  UPDATE documents
  SET
    current_status = v_new_status,
    current_step_id = v_next_step.id,
    current_department_id = COALESCE(v_destination_department_id, v_next_step.assigned_department_id, v_document.current_department_id),
    current_handler_id = v_acting_user_id,
    updated_at = NOW(),
    completed_at = CASE WHEN v_new_status IN ('released', 'archived', 'rejected') THEN NOW() ELSE NULL END
  WHERE id = p_document_id;

  -- Create audit log
  INSERT INTO document_logs (
    document_id,
    action_taken,
    previous_status,
    new_status,
    origin_department_id,
    destination_department_id,
    handled_by,
    internal_remarks,
    public_remarks
  ) VALUES (
    p_document_id,
    p_action,
    v_document.current_status,
    v_new_status,
    v_origin_department_id,
    COALESCE(v_destination_department_id, v_next_step.assigned_department_id),
    v_acting_user_id,
    p_internal_remarks,
    p_public_remarks
  );

  -- Create notifications for relevant users
  IF v_next_step.assigned_role IS NOT NULL THEN
    INSERT INTO notifications (user_id, document_id, title, message)
    SELECT p.id, p_document_id,
      'New Document Assigned',
      'A document (' || v_document.tracking_no || ') has been assigned to you for ' || v_next_step.step_name
    FROM profiles p
    WHERE p.role = v_next_step.assigned_role
    AND (v_next_step.assigned_department_id IS NULL OR p.department_id = v_next_step.assigned_department_id)
    AND p.is_active = true;
  END IF;

  -- Notify student on status changes
  IF p_action IN ('approve', 'reject', 'release', 'return', 'request_additional_info') THEN
    INSERT INTO notifications (user_id, document_id, title, message)
    SELECT p.id, p_document_id,
      'Document Status Update',
      'Your document (' || v_document.tracking_no || ') has been ' || v_new_status || '.'
    FROM profiles p
    WHERE p.student_id = v_document.student_id;
  END IF;

  RETURN TRUE;
END;
$$;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON departments TO anon, authenticated;
GRANT SELECT ON document_types TO anon, authenticated;
GRANT SELECT ON workflow_templates TO anon, authenticated;
GRANT SELECT ON workflow_steps TO anon, authenticated;
GRANT SELECT, INSERT ON documents TO anon, authenticated;
GRANT SELECT, INSERT ON document_logs TO anon, authenticated;
GRANT SELECT, INSERT ON notifications TO authenticated;
GRANT SELECT, INSERT ON document_assignments TO authenticated;
GRANT SELECT ON system_settings TO authenticated;