import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// ─── Types ────────────────────────────────────────────────────────────────

export interface Stats {
  total_traffic: number
  attacks_by_class: Record<string, number>
  alerts_today: number
}

export interface Alert {
  id: number
  timestamp: string
  src_ip: string
  dst_ip: string
  attack_type: string
  confidence: number
  severity: 'High' | 'Medium' | 'Low'
}

export interface AlertsResponse {
  count: number
  alerts: Alert[]
}

export interface Log {
  id: number
  timestamp: string
  src_ip: string
  dst_ip: string
  predicted_class: string
  confidence: number
  is_attack: boolean
  severity: string | null
}

export interface LogsResponse {
  count: number
  logs: Log[]
}

export interface PredictRequest {
  dur: number
  spkts: number
  dpkts: number
  sbytes: number
  dbytes: number
  rate: number
  sttl: number
  dttl: number
  sload: number
  dload: number
  sinpkt: number
  dinpkt: number
  sjit: number
  djit: number
  swin: number
  stcpb: number
  dtcpb: number
  dwin: number
  smean: number
  dmean: number
  ct_srv_src: number
  ct_state_ttl: number
  ct_dst_ltm: number
  ct_src_dport_ltm: number
  ct_dst_sport_ltm: number
  ct_dst_src_ltm: number
  is_ftp_login: number
  ct_ftp_cmd: number
  ct_flw_http_mthd: number
  ct_src_ltm: number
  ct_srv_dst: number
  is_sm_ips_ports: number
  proto: string
  service: string
  state: string
  src_ip?: string
  dst_ip?: string
}

export interface PredictResponse {
  predicted_class: string
  confidence: number
  is_attack: boolean
  severity: string | null
}

export interface UploadResult {
  total_records: number
  processed: number
  errors: number
  attack_counts: Record<string, number>
  results: PredictResponse[]
}

export interface CaptureStatus {
  capturing: boolean
}

// ─── Helper ───────────────────────────────────────────────────────────────

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  const token = localStorage.getItem('access_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/** Clear session and redirect to sign-in on 401. */
function handleUnauthorized(): never {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    window.location.href = '/auth/signin'
  }
  throw new Error('Unauthorized')
}

async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...options?.headers,
    },
    ...options,
  })

  if (response.status === 401) {
    handleUnauthorized()
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(error.detail || error.message || `API error: ${response.status}`)
  }

  return response.json()
}

// ─── Stats ────────────────────────────────────────────────────────────────

export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: () => apiCall<Stats>('/stats'),
    staleTime: 5000,
    refetchInterval: 5000,
  })
}

// ─── Alerts ───────────────────────────────────────────────────────────────

export interface AlertsFilter {
  limit?: number
  severity?: string
}

export function useAlerts(filters?: AlertsFilter) {
  const params = new URLSearchParams()
  if (filters?.limit) params.set('limit', String(filters.limit))
  if (filters?.severity) params.set('severity', filters.severity)
  const qs = params.toString() ? `?${params.toString()}` : ''

  return useQuery({
    queryKey: ['alerts', filters],
    queryFn: () => apiCall<AlertsResponse>(`/alerts${qs}`),
    staleTime: 5000,
    refetchInterval: 5000,
  })
}

// ─── Logs ─────────────────────────────────────────────────────────────────

export interface LogsFilter {
  limit?: number
  from_time?: string
}

export function useLogs(filters?: LogsFilter) {
  const params = new URLSearchParams()
  if (filters?.limit) params.set('limit', String(filters.limit))
  if (filters?.from_time) params.set('from_time', filters.from_time)
  const qs = params.toString() ? `?${params.toString()}` : ''

  return useQuery({
    queryKey: ['logs', filters],
    queryFn: () => apiCall<LogsResponse>(`/logs${qs}`),
    staleTime: 5000,
    refetchInterval: 5000,
  })
}

// ─── Live Logs (fast poll for capture dashboard) ──────────────────────────

export function useLiveLogs(isCapturing: boolean, sessionStart?: string) {
  const params = new URLSearchParams()
  params.set('limit', '200')
  if (sessionStart) params.set('from_time', sessionStart)
  const qs = `?${params.toString()}`

  return useQuery({
    queryKey: ['live-logs', sessionStart],
    queryFn: () => apiCall<LogsResponse>(`/logs${qs}`),
    staleTime: isCapturing ? 2000 : 10000,
    refetchInterval: isCapturing ? 2000 : 10000,
    // Only poll while capturing or while a session is still in view
    enabled: isCapturing || !!sessionStart,
  })
}

// ─── Capture ──────────────────────────────────────────────────────────────

export function useCaptureStatus() {
  return useQuery({
    queryKey: ['capture-status'],
    queryFn: () => apiCall<CaptureStatus>('/capture/status'),
    staleTime: 3000,
    refetchInterval: 3000,
  })
}

export function useStartCapture() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => apiCall<CaptureStatus>('/capture/start', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capture-status'] })
    },
  })
}

export function useStopCapture() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => apiCall<CaptureStatus>('/capture/stop', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capture-status'] })
    },
  })
}

// ─── Predict ──────────────────────────────────────────────────────────────

export function usePredict() {
  return useMutation({
    mutationFn: (data: PredictRequest) =>
      apiCall<PredictResponse>('/predict', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  })
}

// ─── Upload ───────────────────────────────────────────────────────────────

export function useUploadCSV() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      return fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        headers: {
          // Do NOT set Content-Type here — the browser sets it with the correct
          // multipart boundary when using FormData.
          ...getAuthHeaders(),
        },
        body: formData,
      }).then(async (res) => {
        if (res.status === 401) {
          handleUnauthorized()
        }
        if (!res.ok) {
          const err = await res.json().catch(() => ({ detail: 'Upload failed' }))
          throw new Error(err.detail || 'Upload failed')
        }
        return res.json() as Promise<UploadResult>
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
      queryClient.invalidateQueries({ queryKey: ['logs'] })
    },
  })
}

// ─── Admin ────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: number
  full_name: string
  email: string
  is_verified: number
  admin_verified: number
  role: 'user' | 'admin'
  created_at: string
}

export interface AdminUsersResponse {
  count: number
  users: AdminUser[]
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ['admin-users'],
    queryFn: () => apiCall<AdminUsersResponse>('/admin/users'),
    staleTime: 10000,
    refetchInterval: 15000,
  })
}

export function useAdminPendingUsers() {
  return useQuery({
    queryKey: ['admin-users-pending'],
    queryFn: () => apiCall<AdminUsersResponse>('/admin/users/pending'),
    staleTime: 10000,
    refetchInterval: 15000,
  })
}

export function useApproveUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: number) =>
      apiCall<{ message: string }>(`/admin/users/${userId}/approve`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-users-pending'] })
    },
  })
}

export function useRevokeUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: number) =>
      apiCall<{ message: string }>(`/admin/users/${userId}/revoke`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-users-pending'] })
    },
  })
}

// ─── Feedback ─────────────────────────────────────────────────────────────

export type FeedbackCategory = 'bug' | 'suggestion' | 'general'
export type FeedbackStatus = 'open' | 'reviewed' | 'resolved' | 'dismissed'

export interface Feedback {
  id: number
  user_id: number
  title: string
  message: string
  category: FeedbackCategory
  status: FeedbackStatus
  created_at: string
  updated_at: string
}

export interface FeedbacksResponse {
  count: number
  feedbacks: Feedback[]
}

export interface SubmitFeedbackRequest {
  title: string
  message: string
  category?: FeedbackCategory
}

export interface SubmitFeedbackResponse {
  message: string
  feedback: Feedback
}

export interface UpdateFeedbackRequest {
  title?: string
  message?: string
  category?: FeedbackCategory
}

export interface UpdateFeedbackResponse {
  message: string
  feedback: Feedback
}

export interface DeleteFeedbackResponse {
  message: string
}

export interface UpdateFeedbackStatusRequest {
  status: FeedbackStatus
}

export interface UpdateFeedbackStatusResponse {
  message: string
  feedback: Feedback
}

export interface AdminFeedbacksFilter {
  limit?: number
  status?: FeedbackStatus
  category?: FeedbackCategory
}

export function useSubmitFeedback() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: SubmitFeedbackRequest) =>
      apiCall<SubmitFeedbackResponse>('/feedback', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedbacks'] })
    },
  })
}

export function useFeedbacks(limit: number = 100) {
  const params = new URLSearchParams()
  params.set('limit', String(limit))
  const qs = `?${params.toString()}`

  return useQuery({
    queryKey: ['feedbacks', limit],
    queryFn: () => apiCall<FeedbacksResponse>(`/feedback${qs}`),
    staleTime: 5000,
  })
}

export function useUpdateFeedback() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ feedbackId, data }: { feedbackId: number; data: UpdateFeedbackRequest }) =>
      apiCall<UpdateFeedbackResponse>(`/feedback/${feedbackId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedbacks'] })
    },
  })
}

export function useDeleteFeedback() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (feedbackId: number) =>
      apiCall<DeleteFeedbackResponse>(`/feedback/${feedbackId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedbacks'] })
    },
  })
}

export function useAdminFeedbacks(filters?: AdminFeedbacksFilter) {
  const params = new URLSearchParams()
  if (filters?.limit) params.set('limit', String(filters.limit))
  if (filters?.status) params.set('status', filters.status)
  if (filters?.category) params.set('category', filters.category)
  const qs = params.toString() ? `?${params.toString()}` : ''

  return useQuery({
    queryKey: ['admin-feedbacks', filters],
    queryFn: () => apiCall<FeedbacksResponse>(`/admin/feedbacks${qs}`),
    staleTime: 5000,
  })
}

export function useUpdateFeedbackStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      feedbackId,
      status,
    }: {
      feedbackId: number
      status: FeedbackStatus
    }) =>
      apiCall<UpdateFeedbackStatusResponse>(`/admin/feedbacks/${feedbackId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-feedbacks'] })
    },
  })
}
