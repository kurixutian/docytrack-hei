import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  });
}

export function formatDateTime(date: string | Date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(date: string | Date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

export function generateTrackingNumber(): string {
  const year = new Date().getFullYear();
  let randomPart = '';
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(5);
    crypto.getRandomValues(bytes);
    randomPart = Array.from(bytes, (b) => b.toString(36).padStart(2, '0'))
      .join('')
      .substring(0, 8)
      .toUpperCase();
  } else {
    randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
  }
  return `DT-${year}-${randomPart}`;
}

export function generatePublicLookupToken(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '').substring(0, 8);
  }
  return Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    submitted: 'bg-primary text-primary-foreground',
    received: 'bg-primary text-primary-foreground',
    under_review: 'bg-muted text-muted-foreground',
    endorsed: 'bg-accent text-accent-foreground',
    forwarded: 'bg-accent text-accent-foreground',
    returned: 'bg-destructive text-destructive-foreground',
    additional_info_requested: 'bg-warning text-warning-foreground',
    approved: 'bg-success text-success-foreground',
    rejected: 'bg-destructive text-destructive-foreground',
    released: 'bg-success text-success-foreground',
    archived: 'bg-muted text-muted-foreground',
  };
  return colors[status] || 'bg-muted text-muted-foreground';
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    submitted: 'Submitted',
    received: 'Received',
    under_review: 'Under Review',
    endorsed: 'Endorsed',
    forwarded: 'Forwarded',
    returned: 'Returned',
    additional_info_requested: 'Additional Info Requested',
    approved: 'Approved',
    rejected: 'Rejected',
    released: 'Released',
    archived: 'Archived',
  };
  return labels[status] || status;
}

export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    student: 'Student',
    department_chair: 'Department Chairperson',
    college_dean: 'College Dean',
    university_registrar: 'University Registrar',
    system_admin: 'System Administrator',
  };
  return labels[role] || role;
}

export function calculateDaysRemaining(dueDate: string | Date): number {
  const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function isOverdue(dueDate: string | Date): boolean {
  return calculateDaysRemaining(dueDate) < 0;
}

export function calculateProcessingDays(submittedAt: string | Date, completedAt?: string | Date | null): number {
  const start = typeof submittedAt === 'string' ? new Date(submittedAt) : submittedAt;
  const end = completedAt ? (typeof completedAt === 'string' ? new Date(completedAt) : completedAt) : new Date();
  const diffMs = end.getTime() - start.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}