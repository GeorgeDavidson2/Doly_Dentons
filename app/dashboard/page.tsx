import { redirect } from "next/navigation";
import Link from "next/link";
import { Briefcase, CheckSquare, Award, ArrowRight, Clock, Globe } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import ReputationBadge from "@/components/reputation/ReputationBadge";
import type { Matter, Task, ReputationEvent, Lawyer } from "@/types";

const EVENT_LABELS: Record<ReputationEvent["event_type"], string> = {
  matter_joined:      "Joined a matter",
  brief_generated:    "Generated jurisdiction brief",
  note_contributed:   "Contributed a field note",
  note_upvoted:       "Field note upvoted",
  handoff_completed:  "Completed task handoff",
  match_accepted:     "Accepted as expert match",
  profile_completed:  "Completed profile",
  cross_border_matter:"Led cross-border matter",
};

const TASK_STATUS_STYLES: Record<string, string> = {
  pending:     "bg-gray-100 text-gray-600",
  in_progress: "bg-blue-50 text-blue-700",
  completed:   "bg-green-50 text-green-700",
  blocked:     "bg-red-50 text-red-600",
};

const MATTER_STATUS_STYLES: Record<string, string> = {
  active:    "bg-green-50 text-green-700 border-green-200",
  completed: "bg-blue-50 text-blue-700 border-blue-200",
  archived:  "bg-gray-100 text-gray-500 border-gray-200",
};

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatDeadline(iso: string) {
  const d = new Date(iso);
  const diff = d.getTime() - Date.now();
  const days = Math.ceil(diff / 86_400_000);
  if (days < 0) return { label: "Overdue", urgent: true };
  if (days === 0) return { label: "Due today", urgent: true };
  if (days === 1) return { label: "Due tomorrow", urgent: true };
  return {
    label: `Due ${d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`,
    urgent: days <= 3,
  };
}

export default async function DashboardPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Resolve the lawyer row for the logged-in user
  const { data: lawyerData } = await supabase
    .from("lawyers")
    .select("id, full_name, title, office_city, office_country, reputation_score, matters_count, contributions")
    .eq("email", user.email)
    .single();

  const lawyer = lawyerData as Pick<Lawyer, "id" | "full_name" | "title" | "office_city" | "office_country" | "reputation_score" | "matters_count" | "contributions"> | null;

  // Parallel data fetches — only run lawyer-scoped queries if we have a lawyer row
  const lawyerId = lawyer?.id ?? null;

  const [mattersResult, tasksResult, eventsResult, teamCountResult, activeMattersCountResult, openTasksCountResult] = await Promise.all([
    lawyerId
      ? supabase
          .from("matters")
          .select("id, title, client_name, matter_type, status, deadline, created_at")
          .eq("lead_lawyer_id", lawyerId)
          .in("status", ["active"])
          .order("deadline", { ascending: true })
          .limit(5)
      : Promise.resolve({ data: [], error: null }),

    lawyerId
      ? supabase
          .from("tasks")
          .select("id, title, status, priority, due_date, matter_id")
          .eq("assigned_to", lawyerId)
          .in("status", ["pending", "in_progress", "blocked"])
          .order("due_date", { ascending: true, nullsFirst: false })
          .limit(6)
      : Promise.resolve({ data: [], error: null }),

    lawyerId
      ? supabase
          .from("reputation_events")
          .select("id, event_type, points, description, created_at")
          .eq("lawyer_id", lawyerId)
          .order("created_at", { ascending: false })
          .limit(4)
      : Promise.resolve({ data: [], error: null }),

    lawyerId
      ? supabase
          .from("matter_team")
          .select("matter_id", { count: "exact", head: true })
          .eq("lawyer_id", lawyerId)
      : Promise.resolve({ count: 0, error: null }),

    lawyerId
      ? supabase
          .from("matters")
          .select("id", { count: "exact", head: true })
          .eq("lead_lawyer_id", lawyerId)
          .in("status", ["active"])
      : Promise.resolve({ count: 0, error: null }),

    lawyerId
      ? supabase
          .from("tasks")
          .select("id", { count: "exact", head: true })
          .eq("assigned_to", lawyerId)
          .in("status", ["pending", "in_progress", "blocked"])
      : Promise.resolve({ count: 0, error: null }),
  ]);

  const matters = (mattersResult.data ?? []) as Matter[];
  const tasks = (tasksResult.data ?? []) as Task[];
  const events = (eventsResult.data ?? []) as ReputationEvent[];
  const teamMattersCount = (teamCountResult as { count: number | null }).count ?? 0;
  const activeMattersCount = (activeMattersCountResult as { count: number | null }).count ?? 0;
  const openTasksCount = (openTasksCountResult as { count: number | null }).count ?? 0;

  const stats = [
    {
      label: "Active matters",
      value: activeMattersCount,
      icon: Briefcase,
      href: "/matters",
      color: "text-brand-purple",
      bg: "bg-brand-purple/8",
    },
    {
      label: "Team matters",
      value: teamMattersCount,
      icon: Globe,
      href: "/matters",
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Open tasks",
      value: openTasksCount,
      icon: CheckSquare,
      href: "/matters",
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Reputation",
      value: lawyer?.reputation_score.toLocaleString() ?? "—",
      icon: Award,
      href: "/reputation",
      color: "text-green-600",
      bg: "bg-green-50",
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {lawyer ? `Welcome back, ${lawyer.full_name.split(" ")[0]}` : "Dashboard"}
        </h1>
        {lawyer && (
          <div className="flex items-center gap-3 mt-1">
            <p className="text-sm text-gray-500">{lawyer.title} · {lawyer.office_city}</p>
            <ReputationBadge score={lawyer.reputation_score} />
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, href, color, bg }) => (
          <Link
            key={label}
            href={href}
            className="bg-white border border-brand-grey rounded-xl p-5 hover:shadow-sm transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple/40"
          >
            <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`w-4.5 h-4.5 ${color}`} style={{ width: 18, height: 18 }} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active matters */}
        <div className="lg:col-span-2 bg-white border border-brand-grey rounded-xl">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">Active matters</h2>
            <Link
              href="/matters/new"
              className="text-xs font-medium text-brand-purple hover:text-brand-purple/80 transition-colors"
            >
              + New matter
            </Link>
          </div>

          {matters.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <Briefcase className="w-8 h-8 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No active matters</p>
              <Link
                href="/matters/new"
                className="mt-3 inline-block text-xs font-medium text-brand-purple hover:underline"
              >
                Create your first matter
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {matters.map((matter) => {
                const dl = matter.deadline ? formatDeadline(matter.deadline) : null;
                return (
                  <li key={matter.id}>
                    <Link
                      href={`/matters/${matter.id}/overview`}
                      className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-medium text-gray-900 truncate">{matter.title}</p>
                          <span
                            className={`flex-shrink-0 text-[11px] font-medium px-1.5 py-0.5 rounded-full border ${
                              MATTER_STATUS_STYLES[matter.status] ?? MATTER_STATUS_STYLES.active
                            }`}
                          >
                            {matter.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">
                          {matter.client_name}
                          <span className="mx-1.5">·</span>
                          {matter.matter_type}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                        {dl && (
                          <span
                            className={`text-xs font-medium flex items-center gap-1 ${
                              dl.urgent ? "text-red-500" : "text-gray-400"
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            {dl.label}
                          </span>
                        )}
                        <ArrowRight className="w-3.5 h-3.5 text-gray-300" />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          {matters.length > 0 && (
            <div className="px-6 py-3 border-t border-gray-100">
              <Link
                href="/matters"
                className="text-xs text-gray-400 hover:text-brand-purple transition-colors"
              >
                View all matters →
              </Link>
            </div>
          )}
        </div>

        {/* Right column: tasks + reputation */}
        <div className="flex flex-col gap-6">
          {/* Open tasks */}
          <div className="bg-white border border-brand-grey rounded-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-700">My tasks</h2>
            </div>

            {tasks.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <CheckSquare className="w-7 h-7 text-gray-200 mx-auto mb-2" />
                <p className="text-xs text-gray-400">No open tasks</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {tasks.map((task) => (
                  <li key={task.id} className="px-5 py-3">
                    <div className="flex items-start gap-2">
                      <span
                        className={`mt-0.5 flex-shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                          TASK_STATUS_STYLES[task.status] ?? TASK_STATUS_STYLES.pending
                        }`}
                      >
                        {task.status.replace("_", " ")}
                      </span>
                      <Link
                        href={`/matters/${task.matter_id}/flow`}
                        className="text-xs text-gray-700 hover:text-brand-purple transition-colors leading-relaxed"
                      >
                        {task.title}
                      </Link>
                    </div>
                    {task.due_date && (
                      <p className="text-[11px] text-gray-400 mt-1 ml-0 pl-0">
                        {formatDeadline(task.due_date).label}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Recent reputation activity */}
          <div className="bg-white border border-brand-grey rounded-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-700">Recent activity</h2>
              <Link
                href="/reputation"
                className="text-xs text-gray-400 hover:text-brand-purple transition-colors"
              >
                Leaderboard →
              </Link>
            </div>

            {events.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <Award className="w-7 h-7 text-gray-200 mx-auto mb-2" />
                <p className="text-xs text-gray-400">No recent activity</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {events.map((event) => (
                  <li key={event.id} className="px-5 py-3 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs text-gray-700 truncate">{EVENT_LABELS[event.event_type]}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{formatRelative(event.created_at)}</p>
                    </div>
                    <span className="text-xs font-semibold text-green-600 flex-shrink-0">
                      +{event.points}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
