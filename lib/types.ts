// Shared TypeScript types mirroring the AltiFlow backend schema

export type UserRole = 'Super-Admin' | 'Admin' | 'Client-Admin' | 'Client-User'

export interface User {
  id: string
  username: string
  role: UserRole
  client_id: string | null
  must_change_password: boolean
  created_at: string
  client?: Client | null
}

export interface Client {
  id: string
  name: string
  logo_url?: string
  created_at: string
}

export interface ClientProject {
  id: string
  client_id: string
  name: string
  type: string
  start_date: string
  end_date: string | null
  head: string
  created_by: string
  created_at: string
  updated_at: string
  client_name?: string | null
}

export interface Flight {
  name?: string
  image_count: number
  base_rover?: boolean
  grid_file?: boolean
}

export type JobCategory = 'Stand Count' | 'Uniformity'
export type JobStage = 'Pending' | 'In Progress' | 'Done' | 'Blocked' | 'Cancelled' | 'Yet to Upload'

export interface Job {
  id: string
  project_id: string
  title: string
  description?: string | null
  status: string
  assigned_to: string | null
  created_by: string
  created_at: string
  updated_at: string
  // Advanced schema
  sc_status?: JobStage
  uni_status?: JobStage
  category?: JobCategory
  capture_date?: string
  drone_name?: string
  flight_count?: number
  flights?: Flight[]
  has_logs?: boolean
  comments?: string | null
  // Enriched
  project_name?: string | null
  project_type?: string | null
  client_name?: string | null
  assigned_to_name?: string | null
  created_by_name?: string | null
  comments_log?: JobComment[]
}

export interface JobComment {
  id: string
  job_id: string
  user_id: string | null
  username: string
  stage: string
  comment: string
  created_at: string
}

export interface DashboardStats {
  totals: {
    projects: number
    field_jobs: number
    clients: number
    users: number
    refly: number
  }
  byStatus: Record<string, number>
  bySla: { ok: number; warning: number; breached: number }
  fieldJobsByMonth: Array<{ key: string; label: string; count: number }>
}

export interface AuthState {
  token: string | null
  user: User | null
}
