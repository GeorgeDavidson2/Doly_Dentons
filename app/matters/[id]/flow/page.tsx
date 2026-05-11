"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Plus, Zap, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import TaskBoard from "./_components/TaskBoard";
import TimezoneTimeline from "./_components/TimezoneTimeline";
import type { Task, Lawyer } from "@/types";

type TaskWithAssignee = Omit<Task, "assignee"> & {
  assignee?: Pick<Lawyer, "id" | "full_name" | "title" | "office_city" | "timezone" | "avatar_url"> | null;
};

interface TeamMember {
  lawyer: Pick<Lawyer, "id" | "full_name" | "office_city" | "timezone">;
  available_now: boolean;
}

interface RouteResult {
  lawyer: { full_name: string; office_city: string } | null;
  message?: string;
}

const PRIORITIES = ["low", "medium", "high", "urgent"] as const;

export default function FlowPage() {
  const { id: matterId } = useParams<{ id: string }>();

  const [tasks, setTasks] = useState<TaskWithAssignee[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [matterJurisdictions, setMatterJurisdictions] = useState<{ jurisdiction_code: string; jurisdiction_name: string }[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [routingTaskId, setRoutingTaskId] = useState<string | null>(null);
  const [routingAll, setRoutingAll] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // New task form
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium" as typeof PRIORITIES[number],
    required_jurisdiction: "",
    due_date: "",
  });

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchTasks = useCallback(async () => {
    const res = await fetch(`/api/flow/tasks?matter_id=${matterId}`);
    if (res.ok) {
      const data = await res.json();
      setTasks(data);
    }
    setLoadingTasks(false);
  }, [matterId]);

  const fetchTeam = useCallback(async () => {
    const res = await fetch(`/api/matters/${matterId}/team`);
    if (res.ok) {
      const data = await res.json();
      const members: TeamMember[] = data
        .filter((m: { status?: string; lawyer?: Pick<Lawyer, "id" | "full_name" | "office_city" | "timezone"> | null }) => m.status === "accepted" && m.lawyer?.timezone)
        .map((m: { lawyer: Pick<Lawyer, "id" | "full_name" | "office_city" | "timezone"> }) => ({
          lawyer: m.lawyer,
          available_now: false, // TimezoneTimeline computes availability visually from the timeline
        }));
      setTeamMembers(members);
    }
  }, [matterId]);

  const fetchMatterJurisdictions = useCallback(async () => {
    const res = await fetch(`/api/matters/${matterId}/jurisdictions`);
    if (res.ok) {
      const data = await res.json();
      setMatterJurisdictions(data ?? []);
    }
  }, [matterId]);

  useEffect(() => {
    fetchTasks();
    fetchTeam();
    fetchMatterJurisdictions();
  }, [fetchTasks, fetchTeam, fetchMatterJurisdictions]);

  const handleRouteTask = async (taskId: string) => {
    setRoutingTaskId(taskId);
    try {
      const res = await fetch("/api/flow/route-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task_id: taskId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Routing failed");

      const result = data as RouteResult;
      if (result.lawyer) {
        showToast("success", `Routed to ${result.lawyer.full_name} (${result.lawyer.office_city})`);
      } else {
        showToast("success", result.message ?? "Task scheduled for next available window");
      }
      await fetchTasks();
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Routing failed");
    } finally {
      setRoutingTaskId(null);
    }
  };

  const handleUpdateStatus = async (taskId: string, status: TaskWithAssignee["status"]) => {
    const prevTask = tasks.find((t) => t.id === taskId);
    if (!prevTask) return;
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status } : t))
    );
    const rollback = () =>
      setTasks((prev) => prev.map((t) => (t.id === taskId ? prevTask : t)));
    try {
      const res = await fetch(`/api/flow/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        rollback();
        showToast("error", "Failed to update task status");
      }
    } catch {
      rollback();
      showToast("error", "Failed to update task status");
    }
  };

  const handleUpdateTask = async (
    taskId: string,
    updates: Partial<Pick<TaskWithAssignee, "title" | "description" | "priority" | "due_date">>
  ): Promise<boolean> => {
    const prevTask = tasks.find((t) => t.id === taskId);
    if (!prevTask) return false;
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t)));
    const rollback = () =>
      setTasks((prev) => prev.map((t) => (t.id === taskId ? prevTask : t)));
    try {
      const res = await fetch(`/api/flow/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        rollback();
        showToast("error", "Failed to update task");
        return false;
      }
      showToast("success", "Task updated");
      return true;
    } catch {
      rollback();
      showToast("error", "Failed to update task");
      return false;
    }
  };

  const handleRouteAll = async () => {
    const unrouted = tasks.filter((t) => t.status === "pending" && !t.assigned_to);
    if (!unrouted.length) return;
    setRoutingAll(true);
    for (const task of unrouted) {
      await handleRouteTask(task.id);
    }
    setRoutingAll(false);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/flow/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matter_id: matterId,
          title: form.title.trim(),
          description: form.description.trim(),
          priority: form.priority,
          required_jurisdiction: form.required_jurisdiction.trim() || null,
          due_date: form.due_date || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to create task");
      setForm({ title: "", description: "", priority: "medium", required_jurisdiction: "", due_date: "" });
      setShowForm(false);
      await fetchTasks();
      showToast("success", "Task created");
    } catch {
      showToast("error", "Could not create task");
    } finally {
      setCreating(false);
    }
  };

  const unroutedCount = tasks.filter((t) => t.status === "pending" && !t.assigned_to).length;

  return (
    <div className="space-y-8">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
            toast.type === "success"
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          )}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Task Flow</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Route work across timezones — tasks are assigned to available lawyers automatically
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {unroutedCount > 0 && (
            <button
              onClick={handleRouteAll}
              disabled={routingAll}
              className="flex items-center gap-2 text-sm font-medium px-4 py-2 bg-brand-purple text-white rounded-lg hover:bg-brand-purple-dark disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              {routingAll ? (
                <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
              ) : (
                <Zap className="w-4 h-4 flex-shrink-0" />
              )}
              Route All ({unroutedCount})
            </button>
          )}
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 text-sm font-medium px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4 flex-shrink-0" />
            Add Task
          </button>
        </div>
      </div>

      {/* Timezone Timeline */}
      {teamMembers.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Team Availability</h3>
          <TimezoneTimeline teamMembers={teamMembers} />
        </div>
      )}

      {/* New task form */}
      {showForm && (
        <div className="bg-white border border-brand-purple/30 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">New Task</h3>
          <form onSubmit={handleCreateTask} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Draft NDAs for Brazilian entity"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-purple/40"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="What needs to be done?"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-purple/40 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Priority</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as typeof PRIORITIES[number] }))}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-purple/40"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Jurisdiction</label>
                <select
                  value={form.required_jurisdiction}
                  onChange={(e) => setForm((f) => ({ ...f, required_jurisdiction: e.target.value }))}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-purple/40 bg-white"
                >
                  <option value="">Any jurisdiction</option>
                  {matterJurisdictions.map((j) => (
                    <option key={j.jurisdiction_code} value={j.jurisdiction_code}>
                      {j.jurisdiction_name} ({j.jurisdiction_code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Due Date</label>
                <input
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-purple/40"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-sm text-gray-500 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="flex items-center gap-2 text-sm font-medium px-4 py-2 bg-brand-purple text-white rounded-lg hover:bg-brand-purple-dark disabled:opacity-50 transition-colors"
              >
                {creating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Create Task
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Task board */}
      {loadingTasks ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <TaskBoard
          tasks={tasks}
          onRouteTask={handleRouteTask}
          routingTaskId={routingTaskId}
          onUpdateStatus={handleUpdateStatus}
          onUpdateTask={handleUpdateTask}
        />
      )}
    </div>
  );
}
