import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ClipboardList, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export function Navigation() {
  const location = useLocation();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    getUserRole();
  }, []);

  async function getUserRole() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('Aucun utilisateur connecté');
        return;
      }

      // Vérifie d'abord si le profil existe
      const { count, error: countError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('id', user.id);

      if (countError) throw countError;

      // Si le profil n'existe pas, on le crée
      if (count === 0) {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            name: user.user_metadata?.name || user.email?.split('@')[0] || 'Admin',
            company: user.user_metadata?.company || 'Administration',
            role: 'parent', // On force le rôle parent pour l'utilisateur existant
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (insertError) throw insertError;
        setUserRole('parent');
        return;
      }

      // Récupère le rôle existant
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setUserRole(data.role);
    } catch (error) {
      console.error('Erreur lors de la récupération du rôle:', error);
      toast.error('Erreur lors de la récupération du profil');
    }
  }

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      toast.error('Erreur lors de la déconnexion');
    }
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex space-x-8">
            <Link
              to="/"
              className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                location.pathname === '/'
                  ? 'border-blue-500 text-gray-900'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              <Home className="w-5 h-5 mr-2" />
              Nouveau SAV
            </Link>

            <Link
              to="/tickets"
              className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                location.pathname === '/tickets'
                  ? 'border-blue-500 text-gray-900'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              <ClipboardList className="w-5 h-5 mr-2" />
              Tickets {userRole === 'enfant' && '(Lecture seule)'}
            </Link>
          </div>

          <div className="flex items-center">
            {userRole && (
              <span className="mr-4 px-3 py-1 rounded-full text-sm font-medium bg-gray-100">
                {userRole === 'parent' ? '👑 Admin' : '👤 Utilisateur'}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}