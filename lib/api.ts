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

async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })

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

export function useLiveLogs(isCapturing: boolean) {
  const params = new URLSearchParams()
  params.set('limit', '100')
  const qs = `?${params.toString()}`

  return useQuery({
    queryKey: ['live-logs'],
    queryFn: () => apiCall<LogsResponse>(`/logs${qs}`),
    staleTime: isCapturing ? 2000 : 10000,
    refetchInterval: isCapturing ? 2000 : 10000,
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
        body: formData,
      }).then(async (res) => {
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
