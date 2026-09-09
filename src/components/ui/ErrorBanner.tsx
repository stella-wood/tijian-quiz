export function ErrorBanner({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div role="alert" className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm">
      {message}
    </div>
  );
}
