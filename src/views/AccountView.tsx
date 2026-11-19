import React, { useState } from 'react';
import {
  User,
  LogOut,
  Mail,
  Lock,
  Sun,
  Moon,
  Trash2,
  Bookmark,
  Shield,
  Eye,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Sliders,
  Cpu,
  Database,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useHardware } from '../context/HardwareContext';
import { ActiveTab } from '../components/Navbar';
import { AdminView } from './AdminView';

interface AccountViewProps {
  setActiveTab: (tab: ActiveTab) => void;
}

export const AccountView: React.FC<AccountViewProps> = ({ setActiveTab }) => {
  const {
    user,
    isAdmin,
    isDarkMode,
    toggleDarkMode,
    savedDiagnoses,
    deleteDiagnosis,
    clearAllHistory,
    consentTelemetry,
    setConsentTelemetry,
    isCloudSynced,
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    logout
  } = useAuth();

  const { updateConfig } = useHardware();

  const [profileTab, setProfileTab] = useState<'admin' | 'history' | 'preferences'>(() => {
    return isAdmin ? 'admin' : 'history';
  });
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setLoading(true);
    try {
      if (isRegisterMode) {
        await registerWithEmail(email, password);
      } else {
        await loginWithEmail(email, password);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Error de autenticación');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthError(null);
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.warn('[Auth] Google login error:', err);
      if (err.code === 'auth/popup-blocked') {
        setAuthError('El navegador bloqueó la ventana emergente de Google. Habilita las ventanas emergentes en tu navegador o inicia sesión directamente con Correo y Contraseña.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setAuthError('El dominio actual de la app no está en los dominios autorizados de Firebase Console. Puedes ingresar inmediatamente registrándote con Correo y Contraseña.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setAuthError('Se cerró la ventana de Google antes de finalizar el inicio de sesión.');
      } else if (err.message?.includes('400') || err.message?.includes('401') || err.message?.includes('malformed')) {
        setAuthError('Error de solicitud malformada (400/401 de Google). Esto ocurre por cookies corruptas de Google en el navegador. Borra las cookies del navegador o regístrate con Correo y Contraseña abajo.');
      } else {
        setAuthError(err.message || 'Error al iniciar con Google. Te recomendamos usar Correo y Contraseña.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSaved = (item: typeof savedDiagnoses[0]) => {
    updateConfig(item.config);
    setActiveTab('pc-diag');
  };

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6 pt-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
          <User className="w-4 h-4 text-cyan-400" /> {user ? (isAdmin ? 'MÓDULO DE ADMINISTRADOR' : 'MÓDULO DE USUARIO') : 'MÓDULO DE USUARIO & CONFIGURACIÓN'}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              {user ? (isAdmin ? 'Mi Perfil de Administrador' : 'Mi Perfil de Usuario') : 'Mi Cuenta & Historial de Diagnósticos'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {user
                ? (isAdmin
                    ? 'Sesión administrativa activa. Gestión de base de datos en caliente, métricas y telemetría.'
                    : 'Sesión activa. Historial sincronizado y acceso al apartado de administración.')
                : 'Inicia sesión para sincronizar tus diagnósticos y acceder al Apartado de Administración.'}
            </p>
          </div>

          {user && (
            <div className="flex items-center gap-2">
              {isAdmin ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Rol: Administrador</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-800/80 border border-slate-700 text-slate-300">
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Rol: Usuario</span>
                </span>
              )}
              <button
                id="account-logout-header-btn"
                onClick={() => logout()}
                className="px-3.5 py-1.5 rounded-xl bg-[#1C222D] hover:bg-rose-950/40 hover:text-rose-300 hover:border-rose-800/60 border border-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* When user is logged in: Show Profile Tabs including Apartado de Admin */}
      {user ? (
        <div className="space-y-6">
          {/* User Info Bar */}
          <div className="p-4 bg-[#151921] border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-cyan-500/20 shrink-0">
                {user.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">
                    {user.displayName || user.email?.split('@')[0]}
                  </h3>
                  <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded border ${
                    isAdmin
                      ? 'bg-emerald-950/80 border-emerald-800/80 text-emerald-300'
                      : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}>
                    {isAdmin ? 'Admin' : 'Usuario'}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{user.email}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="px-3 py-1 rounded-xl bg-[#1C222D] border border-slate-700 text-slate-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sincronización Firestore Activa</span>
              </div>
            </div>
          </div>

          {/* Profile Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-2 p-1.5 bg-[#151921] border border-slate-800 rounded-2xl">
            <button
              id="profile-tab-history-btn"
              onClick={() => setProfileTab('history')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                profileTab === 'history'
                  ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-lg shadow-cyan-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-[#1C222D]'
              }`}
            >
              <Bookmark className="w-4 h-4 text-cyan-300" />
              <span>Diagnósticos Guardados</span>
              <span className="px-1.5 py-0.5 text-[9px] rounded-full bg-slate-800 text-slate-300 font-bold">
                {savedDiagnoses.length}
              </span>
            </button>

            <button
              id="profile-tab-admin-btn"
              onClick={() => setProfileTab('admin')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                profileTab === 'admin'
                  ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-lg shadow-cyan-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-[#1C222D]'
              }`}
            >
              <Shield className="w-4 h-4 text-cyan-300" />
              <span>Apartado de Admin</span>
              {isAdmin ? (
                <span className="px-1.5 py-0.5 text-[9px] rounded-full bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 font-bold">
                  Activo
                </span>
              ) : (
                <span className="px-1.5 py-0.5 text-[9px] rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold">
                  Protegido
                </span>
              )}
            </button>

            <button
              id="profile-tab-preferences-btn"
              onClick={() => setProfileTab('preferences')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                profileTab === 'preferences'
                  ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-lg shadow-cyan-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-[#1C222D]'
              }`}
            >
              <Sliders className="w-4 h-4 text-cyan-300" />
              <span>Preferencias & Privacidad</span>
            </button>
          </div>

          {/* TAB 1: Panel de Administración */}
          {profileTab === 'admin' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <AdminView embedded={true} />
            </div>
          )}

          {/* TAB 2: Diagnósticos Guardados */}
          {profileTab === 'history' && (
            <div className="bg-[#151921] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Bookmark className="w-4 h-4 text-cyan-400" /> DIAGNÓSTICOS GUARDADOS EN LA NUBE ({savedDiagnoses.length})
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Sincronizados en tiempo real en tu colección personal de Firestore.
                  </p>
                </div>

                {savedDiagnoses.length > 0 && (
                  <button
                    onClick={clearAllHistory}
                    className="text-xs font-bold uppercase text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Limpiar Todo
                  </button>
                )}
              </div>

              {savedDiagnoses.length === 0 ? (
                <div className="text-center py-12 text-slate-500 space-y-2">
                  <Sparkles className="w-8 h-8 mx-auto text-slate-600" />
                  <p className="text-xs">No tienes diagnósticos guardados aún.</p>
                  <button
                    onClick={() => setActiveTab('pc-diag')}
                    className="text-xs font-bold text-cyan-400 hover:underline cursor-pointer uppercase tracking-wider"
                  >
                    Realizar un diagnóstico en el simulador
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[650px] overflow-y-auto pr-1">
                  {savedDiagnoses.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 bg-[#1C222D] rounded-xl border border-slate-700 hover:border-cyan-500/40 transition-all flex flex-col justify-between gap-3"
                    >
                      <div>
                        <div className="text-xs font-bold text-white">{item.title}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                          {item.createdAt} • {item.config.resolution.toUpperCase()} • {item.result.bottleneckPct}% Bottleneck ({item.result.limitingFactor})
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-700/60">
                        <button
                          onClick={() => handleLoadSaved(item)}
                          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1 shadow-sm"
                        >
                          <span>Cargar en PC Diag</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>

                        <button
                          onClick={() => deleteDiagnosis(item.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-[#151921] cursor-pointer"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Preferencias */}
          {profileTab === 'preferences' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-200">
              <div className="bg-[#151921] border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-400" /> TEMA DE LA INTERFAZ
                </h4>
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#1C222D] border border-slate-700/80">
                  <div>
                    <div className="text-xs font-bold text-white">Tema Visual</div>
                    <div className="text-[10px] text-slate-400">{isDarkMode ? 'Modo Oscuro Activo' : 'Modo Claro Activo'}</div>
                  </div>
                  <button
                    id="account-theme-toggle-btn"
                    onClick={toggleDarkMode}
                    className="p-2 rounded-lg bg-[#151921] border border-slate-700 text-cyan-500 hover:bg-slate-700/40 cursor-pointer transition-colors"
                    title={isDarkMode ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
                    aria-label={isDarkMode ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
                  >
                    {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-cyan-600" />}
                  </button>
                </div>
              </div>

              <div className="bg-[#151921] border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-cyan-400" /> TELEMETRÍA ANÓNIMA
                </h4>
                <div className="p-3.5 rounded-xl bg-[#1C222D] border border-slate-700/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Consentimiento de Telemetría</span>
                    <input
                      type="checkbox"
                      checked={consentTelemetry}
                      onChange={(e) => setConsentTelemetry(e.target.checked)}
                      className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Permite registrar consultas anónimas de hardware para nutrir las métricas del panel de administración y estadísticas globales.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* When NOT logged in: show Login/Register and local history. NO admin panel! */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Auth & UI Preferences */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#151921] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  {isRegisterMode ? 'Crear Cuenta' : 'Iniciar Sesión'}
                </h3>
                <span className="text-[10px] uppercase font-bold text-cyan-400">Acceso a Cuenta</span>
              </div>

              <p className="text-xs text-slate-400">
                Inicia sesión para sincronizar tus diagnósticos y desbloquear el <strong>Panel de Administración</strong> en tu perfil.
              </p>

              {authError && (
                <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300">
                  {authError}
                </div>
              )}

              <form onSubmit={handleEmailAuth} className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">CORREO ELECTRÓNICO</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="usuario@ejemplo.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#1C222D] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">CONTRASEÑA</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#1C222D] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-cyan-500/20 mt-2"
                >
                  {loading ? 'Procesando...' : (isRegisterMode ? 'Registrarme' : 'Entrar')}
                </button>
              </form>

              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full py-2.5 rounded-xl bg-[#1C222D] hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Continuar con Google</span>
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterMode(!isRegisterMode)}
                  className="text-xs text-slate-400 hover:text-cyan-300 cursor-pointer"
                >
                  {isRegisterMode ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate aquí'}
                </button>
              </div>
            </div>

            {/* UI Preferences Card */}
            <div className="bg-[#151921] border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" /> PREFERENCIAS DE LA INTERFAZ
              </h4>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#1C222D] border border-slate-700/80">
                <div>
                  <div className="text-xs font-bold text-white">Tema Visual</div>
                  <div className="text-[10px] text-slate-400">{isDarkMode ? 'Modo Oscuro Activo' : 'Modo Claro Activo'}</div>
                </div>
                <button
                  id="account-theme-toggle-btn"
                  onClick={toggleDarkMode}
                  className="p-2 rounded-lg bg-[#151921] border border-slate-700 text-cyan-500 hover:bg-slate-700/40 cursor-pointer transition-colors"
                  title={isDarkMode ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
                  aria-label={isDarkMode ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
                >
                  {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-cyan-600" />}
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-[#1C222D] border border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-white">Consentimiento de Telemetría</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={consentTelemetry}
                    onChange={(e) => setConsentTelemetry(e.target.checked)}
                    className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Permite registrar tus búsquedas de forma 100% anónima para construir estadísticas globales y análisis de tendencias.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Local Saved Diagnoses */}
          <div className="lg:col-span-7 bg-[#151921] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-cyan-400" /> DIAGNÓSTICOS GUARDADOS ({savedDiagnoses.length})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Historial guardado localmente en tu navegador
                </p>
              </div>

              {savedDiagnoses.length > 0 && (
                <button
                  onClick={clearAllHistory}
                  className="text-xs font-bold uppercase text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Limpiar Todo
                </button>
              )}
            </div>

            {savedDiagnoses.length === 0 ? (
              <div className="text-center py-12 text-slate-500 space-y-2">
                <Sparkles className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-xs">No tienes diagnósticos guardados aún.</p>
                <button
                  onClick={() => setActiveTab('pc-diag')}
                  className="text-xs font-bold text-cyan-400 hover:underline cursor-pointer uppercase tracking-wider"
                >
                  Realizar mi primer diagnóstico ahora
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {savedDiagnoses.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-[#1C222D] rounded-xl border border-slate-700 hover:border-cyan-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-xs font-bold text-white">{item.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                        {item.createdAt} • {item.config.resolution.toUpperCase()} • {item.result.bottleneckPct}% Bottleneck ({item.result.limitingFactor})
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleLoadSaved(item)}
                        className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1 shadow-sm"
                      >
                        <span>Cargar</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>

                      <button
                        onClick={() => deleteDiagnosis(item.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-[#151921] cursor-pointer"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
