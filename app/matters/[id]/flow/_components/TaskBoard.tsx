"use client";

import { useState } from "react";
import { Clock, User, AlertCircle, CheckCircle2, Loader2, Circle, Pencil } from "lucide-react";
import type { Task, Lawyer } from "@/types";

type TaskUpdate = {
  title?: string;
  description?: string;
  priority?: keyof typeof PRIORITY_CONFIG;
  due_date?: string | null;
};

type TaskStatus = "pending" | "in_progress" | "completed" | "blocked";

const STATUS_CONFIG: Record<TaskStatus, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  pending:     { label: "Pending",     icon: Circle,       color: "text-gray-400",        bg: "bg-gray-50" },
  in_progress: { label: "In Progress", icon: Loader2,      color: "text-brand-purple",    bg: "bg-brand-purple/5" },
  completed:   { label: "Completed",   icon: CheckCircle2, color: "text-green-500",        bg: "bg-green-50" },
  blocked:     { label: "Blocked",     icon: AlertCircle,  color: "text-red-500",          bg: "bg-red-50" },
};

const NEXT_STATUS: Record<TaskStatus, TaskStatus> = {
  pending:     "in_progress",
  in_progress: "completed",
  completed:   "pending",
  blocked:     "pending",
};

const STATUS_TOOLTIP: Record<TaskStatus, string> = {
  pending:     "Mark as In Progress",
  in_progress: "Mark as Completed",
  completed:   "Reset to Pending",
  blocked:     "Reset to Pending",
};

const PRIORITY_CONFIG = {
  low:    { label: "Low",    color: "text-gray-400 bg-gray-100" },
  medium: { label: "Medium", color: "text-yellow-600 bg-yellow-50" },
  high:   { label: "High",   color: "text-orange-600 bg-orange-50" },
  urgent: { label: "Urgent", color: "text-red-600 bg-red-50" },
};

type TaskWithAssignee = Omit<Task, "assignee"> & {
  assignee?: Pick<Lawyer, "id" | "full_name" | "title" | "office_city" | "timezone" | "avatar_url"> | null;
};

interface Props {
  tasks: TaskWithAssignee[];
  onRouteTask: (taskId: string) => Promise<void>;
  routingTaskId: string | null;
  onUpdateStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  onUpdateTask: (taskId: string, updates: TaskUpdate) => Promise<boolean>;
}



function Initials({ name }: { name: string }) {
  const parts = name.trim().split(" ");
  return <>{parts.length >= 2 ? `${parts[0][0]}${parts[parts.length - 1][0]}` : name[0]}</>;
}

function EditTaskForm({
  task,
  onCancel,
  onSave,
}: {
  task: TaskWithAssignee;
  onCancel: () => void;
  onSave: (updates: TaskUpdate) => Promise<void>;
}) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [priority, setPriority] = useState<keyof typeof PRIORITY_CONFIG>(
    (task.priority as keyof typeof PRIORITY_CONFIG) ?? "medium"
  );
  const [dueDate, setDueDate] = useState(
    task.due_date ? task.due_date.slice(0, 10) : ""
  );
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || saving) return;
    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        priority,
        due_date: dueDate || null,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3 bg-white rounded-b-xl"
    >
      <div>
        <label className="block text-[11px] font-medium text-gray-500 mb-1">Title *</label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-purple/40"
        />
      </div>
      <div>
        <label className="block text-[11px] font-medium text-gray-500 mb-1">Description</label>
        <textarea
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-purple/40 resize-none"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-medium text-gray-500 mb-1">Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as keyof typeof PRIORITY_CONFIG)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-purple/40 bg-white"
          >
            {(Object.keys(PRIORITY_CONFIG) as (keyof typeof PRIORITY_CONFIG)[]).map((p) => (
              <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-medium text-gray-500 mb-1">Due date</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-purple/40"
          />
        </div>
      </div>
      <div className="flex items-center gap-2 pt-1">
        <button
          type="submit"
          disabled={saving || !title.trim()}
          className="text-xs font-medium px-3 py-1.5 bg-brand-purple text-white rounded-lg hover:bg-brand-purple-dark disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple/50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="text-xs font-medium px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple/40"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function TaskBoard({ tasks, onRouteTask, routingTaskId, onUpdateStatus, onUpdateTask }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function handleStatusClick(taskId: string, nextStatus: TaskStatus) {
    if (updatingStatusId) return;
    setUpdatingStatusId(taskId);
    try {
      await onUpdateStatus(taskId, nextStatus);
    } finally {
      setUpdatingStatusId(null);
    }
  }

  if (!tasks.length) {
    return (
      <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
        <p className="text-sm font-medium text-gray-500">No tasks yet</p>
        <p className="text-xs text-gray-400 mt-1">Add tasks below to start routing work across timezones</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => {
        const status = STATUS_CONFIG[task.status as TaskStatus] ?? STATUS_CONFIG.pending;
        const priority = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG] ?? PRIORITY_CONFIG.medium;
        const StatusIcon = status.icon;
        const isExpanded = expandedId === task.id;
        const isRouting = routingTaskId === task.id;

        return (
          <div
            key={task.id}
            className={`border rounded-xl transition-all ${status.bg} border-gray-200`}
          >
            {/* Header row */}
            <div className="px-4 py-3 flex items-center gap-3">

              {/* Status toggle — separate from expand button */}
              <button
                type="button"
                aria-label={STATUS_TOOLTIP[task.status as TaskStatus]}
                disabled={updatingStatusId === task.id}
                onClick={() => void handleStatusClick(task.id, NEXT_STATUS[task.status as TaskStatus])}
                className="flex-shrink-0 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple/50 hover:opacity-70 disabled:opacity-40 transition-opacity"
              >
                <StatusIcon
                  className={`w-4 h-4 ${status.color} ${task.status === "in_progress" ? "animate-spin" : ""}`}
                />
              </button>

              {/* Expand toggle — title + meta only */}
              <button
                type="button"
                aria-expanded={isExpanded}
                className="flex-1 min-w-0 text-left flex items-center gap-3 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple/50"
                onClick={() => setExpandedId(isExpanded ? null : task.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${priority.color}`}>
                      {priority.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    {task.required_jurisdiction && (
                      <span className="text-[11px] text-brand-purple font-medium">{task.required_jurisdiction}</span>
                    )}
                    {task.assignee ? (
                      <span className="text-[11px] text-gray-500 flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {task.assignee.full_name} · {task.assignee.office_city}
                      </span>
                    ) : (
                      <span className="text-[11px] text-gray-400">Unassigned</span>
                    )}
                    {task.due_date && (
                      <span className="text-[11px] text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(task.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </button>

              {/* Route button — only for pending/unassigned */}
              {(task.status === "pending" || !task.assignee) && (
                <button
                  type="button"
                  onClick={() => void onRouteTask(task.id)}
                  disabled={isRouting}
                  className="flex-shrink-0 text-xs font-medium px-3 py-1.5 bg-brand-purple text-white rounded-lg hover:bg-brand-purple-dark disabled:opacity-50 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple/50 focus-visible:ring-offset-1"
                >
                  {isRouting ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Routing...
                    </span>
                  ) : (
                    "Route"
                  )}
                </button>
              )}
            </div>

            {/* Expanded detail */}
            {isExpanded && editingId !== task.id && (
              <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
                {task.description && (
                  <p className="text-sm text-gray-600">{task.description}</p>
                )}
                {task.required_expertise?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {task.required_expertise.map((e) => (
                      <span key={e} className="text-xs px-2 py-0.5 bg-brand-purple/10 text-brand-purple rounded-full">
                        {e}
                      </span>
                    ))}
                  </div>
                )}
                {task.handoff_context && (
                  <div className="bg-white rounded-lg p-3 border border-gray-100">
                    <p className="text-xs font-medium text-gray-500 mb-1">Handoff context</p>
                    <p className="text-xs text-gray-700 whitespace-pre-line">{task.handoff_context}</p>
                  </div>
                )}
                {task.assignee && (
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-brand-purple/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-semibold text-brand-purple">
                        <Initials name={task.assignee.full_name} />
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-900">{task.assignee.full_name}</p>
                      <p className="text-[11px] text-gray-500">{task.assignee.office_city} · {task.assignee.timezone}</p>
                    </div>
                  </div>
                )}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setEditingId(task.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-brand-purple transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple/40"
                  >
                    <Pencil className="w-3 h-3" />
                    Edit task
                  </button>
                </div>
              </div>
            )}

            {/* Inline edit form */}
            {isExpanded && editingId === task.id && (
              <EditTaskForm
                task={task}
                onCancel={() => setEditingId(null)}
                onSave={async (updates) => {
                  const ok = await onUpdateTask(task.id, updates);
                  if (ok) setEditingId(null);
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
