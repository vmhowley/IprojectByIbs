import { Bell, CreditCard, Settings, User } from 'lucide-react';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { SystemSettings } from '../components/settings/SystemSettings';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Tabs, tabPanelProps } from '../components/ui/Tabs';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';
import { errorMessage } from '../utils/errors';

type SettingsTab = 'profile' | 'notifications' | 'system' | 'billing';

const ROLE_LABEL: Record<string, string> = {
    admin: 'Administrador',
    user: 'Miembro del equipo',
    guest: 'Invitado',
    support_agent: 'Agente de soporte',
};

const limitText = (value: number) => (value === Infinity ? 'Sin límite' : String(value));

export function SettingsPage() {
    const { user, updateProfile } = useAuth();
    const { isPro, plan, limits } = useSubscription();
    const [searchParams, setSearchParams] = useSearchParams();

    const canManageSystem = user?.role === 'admin' || user?.role === 'support_agent';
    const requested = searchParams.get('tab') as SettingsTab | null;
    const activeTab: SettingsTab = requested === 'system' && !canManageSystem ? 'profile' : requested || 'profile';

    const [loading, setLoading] = useState(false);
    const [profileError, setProfileError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Profile State
    const [profileName, setProfileName] = useState(user?.name || '');

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profileName.trim()) {
            setProfileError('Escribe tu nombre.');
            return;
        }
        try {
            setLoading(true);
            setProfileError(null);
            setSuccessMessage(null);
            await updateProfile({ name: profileName.trim() });
            setSuccessMessage('Perfil actualizado.');
        } catch (err) {
            setProfileError(errorMessage(err, 'No se pudo actualizar el perfil.'));
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'profile' as const, label: 'Mi perfil', icon: User },
        { id: 'notifications' as const, label: 'Notificaciones', icon: Bell },
        { id: 'billing' as const, label: 'Plan', icon: CreditCard },
        ...(canManageSystem ? [{ id: 'system' as const, label: 'Sistema', icon: Settings }] : []),
    ];

    return (
        <div className="flex min-h-full flex-col">
            <PageHeader
                title="Configuración"
                subtitle={canManageSystem ? 'Tu perfil, tus avisos, el plan y las listas del sistema.' : 'Tu perfil, tus avisos y el plan.'}
                tabs={
                    <Tabs
                        idBase="settings"
                        label="Secciones de configuración"
                        tabs={tabs}
                        active={activeTab}
                        onChange={(id) => setSearchParams(id === 'profile' ? {} : { tab: id }, { replace: true })}
                        className="border-b-0"
                    />
                }
            />

            <div className="px-4 py-6 sm:px-6" {...tabPanelProps('settings', activeTab)}>
                {/* PROFILE TAB */}
                {activeTab === 'profile' && (
                    <div className="grid grid-cols-1 max-w-3xl gap-6 md:grid-cols-[minmax(0,1fr)_14rem]">
                        <form onSubmit={handleUpdateProfile} className="sheet space-y-4 p-5" noValidate>
                            <Input
                                label="Nombre completo"
                                value={profileName}
                                onChange={(e) => {
                                    setProfileName(e.target.value);
                                    setSuccessMessage(null);
                                }}
                                autoComplete="name"
                                error={profileError || undefined}
                            />
                            <Input
                                label="Correo"
                                type="email"
                                value={user?.email || ''}
                                disabled
                                hint="El correo es tu usuario y no se puede cambiar."
                            />
                            <div className="flex items-center gap-3 border-t border-rule pt-4">
                                <Button type="submit" isLoading={loading} disabled={profileName.trim() === (user?.name || '')}>
                                    Guardar cambios
                                </Button>
                                {successMessage && (
                                    <p role="status" className="text-sm font-medium text-st-green">{successMessage}</p>
                                )}
                            </div>
                        </form>

                        <aside className="sheet flex flex-col items-center gap-2 self-start p-5 text-center">
                            <Avatar name={user?.name} src={user?.avatar} size="lg" />
                            <p className="text-sm font-semibold text-ink">{user?.name}</p>
                            <p className="text-xs text-ink-3">{ROLE_LABEL[user?.role || ''] || user?.role}</p>
                        </aside>
                    </div>
                )}

                {/* NOTIFICATIONS TAB */}
                {activeTab === 'notifications' && (
                    <div className="sheet max-w-2xl divide-y divide-rule">
                        <div className="flex items-start justify-between gap-4 p-5">
                            <div>
                                <p className="text-sm font-semibold text-ink">Dentro de ibPulse</p>
                                <p className="mt-0.5 text-[13px] text-ink-2">
                                    Asignaciones, comentarios y menciones llegan a la campana y a tus notificaciones. Siempre activos.
                                </p>
                            </div>
                            <Link to="/inbox" className="shrink-0 text-[13px] font-medium text-ink underline-offset-2 hover:underline">
                                Ver notificaciones
                            </Link>
                        </div>
                        <div className="p-5">
                            <p className="text-sm font-semibold text-ink">Por correo y en el navegador</p>
                            <p className="mt-0.5 text-[13px] text-ink-2">Todavía no están disponibles. Cuando lo estén, se activarán desde aquí.</p>
                        </div>
                    </div>
                )}

                {/* BILLING TAB */}
                {activeTab === 'billing' && (
                    <div className="sheet max-w-2xl">
                        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-rule p-5">
                            <div>
                                <p className="caption">Plan actual</p>
                                <p className="mt-1 text-xl font-semibold text-ink">{plan || 'Gratis'}</p>
                                <p className="mt-1 text-[13px] text-ink-2">
                                    {isPro
                                        ? 'Tienes todas las funciones y sin límites.'
                                        : 'El plan Gratis tiene límites. Pro los quita y suma mensajes y análisis.'}
                                </p>
                            </div>
                            <Link
                                to="/pricing"
                                className="inline-flex h-9 items-center rounded-control border border-rule-strong/70 bg-paper px-3.5 text-sm font-semibold text-ink hover:border-ink hover:bg-well"
                            >
                                {isPro ? 'Ver planes' : 'Pasar a Pro'}
                            </Link>
                        </div>
                        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 p-5 text-sm sm:grid-cols-3">
                            <div>
                                <dt className="caption">Proyectos</dt>
                                <dd className="mt-0.5 tabular-nums text-ink">{limitText(limits.maxProjects)}</dd>
                            </div>
                            <div>
                                <dt className="caption">Clientes</dt>
                                <dd className="mt-0.5 tabular-nums text-ink">{limitText(limits.maxClients)}</dd>
                            </div>
                            <div>
                                <dt className="caption">Miembros por proyecto</dt>
                                <dd className="mt-0.5 tabular-nums text-ink">{limitText(limits.maxMembers)}</dd>
                            </div>
                            <div>
                                <dt className="caption">Mensajes directos</dt>
                                <dd className="mt-0.5 text-ink">{limits.hasChat ? 'Incluidos' : 'No incluidos'}</dd>
                            </div>
                            <div>
                                <dt className="caption">Análisis avanzado</dt>
                                <dd className="mt-0.5 text-ink">{limits.hasAdvancedAnalytics ? 'Incluido' : 'No incluido'}</dd>
                            </div>
                        </dl>
                    </div>
                )}

                {/* ADMIN TAB */}
                {activeTab === 'system' && canManageSystem && (
                    <SystemSettings />
                )}
            </div>
        </div>
    );
}
