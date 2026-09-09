export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="text-center py-16 text-gray-500">
      <p className="text-lg mb-2">{title}</p>
      {description && <p className="text-sm">{description}</p>}
    </div>
  );
}
