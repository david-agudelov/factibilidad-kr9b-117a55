type EnvConfig = {
  appName: string
  caseId: string
  locale: string
  units: 'metric'
  enableEcosMode: boolean
  ragEnabled: boolean
  ragEndpoint: string
}

function readEnvFlag(value: string | undefined, fallback: boolean) {
  if (value == null || value.trim() === '') return fallback
  return value.toLowerCase() === 'true'
}

export const envConfig: EnvConfig = {
  appName: import.meta.env.VITE_APP_NAME ?? 'Factibilidad Live Modeler',
  caseId: import.meta.env.VITE_APP_CASE_ID ?? 'KR9B_117A55',
  locale: import.meta.env.VITE_APP_LOCALE ?? 'es-CO',
  units: 'metric',
  enableEcosMode: readEnvFlag(import.meta.env.VITE_ENABLE_ECOS_MODE, true),
  ragEnabled: readEnvFlag(import.meta.env.VITE_RAG_ENABLED, true),
  ragEndpoint: import.meta.env.VITE_RAG_ENDPOINT ?? '/api/normative-chat',
}
