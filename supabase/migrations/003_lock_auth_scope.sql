-- Only authenticated Supabase users may run document transitions. The function
-- still checks p_user_id against auth.uid(), preserving admin impersonation.
REVOKE EXECUTE ON FUNCTION transition_document(UUID, document_action, UUID, TEXT, TEXT, UUID) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION transition_document(UUID, document_action, UUID, TEXT, TEXT, UUID) TO authenticated;

-- Profiles define the ownership and organization scope used by document RLS.
-- Keep those fields immutable to ordinary users while preserving normal edits.
CREATE OR REPLACE FUNCTION prevent_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'system_admin'
  ) AND (
    NEW.role IS DISTINCT FROM OLD.role
    OR NEW.is_active IS DISTINCT FROM OLD.is_active
    OR NEW.student_id IS DISTINCT FROM OLD.student_id
    OR NEW.department_id IS DISTINCT FROM OLD.department_id
    OR NEW.college IS DISTINCT FROM OLD.college
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only system administrators can alter roles, account status, or access scope';
  END IF;
  RETURN NEW;
END;
$$;
