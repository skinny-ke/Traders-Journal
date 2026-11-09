export default function EmptyState({ title, description, action, actionLabel, icon }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && (
        <div className="w-16 h-16 rounded-2xl bg-tj-surface flex items-center justify-center mb-5">
          <span className="text-tj-muted">{icon}</span>
        </div>
      )}
      <h3 className="text-lg font-semibold text-tj-primary mb-2">{title}</h3>
      {description && (
        <p className="text-tj-secondary text-sm max-w-xs mb-6 leading-relaxed">{description}</p>
      )}
      {action && actionLabel && (
        <button onClick={action} className="btn-primary px-6 py-2.5">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
