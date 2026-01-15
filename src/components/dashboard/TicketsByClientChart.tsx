import { useEffect, useState } from 'react';
import { clientService } from '../../services/clientService';

interface ClientStats {
  name: string;
  count: number;
}

interface TicketsByClientChartProps {
  stats: ClientStats[];
}

export function TicketsByClientChart({ stats }: TicketsByClientChartProps) {
  const [clientNames, setClientNames] = useState<Record<string, string>>({});

  const total = stats.reduce((sum, client) => sum + client.count, 0);
  const topClients = stats
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  useEffect(() => {
    const fetchClientNames = async () => {
      const names: Record<string, string> = {};
      const promises = topClients.map(async (clientStats) => {
        // clientStats.name actually holds the ID based on usage in Home.tsx
        try {
          const client = await clientService.getById(clientStats.name);
          names[clientStats.name] = client.name;
        } catch (error) {
          console.error(`Failed to fetch client name for ${clientStats.name}`, error);
          names[clientStats.name] = 'Unknown Client';
        }
      });

      await Promise.all(promises);
      setClientNames(prev => ({ ...prev, ...names }));
    };

    if (topClients.length > 0) {
      fetchClientNames();
    }
  }, [stats]);

  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-orange-500',
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Tickets por Cliente</h3>

      {topClients.length > 0 ? (
        <>
          <div className="mb-6">
            <div className="flex h-8 rounded-lg overflow-hidden">
              {topClients.map((client, index) => (
                <div
                  key={index}
                  className={`${colors[index % colors.length]} transition-all`}
                  style={{ width: `${(client.count / total) * 100}%` }}
                  title={`${clientNames[client.name] || 'Cargando...'}: ${client.count}`}
                />
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {topClients.map((client, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${colors[index % colors.length]}`} />
                  <span className="text-sm text-gray-700 truncate" title={clientNames[client.name] || 'Cargando...'}>
                    {clientNames[client.name] || 'Cargando...'}
                  </span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                  <span className="text-sm font-semibold text-gray-900">{client.count}</span>
                  <span className="text-xs text-gray-500 w-12 text-right">
                    {((client.count / total) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          {stats.length > 8 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                Mostrando top 8 de {stats.length} clientes
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-gray-500 text-sm">
          No hay solicitudes con clientes asignados
        </div>
      )}
    </div>
  );
}
