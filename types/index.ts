export interface Lawyer {
  id: string;
  email: string;
  full_name: string;
  title: string;
  office_city: string;
  office_country: string;
  timezone: string; // IANA timezone string
  languages: string[];
  bio: string;
  avatar_url: string | null;
  reputation_score: number;
  matters_count: number;
  contributions: number;
  embedding: number[] | null;
  created_at: string;
}

export interface LawyerJurisdiction {
  id: string;
  lawyer_id: string;
  jurisdiction_code: string;
  jurisdiction_name: string;
  expertise_level: 1 | 2 | 3 | 4 | 5;
  matter_types: string[];
  years_experience: number;
}

export interface Matter {
  id: string;
  title: string;
  description: string;
  client_name: string;
  matter_type: string;
  status: "active" | "completed" | "archived";
  lead_lawyer_id: string;
  deadline: string;
  created_at: string;
}

export interface MatterJurisdiction {
  id: string;
  matter_id: string;
  jurisdiction_code: string;
  jurisdiction_name: string;
}

export interface ContextBrief {
  id: string;
  matter_id: string;
  jurisdiction_code: string;
  jurisdiction_name: string;
  legal_landscape: string | null;
  cultural_intelligence: string | null;
  regulatory_notes: string | null;
  status: "generating" | "ready" | "error";
  embedding: number[] | null;
  created_at: string;
}

export interface MatterTeamMember {
  id: string;
  matter_id: string;
  lawyer_id: string;
  role: "lead" | "collaborator" | "reviewer";
  status: "pending" | "accepted" | "declined";
  match_score: number | null;
  joined_at: string;
  lawyer?: Lawyer;
}

export interface Task {
  id: string;
  matter_id: string;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "completed" | "blocked";
  priority: "low" | "medium" | "high" | "urgent";
  assigned_to: string | null;
  required_jurisdiction: string | null;
  required_expertise: string[];
  due_date: string | null;
  handoff_context: string | null;
  handoff_from: string | null;
  timezone_window: string | null;
  created_at: string;
  assignee?: Lawyer;
}

export interface TaskHandoff {
  id: string;
  task_id: string;
  from_lawyer_id: string | null;
  to_lawyer_id: string;
  from_timezone: string | null;
  to_timezone: string;
  context_snapshot: string;
  routed_by: "flow_engine" | "manual";
  created_at: string;
}

export interface FieldNote {
  id: string;
  author_id: string;
  jurisdiction_code: string;
  jurisdiction_name: string;
  title: string;
  content: string;
  matter_type: string | null;
  visibility: "firm" | "private";
  upvotes: number;
  created_at: string;
  author?: Lawyer;
}

export interface ReputationEvent {
  id: string;
  lawyer_id: string;
  event_type:
    | "matter_joined"
    | "brief_generated"
    | "note_contributed"
    | "note_upvoted"
    | "handoff_completed"
    | "match_accepted"
    | "profile_completed"
    | "cross_border_matter";
  points: number;
  matter_id: string | null;
  description: string;
  created_at: string;
}

export interface LawyerAvailability {
  id: string;
  lawyer_id: string;
  day_of_week: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  work_start_hour: number;
  work_end_hour: number;
  timezone: string;
}

// API response types
export interface LawyerMatch {
  lawyer: Lawyer;
  jurisdictions: LawyerJurisdiction[];
  match_score: number;
  similarity_score: number;
}

export interface RouteTaskResult {
  assigned_to: Lawyer;
  handoff: TaskHandoff;
  available_now: boolean;
  next_available_at: string | null;
}
