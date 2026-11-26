import { generateInitialMockData, MockDB } from "./mockData";

const STORAGE_KEY = "docytrack_local_db_v1";
const SESSION_KEY = "docytrack_local_session";

// Helper to get DB safely in browser or SSR
function getLocalDB(): MockDB {
  if (typeof window === "undefined") {
    return generateInitialMockData();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = generateInitialMockData();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading local DB, resetting to defaults:", err);
    const initial = generateInitialMockData();
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    } catch (_) {}
    return initial;
  }
}

function saveLocalDB(db: MockDB) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (err) {
    console.error("Error saving to localStorage:", err);
  }
}

function getStoredSession() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
}

function setStoredSession(session: any | null) {
  if (typeof window === "undefined") return;
  try {
    if (session) {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      // Also set cookie so Next.js middleware knows the user is logged in
      document.cookie = `${SESSION_KEY}=${encodeURIComponent(JSON.stringify({
        user: session.user,
        profile: session.profile,
      }))}; path=/; max-age=604800; SameSite=Lax`;
    } else {
      window.localStorage.removeItem(SESSION_KEY);
      document.cookie = `${SESSION_KEY}=; path=/; max-age=0; SameSite=Lax`;
    }
  } catch (err) {
    console.error("Error setting session storage/cookie:", err);
  }
}

type AuthCallback = (event: string, session: any) => void;
const authListeners: Set<AuthCallback> = new Set();

function notifyAuthListeners(event: string, session: any) {
  authListeners.forEach((cb) => {
    try {
      cb(event, session);
    } catch (err) {
      console.error("Error in auth listener:", err);
    }
  });
}

class LocalQueryBuilder {
  private tableName: keyof MockDB;
  private selectCols: string = "*";
  private filters: ((row: any) => boolean)[] = [];
  private sorts: { col: string; ascending: boolean }[] = [];
  private limitCount: number | null = null;
  private rangeBounds: { from: number; to: number } | null = null;
  private isSingleRow = false;
  private pendingInsert: any = null;
  private pendingUpdate: any = null;
  private pendingUpsert: any = null;
  private isDelete = false;

  constructor(tableName: keyof MockDB) {
    this.tableName = tableName;
  }

  select(cols: string = "*") {
    this.selectCols = cols;
    return this;
  }

  eq(col: string, val: any) {
    this.filters.push((row) => (val === null ? row[col] == null : row[col] === val));
    return this;
  }

  neq(col: string, val: any) {
    this.filters.push((row) => row[col] !== val);
    return this;
  }

  in(col: string, vals: any[]) {
    this.filters.push((row) => Array.isArray(vals) && vals.includes(row[col]));
    return this;
  }

  like(col: string, pattern: string) {
    const regex = new RegExp(pattern.replace(/%/g, ".*"), "i");
    this.filters.push((row) => regex.test(String(row[col] || "")));
    return this;
  }

  ilike(col: string, pattern: string) {
    return this.like(col, pattern);
  }

  order(col: string, options: { ascending?: boolean } = {}) {
    this.sorts.push({ col, ascending: options.ascending !== false });
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  range(from: number, to: number) {
    this.rangeBounds = { from, to };
    return this;
  }

  single() {
    this.isSingleRow = true;
    return this;
  }

  insert(data: any) {
    this.pendingInsert = data;
    return this;
  }

  update(data: any) {
    this.pendingUpdate = data;
    return this;
  }

  upsert(data: any, _options?: any) {
    this.pendingUpsert = data;
    return this;
  }

  delete() {
    this.isDelete = true;
    return this;
  }

  private expandRow(table: keyof MockDB, row: any, db: MockDB) {
    if (!row) return row;
    const item = { ...row };

    if (table === "documents") {
      if (item.document_type_id) {
        item.document_types = db.document_types.find((dt) => dt.id === item.document_type_id) || null;
      }
      if (item.department_id) {
        item.departments = db.departments.find((d) => d.id === item.department_id) || null;
      }
      if (item.current_department_id) {
        item.current_department = db.departments.find((d) => d.id === item.current_department_id) || null;
      }
      if (item.current_handler_id) {
        item.current_handler = db.profiles.find((p) => p.id === item.current_handler_id) || null;
      }
    } else if (table === "document_logs") {
      if (item.handled_by) {
        item.handled_by_profile = db.profiles.find((p) => p.id === item.handled_by) || null;
      }
      if (item.origin_department_id) {
        item.origin_department = db.departments.find((d) => d.id === item.origin_department_id) || null;
      }
      if (item.destination_department_id) {
        item.destination_department = db.departments.find((d) => d.id === item.destination_department_id) || null;
      }
      if (item.document_id) {
        item.documents = db.documents.find((doc) => doc.id === item.document_id) || null;
      }
    } else if (table === "notifications") {
      if (item.document_id) {
        item.documents = db.documents.find((doc) => doc.id === item.document_id) || null;
      }
    } else if (table === "profiles") {
      if (item.department_id) {
        item.departments = db.departments.find((d) => d.id === item.department_id) || null;
      }
    } else if (table === "document_types") {
      if (item.default_workflow_id) {
        item.workflow_templates = db.workflow_templates.find((w) => w.id === item.default_workflow_id) || null;
      }
    } else if (table === "workflow_templates") {
      if (item.document_type_id) {
        item.document_types = db.document_types.find((dt) => dt.id === item.document_type_id) || null;
      }
      item.workflow_steps = db.workflow_steps
        .filter((s) => s.workflow_id === item.id)
        .sort((a, b) => a.step_order - b.step_order);
    }

    return item;
  }

  async then(resolve: (value: { data: any; error: any; count?: number }) => void, _reject?: any) {
    const db = getLocalDB();
    const rows = (db[this.tableName] as any[]) || [];
    let modified = false;

    // Handle INSERT
    if (this.pendingInsert) {
      const items = Array.isArray(this.pendingInsert) ? this.pendingInsert : [this.pendingInsert];
      const inserted: any[] = [];

      for (const rawItem of items) {
        const newItem = {
          id: rawItem.id || `loc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          created_at: rawItem.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...rawItem,
        };
        rows.push(newItem);
        inserted.push(this.expandRow(this.tableName, newItem, db));
      }
      db[this.tableName] = rows;
      saveLocalDB(db);

      const res = this.isSingleRow ? (inserted[0] || null) : (Array.isArray(this.pendingInsert) ? inserted : inserted[0]);
      resolve({ data: res, error: null, count: inserted.length });
      return;
    }

    // Handle UPSERT
    if (this.pendingUpsert) {
      const items = Array.isArray(this.pendingUpsert) ? this.pendingUpsert : [this.pendingUpsert];
      const upserted: any[] = [];

      for (const item of items) {
        const idx = rows.findIndex((r) => (item.id && r.id === item.id) || (item.setting_key && r.setting_key === item.setting_key) || (item.department_code && r.department_code === item.department_code));
        if (idx >= 0) {
          rows[idx] = { ...rows[idx], ...item, updated_at: new Date().toISOString() };
          upserted.push(this.expandRow(this.tableName, rows[idx], db));
        } else {
          const newItem = {
            id: item.id || `loc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            created_at: new Date().toISOString(),
            ...item,
          };
          rows.push(newItem);
          upserted.push(this.expandRow(this.tableName, newItem, db));
        }
      }
      db[this.tableName] = rows;
      saveLocalDB(db);

      resolve({ data: Array.isArray(this.pendingUpsert) ? upserted : upserted[0], error: null });
      return;
    }

    // Handle UPDATE
    if (this.pendingUpdate) {
      const updated: any[] = [];
      for (let i = 0; i < rows.length; i++) {
        if (this.filters.every((f) => f(rows[i]))) {
          rows[i] = {
            ...rows[i],
            ...this.pendingUpdate,
            updated_at: new Date().toISOString(),
          };
          updated.push(this.expandRow(this.tableName, rows[i], db));
          modified = true;
        }
      }
      if (modified) {
        db[this.tableName] = rows;
        saveLocalDB(db);
      }
      resolve({ data: this.isSingleRow ? (updated[0] || null) : updated, error: null });
      return;
    }

    // Handle DELETE
    if (this.isDelete) {
      const remaining = rows.filter((r) => !this.filters.every((f) => f(r)));
      db[this.tableName] = remaining;
      saveLocalDB(db);
      resolve({ data: null, error: null });
      return;
    }

    // SELECT QUERY
    let result = rows.filter((r) => this.filters.every((f) => f(r)));

    // Sorts
    if (this.sorts.length > 0) {
      result.sort((a, b) => {
        for (const { col, ascending } of this.sorts) {
          const va = a[col] ?? "";
          const vb = b[col] ?? "";
          if (va < vb) return ascending ? -1 : 1;
          if (va > vb) return ascending ? 1 : -1;
        }
        return 0;
      });
    }

    // Range / Limit
    if (this.rangeBounds) {
      result = result.slice(this.rangeBounds.from, this.rangeBounds.to + 1);
    } else if (this.limitCount !== null) {
      result = result.slice(0, this.limitCount);
    }

    // Expand joins
    const expanded = result.map((r) => this.expandRow(this.tableName, r, db));

    if (this.isSingleRow) {
      if (expanded.length === 0) {
        resolve({ data: null, error: { message: "Row not found", code: "PGRST116" }, count: 0 });
      } else {
        resolve({ data: expanded[0], error: null, count: 1 });
      }
    } else {
      resolve({ data: expanded, error: null, count: expanded.length });
    }
  }
}

export function createLocalClient() {
  const currentSession = getStoredSession();

  return {
    auth: {
      async signInWithPassword({ email, password }: { email: string; password?: string }) {
        const db = getLocalDB();
        const normalized = (email || "").trim().toLowerCase();
        const profile = db.profiles.find((p) => p.email.toLowerCase() === normalized);

        if (!profile) {
          return { data: null, error: { message: "Invalid login credentials. User not found in demo database." } };
        }

        const user = {
          id: profile.id,
          email: profile.email,
          user_metadata: { full_name: profile.full_name },
          app_metadata: { role: profile.role },
          aud: "authenticated",
          created_at: profile.created_at,
        };

        const session = {
          access_token: `local-token-${profile.id}`,
          token_type: "bearer",
          expires_in: 604800,
          refresh_token: `local-refresh-${profile.id}`,
          user,
          profile,
        };

        setStoredSession(session);
        notifyAuthListeners("SIGNED_IN", session);
        return { data: { user, session }, error: null };
      },

      async signOut() {
        setStoredSession(null);
        notifyAuthListeners("SIGNED_OUT", null);
        return { error: null };
      },

      async getSession() {
        const session = getStoredSession();
        return { data: { session }, error: null };
      },

      async getUser() {
        const session = getStoredSession();
        return { data: { user: session?.user || null }, error: null };
      },

      onAuthStateChange(callback: AuthCallback) {
        authListeners.add(callback);
        // Call immediately with existing session
        const session = getStoredSession();
        setTimeout(() => {
          callback("INITIAL_SESSION", session);
        }, 0);

        return {
          data: {
            subscription: {
              unsubscribe: () => {
                authListeners.delete(callback);
              },
            },
          },
        };
      },

      async resetPasswordForEmail(_email: string, _options?: any) {
        return { data: {}, error: null };
      },
    },

    from(tableName: keyof MockDB) {
      return new LocalQueryBuilder(tableName);
    },

    async rpc(funcName: string, params: any) {
      if (funcName === "transition_document") {
        const db = getLocalDB();
        const {
          p_document_id,
          p_action,
          p_user_id,
          p_internal_remarks,
          p_public_remarks,
          p_destination_department_id,
        } = params;
        const effectiveUserId = p_user_id || currentSession?.user?.id;

        const doc = db.documents.find((d) => d.id === p_document_id);
        if (!doc) {
          return { data: null, error: { message: "Document not found" } };
        }

        const statusMap: Record<string, string> = {
          receive: "received",
          start_review: "under_review",
          endorse: "endorsed",
          forward: "forwarded",
          return: "returned",
          request_additional_info: "additional_info_requested",
          approve: "approved",
          reject: "rejected",
          release: "released",
          archive: "archived",
        };

        const newStatus = statusMap[p_action] || p_action;

        // Find next workflow step
        const steps = db.workflow_steps
          .filter((s) => s.workflow_id === doc.workflow_template_id)
          .sort((a, b) => a.step_order - b.step_order);

        const currentStep = steps.find((s) => s.id === doc.current_step_id);
        const currentOrder = currentStep?.step_order || 0;
        const nextStep = steps.find((s) => s.step_order > currentOrder) || null;

        const prevStatus = doc.current_status;
        const originDeptId = doc.current_department_id;
        const destinationDeptId = p_destination_department_id || nextStep?.assigned_department_id || originDeptId;

        // Update document
        doc.current_status = newStatus;
        if (nextStep) {
          doc.current_step_id = nextStep.id;
        }
        doc.current_department_id = destinationDeptId;
        doc.current_handler_id = effectiveUserId;
        doc.updated_at = new Date().toISOString();
        if (["released", "archived", "rejected"].includes(newStatus)) {
          doc.completed_at = new Date().toISOString();
        }

        // Add document log
        db.document_logs.push({
          id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          document_id: doc.id,
          action_taken: p_action,
          previous_status: prevStatus,
          new_status: newStatus,
          origin_department_id: originDeptId,
          destination_department_id: destinationDeptId,
          handled_by: effectiveUserId,
          internal_remarks: p_internal_remarks || `Document ${newStatus}`,
          public_remarks: p_public_remarks || `Document status updated to ${newStatus}`,
          created_at: new Date().toISOString(),
        });

        // Add notification for student
        const studentProfile = db.profiles.find((p) => p.email === doc.student_email || p.student_id === doc.student_id);
        if (studentProfile) {
          db.notifications.push({
            id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            user_id: studentProfile.id,
            document_id: doc.id,
            title: `Document ${newStatus.replace("_", " ")}`,
            message: p_public_remarks || `Your request (${doc.tracking_no}) status changed to ${newStatus}.`,
            is_read: false,
            created_at: new Date().toISOString(),
          });
        }

        saveLocalDB(db);
        return { data: true, error: null };
      }

      return { data: null, error: { message: `RPC ${funcName} not implemented in local mode` } };
    },

    channel(_name: string) {
      return {
        on(_event: string, _filter: any, _callback: any) {
          return this;
        },
        subscribe() {
          return {
            unsubscribe() {},
          };
        },
      };
    },

    storage: {
      from(_bucket: string) {
        return {
          async upload(path: string, _file: any) {
            return { data: { path }, error: null };
          },
          getPublicUrl(path: string) {
            return { data: { publicUrl: `/uploads/${path}` } };
          },
        };
      },
    },
  };
}
