import { X } from 'lucide-react';
import { useState } from 'react';

import { Upload } from 'lucide-react';
import { Project } from '../../types';
import { ClientPicker } from '../client/ClientPicker';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { UserPicker } from '../ui/UserPicker';

interface NewProjectModalProps {
  onClose: () => void;
  onSubmit: (project: Partial<Project>, files: File[]) => void;
}

export function NewProjectModal({ onClose, onSubmit }: NewProjectModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [assignee, setAssignee] = useState<string | null>(null);

  const [status, setStatus] = useState<'active' | 'on_hold' | 'completed'>('active');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [team, setTeam] = useState('');
  const [clientId, setClientId] = useState('');
  const [useCaseId, setUseCaseId] = useState('');
  const [files, setFiles] = useState<File[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSubmit({
      name,
      description,
      assignee: assignee || undefined,
      status,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      priority,
      team: team || undefined,
      client_id: clientId || undefined,
      use_case_id: useCaseId || undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, files);

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-6 flex-0">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Nuevo Proyecto</h2>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto flex-1 pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                Nombre del proyecto
              </label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ingresa el nombre del proyecto"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                N° Caso de Uso
              </label>
              <Input
                type="text"
                value={useCaseId}
                onChange={(e) => setUseCaseId(e.target.value)}
                placeholder="Ej: ITC1234567890"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                Cliente
              </label>
              <ClientPicker
                value={clientId}
                onChange={(id) => {
                  setClientId(id);
                }}
                placeholder="Seleccionar cliente"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                Asignado a
              </label>
              <UserPicker
                value={assignee}
                onChange={setAssignee}
                placeholder="Seleccionar responsable"
              />
            </div>

            <Select
              label="Estado"
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              options={[
                { value: 'active', label: 'Activo' },
                { value: 'on_hold', label: 'En espera' },
                { value: 'completed', label: 'Completado' },
              ]}
            />

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Fecha de inicio
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Fecha de fin
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <Select
              label="Prioridad"
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              options={[
                { value: 'low', label: 'Baja' },
                { value: 'medium', label: 'Media' },
                { value: 'high', label: 'Alta' },
              ]}
            />

            <Select
              label="Equipo"
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              options={[
                { value: '', label: 'Seleccionar equipo' },
                { value: 'software', label: 'Desarrollo de software' },
                { value: 'design', label: 'Diseño web' },
                { value: 'soluciones', label: 'Soluciones y servicios' },
                { value: 'marketing', label: 'Marketing' },
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Adjuntar archivo
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-slate-800 border-dashed rounded-lg hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors cursor-pointer relative bg-gray-50/50 dark:bg-slate-800/20">
              <input
                type="file"
                multiple
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                onChange={(e) => {
                  if (e.target.files) {
                    setFiles(Array.from(e.target.files));
                  }
                }}
              />
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400 dark:text-slate-500" />
                <div className="flex text-sm text-gray-600 dark:text-slate-400 justify-center">
                  <span className="relative cursor-pointer bg-white dark:bg-slate-800 rounded-md font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 focus-within:outline-none">
                    Subir un archivo
                  </span>
                  <p className="pl-1">o arrastrar y soltar</p>
                </div>
                <p className="text-xs text-gray-500 dark:text-slate-500">
                  PNG, JPG, PDF hasta 10MB
                </p>
              </div>
            </div>

            {/* Selected Files List */}
            {files.length > 0 && (
              <ul className="mt-4 space-y-2">
                {files.map((file, index) => (
                  <li key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-slate-800/50 rounded-lg text-sm border border-gray-100 dark:border-slate-800">
                    <span className="truncate max-w-[200px] text-gray-700 dark:text-slate-300 font-medium">{file.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 dark:text-slate-500">{(file.size / 1024).toFixed(0)} KB</span>
                      <button
                        type="button"
                        onClick={() => setFiles(prev => prev.filter((_, i) => i !== index))}
                        className="text-gray-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Descripción
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción del proyecto..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
            >
              Crear Proyecto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
