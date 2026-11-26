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
    submitted: 'bg-blue-100 text-blue-800',
    received: 'bg-indigo-100 text-indigo-800',
    under_review: 'bg-purple-100 text-purple-800',
    endorsed: 'bg-cyan-100 text-cyan-800',
    forwarded: 'bg-teal-100 text-teal-800',
    returned: 'bg-orange-100 text-orange-800',
    additional_info_requested: 'bg-amber-100 text-amber-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    released: 'bg-emerald-100 text-emerald-800',
    archived: 'bg-gray-100 text-gray-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
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