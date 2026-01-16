import { AlertCircle, Bell, CreditCard, Mail, Settings, User } from 'lucide-react';
import { useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { SystemSettings } from '../components/settings/SystemSettings';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';

type SettingsTab = 'profile' | 'notifications' | 'system' | 'billing';

export function SettingsPage() {
    const { user, updateProfile } = useAuth();
    const { isPro, plan } = useSubscription();

    const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
    const [loading, setLoading] = useState(false);
    const [profileError, setProfileError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Profile State
    const [profileName, setProfileName] = useState(user?.name || '');


    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            setProfileError(null);
            setSuccessMessage(null);
            await updateProfile({ name: profileName });
            setSuccessMessage('Perfil actualizado correctamente.');
        } catch (err: any) {
            setProfileError(err.message || 'Error actualizando perfil.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-950">
            <PageHeader
                title="Configuraciones"
                subtitle="Gestiona tu perfil, notificaciones y preferencias del sistema."
            />

            <div className="max-w-6xl mx-auto p-8">

                <div className="flex flex-col md:flex-row gap-6">
                    {/* Sidebar Navigation */}
                    <nav className="w-full md:w-64 shrink-0 space-y-1">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'profile'
                                ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400'
                                : 'text-gray-700 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                                }`}
                        >
                            <User size={18} />
                            Mi Perfil
                        </button>
                        <button
                            onClick={() => setActiveTab('notifications')}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'notifications'
                                ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400'
                                : 'text-gray-700 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                                }`}
                        >
                            <Bell size={18} />
                            Notificaciones
                        </button>
                        <button
                            onClick={() => setActiveTab('billing')}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'billing'
                                ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400'
                                : 'text-gray-700 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                                }`}
                        >
                            <CreditCard size={18} />
                            Facturación & Plan
                        </button>
                        <button
                            onClick={() => setActiveTab('system')}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'system'
                                ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400'
                                : 'text-gray-700 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                                }`}
                        >
                            <Settings size={18} />
                            Configuración del Sistema
                        </button>
                    </nav>

                    {/* Main Content Area */}
                    <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 min-h-[500px]">
                        <div className="p-6 border-b border-gray-200 dark:border-slate-800">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                {activeTab === 'profile' && 'Perfil de Usuario'}
                                {activeTab === 'notifications' && 'Preferencias de Notificaciones'}
                                {activeTab === 'billing' && 'Suscripción y Facturación'}
                                {activeTab === 'system' && 'Configuración del Sistema'}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                                {activeTab === 'profile' && 'Gestiona tu información personal y cuenta.'}
                                {activeTab === 'notifications' && 'Elige cómo y cuándo quieres ser notificado.'}
                                {activeTab === 'billing' && 'Detalles de tu plan actual y método de pago.'}
                                {activeTab === 'system' && 'Opciones avanzadas para administradores.'}
                            </p>
                        </div>

                        <div className="p-6">
                            {/* Global Alerts for Profile */}
                            {activeTab === 'profile' && profileError && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
                                    <AlertCircle size={20} />
                                    <span>{profileError}</span>
                                </div>
                            )}
                            {activeTab === 'profile' && successMessage && (
                                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                                    {successMessage}
                                </div>
                            )}

                            {/* PROFILE TAB */}
                            {activeTab === 'profile' && (
                                <form onSubmit={handleUpdateProfile} className="max-w-md space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Nombre Completo</label>
                                        <input
                                            type="text"
                                            value={profileName}
                                            onChange={(e) => setProfileName(e.target.value)}
                                            className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Correo Electrónico</label>
                                        <input
                                            type="email"
                                            value={user?.email}
                                            disabled
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-500 cursor-not-allowed"
                                        />
                                        <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">El correo electrónico no se puede cambiar.</p>
                                    </div>

                                    <div className="pt-4 border-t border-gray-100">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                        >
                                            {loading ? 'Guardando...' : 'Guardar Cambios'}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* NOTIFICATIONS TAB (Mock UI for now) */}
                            {activeTab === 'notifications' && (
                                <div className="space-y-6 max-w-lg">
                                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <Mail className="text-gray-400 dark:text-slate-500" size={20} />
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">Notificaciones por Email</p>
                                                <p className="text-xs text-gray-500 dark:text-slate-400">Recibe actualizaciones importantes en tu correo.</p>
                                            </div>
                                        </div>
                                        <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                                            <input type="checkbox" name="toggle" id="toggle-email" className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 checked:border-green-400" />
                                            <label htmlFor="toggle-email" className="toggle-label block overflow-hidden h-5 rounded-full bg-gray-300 cursor-pointer"></label>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <Bell className="text-gray-400 dark:text-slate-500" size={20} />
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">Notificaciones Push</p>
                                                <p className="text-xs text-gray-500 dark:text-slate-400">Recibe alertas en tu navegador.</p>
                                            </div>
                                        </div>
                                        <button className="text-sm text-indigo-600 font-medium hover:underline">Configurar</button>
                                    </div>
                                    <p className="text-xs text-gray-400 italic">Más opciones próximamente...</p>
                                </div>
                            )}

                            {/* BILLING TAB */}
                            {activeTab === 'billing' && (
                                <div className="space-y-6">
                                    <div className="flex items-start gap-4 p-4 bg-linear-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border border-indigo-100 dark:border-indigo-900/30 rounded-lg">
                                        <div className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-sm">
                                            <CreditCard className="text-indigo-600 dark:text-indigo-400" size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-indigo-900 dark:text-indigo-100">Plan Actual: {plan || 'Gratis'}</h3>
                                            <p className="text-sm text-indigo-700 dark:text-indigo-300 mt-1">
                                                {isPro
                                                    ? 'Tienes acceso a todas las funciones premium.'
                                                    : 'Estás en el plan básico. Actualiza para desbloquear más funciones.'}
                                            </p>
                                            {!isPro && (
                                                <a href="/pricing" className="inline-block mt-3 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
                                                    Actualizar a Pro
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ADMIN TAB */}
                            {activeTab === 'system' && (
                                <SystemSettings />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
