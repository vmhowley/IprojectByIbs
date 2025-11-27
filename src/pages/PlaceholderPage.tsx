import { useLocation } from 'react-router-dom';

export function PlaceholderPage() {
  const location = useLocation();
  const pageName = location.pathname.split('/').filter(Boolean).join(' / ');

  return (
    <div className="flex-1 flex items-center justify-center bg-white">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          {pageName || 'Página'}
        </h1>
        <p className="text-gray-600">Esta página está en construcción</p>
      </div>
    </div>
  );
}
