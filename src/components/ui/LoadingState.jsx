export default function LoadingState({ message = "Loading…" }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-tj-accent border-t-transparent rounded-full mb-4" />
      <p className="text-tj-secondary text-sm">{message}</p>
    </div>
  );
}
