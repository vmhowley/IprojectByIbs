interface TicketsByStatusChartProps {
  stats: {
    todo: number;
    in_progress: number;
    done: number;
    completed: number;
  };
}

export function TicketsByStatusChart({ stats }: TicketsByStatusChartProps) {
  const total = stats.todo + stats.in_progress + stats.done + stats.completed;

  const statusData = [
    { label: 'Por hacer', count: stats.todo, color: 'bg-gray-400', percentage: total > 0 ? (stats.todo / total) * 100 : 0 },
    { label: 'En progreso', count: stats.in_progress, color: 'bg-blue-500', percentage: total > 0 ? (stats.in_progress / total) * 100 : 0 },
    { label: 'Listo', count: stats.done, color: 'bg-green-500', percentage: total > 0 ? (stats.done / total) * 100 : 0 },
    { label: 'Completado', count: stats.completed, color: 'bg-emerald-600', percentage: total > 0 ? (stats.completed / total) * 100 : 0 },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Solicitudes por Estado</h3>

      <div className="mb-6">
        <div className="flex h-8 rounded-lg overflow-hidden">
          {statusData.map((status, index) => (
            status.count > 0 && (
              <div
                key={index}
                className={`${status.color} transition-all`}
                style={{ width: `${status.percentage}%` }}
                title={`${status.label}: ${status.count}`}
              />
            )
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {statusData.map((status, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${status.color}`} />
              <span className="text-sm text-gray-700">{status.label}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-900">{status.count}</span>
              <span className="text-xs text-gray-500 w-12 text-right">
                {status.percentage.toFixed(0)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {total === 0 && (
        <div className="text-center py-8 text-gray-500 text-sm">
          No hay solicitudes registradas
        </div>
      )}
    </div>
  );
}
