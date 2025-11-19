import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, LogOut, Shield } from 'lucide-react';
import KeysInventory from '@/components/KeysInventory';
import MissionsList from '@/components/MissionsList';
import GuardianChatbot from '@/components/GuardianChatbot';
import PlayerScoreDisplay from '@/components/PlayerScoreDisplay';
import type { User } from '@supabase/supabase-js';

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [keysCollected, setKeysCollected] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      setUser(session.user);
      
      // Check if user has admin role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'admin')
        .single();

      setIsAdmin(!!roleData);
      
      await loadKeys(session.user.id);
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          navigate('/auth');
        }
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadKeys = async (userId: string) => {
    const { data, error } = await supabase
      .from('keys_collected')
      .select('key_type')
      .eq('user_id', userId);

    if (!error && data) {
      setKeysCollected(data.map((k) => k.key_type));
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "À bientôt, Gardien",
      description: "La Lumière vous attend pour votre retour.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-primary/20 sticky top-0 z-40 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-primary drop-shadow-[0_0_10px_hsl(43,96%,56%)]" />
            <h1 className="text-2xl font-bold text-primary">Tableau de Gardien</h1>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <Button
                onClick={() => navigate('/admin')}
                variant="outline"
                className="border-primary/50 text-primary hover:bg-primary/10"
              >
                <Shield className="w-4 h-4 mr-2" />
                Admin
              </Button>
            )}
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="border-primary/50 text-primary hover:bg-primary/10"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Keys Inventory */}
          <div className="lg:col-span-1">
            <KeysInventory keys={keysCollected} />
          </div>

          {/* Missions */}
          <div className="lg:col-span-2">
            <MissionsList userId={user?.id || ''} onKeyCollected={(key) => {
              setKeysCollected([...keysCollected, key]);
            }} />
          </div>
        </div>
      </main>

      {/* Chatbot */}
      <GuardianChatbot 
        userId={user?.id || ''}
        userProgress={{
          currentDay: 1,
          keys: keysCollected,
        }}
      />
    </div>
  );
};

export default Dashboard;