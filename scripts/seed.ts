import { createServiceClient } from '@/lib/supabase/service';
import { generateTrackingNumber, generatePublicLookupToken } from '@/lib/utils';

const supabase = createServiceClient();

const departments = [
  {
    department_code: 'CS',
    department_name: 'Department of Computer Science',
    college: 'College of Computer Studies',
    office_location: 'CCS Building, Room 201',
  },
  {
    department_code: 'IT',
    department_name: 'Department of Information Technology',
    college: 'College of Computer Studies',
    office_location: 'CCS Building, Room 202',
  },
  {
    department_code: 'IS',
    department_name: 'Department of Information Systems',
    college: 'College of Computer Studies',
    office_location: 'CCS Building, Room 203',
  },
  {
    department_code: 'MATH',
    department_name: 'Department of Mathematics',
    college: 'College of Science',
    office_location: 'Science Building, Room 101',
  },
  {
    department_code: 'PHYS',
    department_name: 'Department of Physics',
    college: 'College of Science',
    office_location: 'Science Building, Room 102',
  },
];

const documentTypes = [
  {
    type_name: 'Adding of Subjects',
    description: 'Request to add subjects after the enrollment period',
  },
  {
    type_name: 'Dropping of Subjects',
    description: 'Request to drop enrolled subjects within the allowed period',
  },
  {
    type_name: 'Shifting Application',
    description: 'Application to shift to a different program/course',
  },
  {
    type_name: 'Completion of Incomplete (INC) Grades',
    description: 'Request for completion of incomplete grades',
  },
  {
    type_name: 'Removal of Incomplete (INC) Grades',
    description: 'Request for removal of incomplete grades through examination',
  },
  {
    type_name: 'Graduation Clearance',
    description: 'Clearance processing for graduating students',
  },
  {
    type_name: 'Overload Permit',
    description: 'Permit to enroll in more than the maximum allowed units',
  },
];

const users = [
  {
    email: 'student@demo.edu',
    password: 'demo123456',
    full_name: 'Juan Dela Cruz',
    role: 'student',
    student_id: '2021-00123',
    college: 'College of Computer Studies',
    program: 'BS Computer Science',
    year_level: 3,
  },
  {
    email: 'chair@demo.edu',
    password: 'demo123456',
    full_name: 'Dr. Maria Santos',
    role: 'department_chair',
    college: 'College of Computer Studies',
    department_code: 'CS',
  },
  {
    email: 'dean@demo.edu',
    password: 'demo123456',
    full_name: 'Dr. Roberto Reyes',
    role: 'college_dean',
    college: 'College of Computer Studies',
  },
  {
    email: 'registrar@demo.edu',
    password: 'demo123456',
    full_name: 'Ms. Ana Garcia',
    role: 'university_registrar',
    college: 'Office of the University Registrar',
  },
  {
    email: 'admin@demo.edu',
    password: 'demo123456',
    full_name: 'Mr. System Admin',
    role: 'system_admin',
    college: 'Information Technology Services',
  },
];

async function seed() {
  console.log('🌱 Starting database seed...');

  // 1. Create departments
  console.log('Creating departments...');
  const { data: deptData, error: deptError } = await supabase
    .from('departments')
    .upsert(departments, { onConflict: 'department_code' })
    .select();
  if (deptError) throw deptError;
  console.log(`✅ Created ${deptData?.length} departments`);

  // 2. Create document types
  console.log('Creating document types...');
  const { data: docTypeData, error: docTypeError } = await supabase
    .from('document_types')
    .upsert(documentTypes, { onConflict: 'type_name' })
    .select();
  if (docTypeError) throw docTypeError;
  console.log(`✅ Created ${docTypeData?.length} document types`);

  // 3. Create workflow templates and steps
  console.log('Creating workflow templates...');
  const workflowTemplates = [];
  const workflowSteps = [];

  for (const docType of docTypeData || []) {
    const { data: wfData, error: wfError } = await supabase
      .from('workflow_templates')
      .insert({
        name: `${docType.type_name} Workflow`,
        document_type_id: docType.id,
        is_active: true,
        version: 1,
      })
      .select()
      .single();
    if (wfError) throw wfError;
    workflowTemplates.push(wfData);

    // Create workflow steps based on document type
    const steps = getWorkflowSteps(docType.type_name, wfData.id);
    for (const step of steps) {
      const { data: stepData, error: stepError } = await supabase
        .from('workflow_steps')
        .insert(step)
        .select()
        .single();
      if (stepError) throw stepError;
      workflowSteps.push(stepData);
    }

    // Update document type with default workflow
    await supabase
      .from('document_types')
      .update({ default_workflow_id: wfData.id })
      .eq('id', docType.id);
  }
  console.log(`✅ Created ${workflowTemplates.length} workflow templates with steps`);

  // 4. Create users (auth + profiles)
  console.log('Creating users...');
  const deptMap = new Map(deptData?.map(d => [d.department_code, d.id]) || []);
  const createdUsers = [];

  for (const user of users) {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: { full_name: user.full_name },
    });
    if (authError) throw authError;

    // Create profile
    const profileData = {
      id: authData.user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      college: user.college,
      program: user.program,
      year_level: user.year_level,
      student_id: user.student_id,
      department_id: user.department_code ? deptMap.get(user.department_code) : null,
      is_active: true,
    };

    const { error: profileError } = await supabase.from('profiles').upsert(profileData);
    if (profileError) throw profileError;

    createdUsers.push({ ...profileData, id: authData.user.id });
    console.log(`✅ Created user: ${user.email} (${user.role})`);
  }

  // 5. Create sample documents
  console.log('Creating sample documents...');
  const student = createdUsers.find(u => u.role === 'student');
  const chair = createdUsers.find(u => u.role === 'department_chair');
  const dean = createdUsers.find(u => u.role === 'college_dean');
  const registrar = createdUsers.find(u => u.role === 'university_registrar');

  if (student && chair && dean && registrar) {
    const csDeptId = deptMap.get('CS');
    const addingSubjectsType = docTypeData?.find(dt => dt.type_name === 'Adding of Subjects');
    const droppingSubjectsType = docTypeData?.find(dt => dt.type_name === 'Dropping of Subjects');
    const shiftingType = docTypeData?.find(dt => dt.type_name === 'Shifting Application');
    const incCompletionType = docTypeData?.find(dt => dt.type_name === 'Completion of Incomplete (INC) Grades');
    const incRemovalType = docTypeData?.find(dt => dt.type_name === 'Removal of Incomplete (INC) Grades');
    const graduationType = docTypeData?.find(dt => dt.type_name === 'Graduation Clearance');
    const overloadType = docTypeData?.find(dt => dt.type_name === 'Overload Permit');

    const workflowMap = new Map(workflowTemplates.map(wf => [wf.document_type_id, wf.id]));
    const firstStepMap = new Map();
    for (const step of workflowSteps) {
      if (!firstStepMap.has(step.workflow_id) || step.step_order < firstStepMap.get(step.workflow_id)!.step_order) {
        firstStepMap.set(step.workflow_id, step);
      }
    }

    const sampleDocuments = [
      {
        student_id: student.student_id!,
        student_name: student.full_name,
        student_email: student.email,
        college: student.college!,
        department_id: csDeptId!,
        program: student.program!,
        year_level: student.year_level!,
        document_type_id: addingSubjectsType!.id,
        workflow_template_id: workflowMap.get(addingSubjectsType!.id)!,
        current_step_id: firstStepMap.get(workflowMap.get(addingSubjectsType!.id)!)!.id,
        current_status: 'submitted' as const,
      },
      {
        student_id: student.student_id!,
        student_name: student.full_name,
        student_email: student.email,
        college: student.college!,
        department_id: csDeptId!,
        program: student.program!,
        year_level: student.year_level!,
        document_type_id: droppingSubjectsType!.id,
        workflow_template_id: workflowMap.get(droppingSubjectsType!.id)!,
        current_step_id: firstStepMap.get(workflowMap.get(droppingSubjectsType!.id)!)!.id,
        current_status: 'under_review' as const,
      },
      {
        student_id: student.student_id!,
        student_name: student.full_name,
        student_email: student.email,
        college: student.college!,
        department_id: csDeptId!,
        program: student.program!,
        year_level: student.year_level!,
        document_type_id: shiftingType!.id,
        workflow_template_id: workflowMap.get(shiftingType!.id)!,
        current_step_id: firstStepMap.get(workflowMap.get(shiftingType!.id)!)!.id,
        current_status: 'endorsed' as const,
      },
      {
        student_id: student.student_id!,
        student_name: student.full_name,
        student_email: student.email,
        college: student.college!,
        department_id: csDeptId!,
        program: student.program!,
        year_level: student.year_level!,
        document_type_id: incCompletionType!.id,
        workflow_template_id: workflowMap.get(incCompletionType!.id)!,
        current_step_id: firstStepMap.get(workflowMap.get(incCompletionType!.id)!)!.id,
        current_status: 'approved' as const,
      },
      {
        student_id: student.student_id!,
        student_name: student.full_name,
        student_email: student.email,
        college: student.college!,
        department_id: csDeptId!,
        program: student.program!,
        year_level: student.year_level!,
        document_type_id: incRemovalType!.id,
        workflow_template_id: workflowMap.get(incRemovalType!.id)!,
        current_step_id: firstStepMap.get(workflowMap.get(incRemovalType!.id)!)!.id,
        current_status: 'released' as const,
      },
      {
        student_id: student.student_id!,
        student_name: student.full_name,
        student_email: student.email,
        college: student.college!,
        department_id: csDeptId!,
        program: student.program!,
        year_level: student.year_level!,
        document_type_id: graduationType!.id,
        workflow_template_id: workflowMap.get(graduationType!.id)!,
        current_step_id: firstStepMap.get(workflowMap.get(graduationType!.id)!)!.id,
        current_status: 'archived' as const,
      },
      {
        student_id: student.student_id!,
        student_name: student.full_name,
        student_email: student.email,
        college: student.college!,
        department_id: csDeptId!,
        program: student.program!,
        year_level: student.year_level!,
        document_type_id: overloadType!.id,
        workflow_template_id: workflowMap.get(overloadType!.id)!,
        current_step_id: firstStepMap.get(workflowMap.get(overloadType!.id)!)!.id,
        current_status: 'returned' as const,
      },
    ];

    for (let i = 0; i < sampleDocuments.length; i++) {
      const doc = sampleDocuments[i];
      const trackingNo = generateTrackingNumber();
      const lookupToken = generatePublicLookupToken();

      const { data: docData, error: docError } = await supabase
        .from('documents')
        .insert({
          ...doc,
          tracking_no: trackingNo,
          public_lookup_token: lookupToken,
          current_department_id: csDeptId,
          current_handler_id: i > 0 ? chair.id : null,
        })
        .select()
        .single();
      if (docError) throw docError;

      // Create initial log
      await supabase.from('document_logs').insert({
        document_id: docData.id,
        action_taken: 'submit',
        previous_status: null,
        new_status: 'submitted',
        origin_department_id: null,
        destination_department_id: csDeptId,
        handled_by: student.id,
        internal_remarks: 'Document submitted by student',
        public_remarks: 'Document submitted and awaiting department review',
      });

      // Create additional logs for non-submitted documents
      if (doc.current_status !== 'submitted') {
        const statuses = ['received', 'under_review', 'endorsed', 'forwarded', 'approved', 'released', 'returned'];
        const currentIndex = statuses.indexOf(doc.current_status);
        for (let j = 0; j <= currentIndex; j++) {
          const status = statuses[j];
          const action = getActionForStatus(status);
          const handler = j === 0 ? chair.id : (j <= 2 ? chair.id : (j <= 4 ? dean.id : registrar.id));
          
          await supabase.from('document_logs').insert({
            document_id: docData.id,
            action_taken: action,
            previous_status: j === 0 ? 'submitted' : statuses[j - 1],
            new_status: status,
            origin_department_id: j <= 2 ? csDeptId : null,
            destination_department_id: j <= 2 ? csDeptId : null,
            handled_by: handler,
            internal_remarks: `Document ${status.replace('_', ' ')}`,
            public_remarks: `Document ${status.replace('_', ' ')}`,
          });
        }
      }

      console.log(`✅ Created document: ${trackingNo} (${doc.current_status})`);
    }
  }

  // 6. Create system settings
  console.log('Creating system settings...');
  const settings = [
    { setting_key: 'default_processing_days', setting_value: { days: 3 } },
    { setting_key: 'max_overload_units', setting_value: { units: 24 } },
    { setting_key: 'inc_completion_deadline_days', setting_value: { days: 30 } },
    { setting_key: 'shifting_application_period', setting_value: { start: '2024-01-01', end: '2024-12-31' } },
  ];
  await supabase.from('system_settings').upsert(settings, { onConflict: 'setting_key' });
  console.log('✅ Created system settings');

  console.log('🎉 Seed completed successfully!');
  console.log('\n📋 Demo Credentials:');
  console.log('Student: student@demo.edu / demo123456');
  console.log('Department Chair: chair@demo.edu / demo123456');
  console.log('College Dean: dean@demo.edu / demo123456');
  console.log('Registrar: registrar@demo.edu / demo123456');
  console.log('Admin: admin@demo.edu / demo123456');
}

function getWorkflowSteps(docTypeName: string, workflowId: string) {
  const commonSteps = [
    { step_order: 1, step_name: 'Received by Department', assigned_role: 'department_chair' as const, allowed_actions: { receive: true, start_review: true, return: true, request_additional_info: true }, expected_duration_days: 2 },
    { step_order: 2, step_name: 'Under Review', assigned_role: 'department_chair' as const, allowed_actions: { endorse: true, forward: true, return: true, request_additional_info: true }, expected_duration_days: 3 },
    { step_order: 3, step_name: 'Endorsed to College Dean', assigned_role: 'department_chair' as const, allowed_actions: { forward: true }, expected_duration_days: 1 },
    { step_order: 4, step_name: 'Received by College Dean', assigned_role: 'college_dean' as const, allowed_actions: { receive: true, start_review: true, approve: true, reject: true, return: true }, expected_duration_days: 3 },
    { step_order: 5, step_name: 'Dean Action Taken', assigned_role: 'college_dean' as const, allowed_actions: { forward: true, return: true }, expected_duration_days: 1 },
    { step_order: 6, step_name: 'Forwarded to Registrar', assigned_role: 'college_dean' as const, allowed_actions: { forward: true }, expected_duration_days: 1 },
    { step_order: 7, step_name: 'Registrar Final Review', assigned_role: 'university_registrar' as const, allowed_actions: { receive: true, approve: true, reject: true, release: true }, expected_duration_days: 3 },
    { step_order: 8, step_name: 'Released', assigned_role: 'university_registrar' as const, allowed_actions: { release: true, archive: true }, expected_duration_days: 1 },
    { step_order: 9, step_name: 'Archived', assigned_role: 'university_registrar' as const, allowed_actions: { archive: true }, expected_duration_days: 0 },
  ];

  // Customize steps per document type
  if (docTypeName === 'Adding of Subjects' || docTypeName === 'Dropping of Subjects') {
    return commonSteps.slice(0, 5).map(s => ({ ...s, workflow_id: workflowId }));
  }
  if (docTypeName === 'Overload Permit') {
    return commonSteps.slice(0, 6).map(s => ({ ...s, workflow_id: workflowId }));
  }
  if (docTypeName === 'Graduation Clearance') {
    return commonSteps.map(s => ({ ...s, workflow_id: workflowId }));
  }
  return commonSteps.map(s => ({ ...s, workflow_id: workflowId }));
}

function getActionForStatus(status: string): string {
  const map: Record<string, string> = {
    received: 'receive',
    under_review: 'start_review',
    endorsed: 'endorse',
    forwarded: 'forward',
    approved: 'approve',
    released: 'release',
    returned: 'return',
  };
  return map[status] || 'submit';
}

seed().catch(console.error);