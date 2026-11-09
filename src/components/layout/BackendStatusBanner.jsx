// BackendStatusBanner is intentionally suppressed in production.
// The banner previously displayed local/cloud storage mode — no longer needed
// since the application always uses Supabase when configured.
export default function BackendStatusBanner() {
  return null;
}
