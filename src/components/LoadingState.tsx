interface LoadingStateProps {
  title?: string;
  description?: string;
}

export default function LoadingState({
  title = "Đang tải...",
  description,
}: LoadingStateProps) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 items-center justify-center px-4 py-12">
      <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
        <p className="text-sm font-medium text-slate-800">{title}</p>
        {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      </div>
    </div>
  );
}
