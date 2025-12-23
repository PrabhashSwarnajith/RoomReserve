// No authentication needed - service account handles backend auth
export const apiConfig = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
}

