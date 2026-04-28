"use client";

import { useState } from "react";
import { Clock, User, AlertCircle, CheckCircle2, Loader2, Circle } from "lucide-react";
import type { Task, Lawyer } from "@/types";

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
}



function Initials({ name }: { name: string }) {
  const parts = name.trim().split(" ");
  return <>{parts.length >= 2 ? `${parts[0][0]}${parts[parts.length - 1][0]}` : name[0]}</>;
}

export default function TaskBoard({ tasks, onRouteTask, routingTaskId, onUpdateStatus }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

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
            {isExpanded && (
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
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
