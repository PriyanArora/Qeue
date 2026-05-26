export function LoadingView({ label = 'Loading' }: { label?: string }) {
  return <div className="status-view" role="status">{label}</div>;
}

export function EmptyView({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="status-view">
      <h2>{title}</h2>
      {detail && <p>{detail}</p>}
    </div>
  );
}

export function ErrorView({ message }: { message: string }) {
  return <div className="status-view error" role="alert">{message}</div>;
}
