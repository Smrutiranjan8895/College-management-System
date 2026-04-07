import { FileX } from 'lucide-react';

function EmptyState({ title = 'No data found', message = 'There is nothing to display here yet.' }) {
  return (
    <div className="empty-state">
      <FileX size={64} className="empty-state__icon" />
      <h3 className="empty-state__title">{title}</h3>
      <p className="empty-state__message">{message}</p>
    </div>
  );
}

export default EmptyState;
