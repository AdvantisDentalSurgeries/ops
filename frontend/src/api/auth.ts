import api from '../lib/axios'
import { LoginResponse } from '../types'

export function loginApi(email: string, password: string): Promise<LoginResponse> {
  return api.post<LoginResponse>('/api/auth/login', { email, password }).then((r) => r.data)
}

export function registerApi(body: Record<string, unknown>): Promise<unknown> {
  return api.post('/api/auth/register', body).then((r) => r.data)
}
