-- Public tracking is keyed by the unguessable tracking number. Keep its data
-- surface limited to progress details; authenticated policies remain unchanged.
REVOKE SELECT ON documents FROM anon;
GRANT SELECT (
  id, tracking_no, document_type_id, current_status, current_department_id,
  workflow_template_id, current_step_id, submitted_at, updated_at, completed_at
) ON documents TO anon;

CREATE POLICY "Public can view document types for tracking" ON document_types
  FOR SELECT TO anon USING (true);
GRANT SELECT (id, type_name, description) ON document_types TO anon;

CREATE POLICY "Public can view workflow step labels" ON workflow_steps
  FOR SELECT TO anon USING (true);
REVOKE SELECT ON workflow_steps FROM anon;
GRANT SELECT (id, workflow_id, step_order, step_name) ON workflow_steps TO anon;

CREATE POLICY "Public can view department names for tracking" ON departments
  FOR SELECT TO anon USING (true);
GRANT SELECT (id, department_name) ON departments TO anon;

-- This older SECURITY DEFINER RPC returns whole document rows and is not used
-- by the app. Prevent it from bypassing the restricted public column grants.
REVOKE EXECUTE ON FUNCTION get_document_for_tracking(VARCHAR) FROM PUBLIC, anon;
