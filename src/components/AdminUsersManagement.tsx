import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Shield, Trash2, UserPlus } from 'lucide-react';

interface Admin {
  id: string;
  user_id: string;
  email: string;
  created_at: string;
}

const AdminUsersManagement = () => {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          id,
          user_id,
          created_at,
          profiles!inner(email)
        `)
        .eq('role', 'admin');

      if (error) throw error;

      const formattedAdmins = data.map((admin: any) => ({
        id: admin.id,
        user_id: admin.user_id,
        email: admin.profiles.email,
        created_at: admin.created_at
      }));

      setAdmins(formattedAdmins);
    } catch (error) {
      console.error('Error loading admins:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les admins',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const addAdmin = async () => {
    if (!newAdminEmail.trim()) {
      toast({
        title: 'Erreur',
        description: 'Veuillez entrer un email',
        variant: 'destructive'
      });
      return;
    }

    if (admins.length >= 5) {
      toast({
        title: 'Limite atteinte',
        description: 'Maximum 5 administrateurs autorisés',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Find user by email
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', newAdminEmail.toLowerCase().trim())
        .single();

      if (profileError || !profile) {
        toast({
          title: 'Utilisateur introuvable',
          description: 'Aucun compte avec cet email',
          variant: 'destructive'
        });
        return;
      }

      // Check if already admin
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', profile.id)
        .eq('role', 'admin')
        .single();

      if (existingRole) {
        toast({
          title: 'Déjà admin',
          description: 'Cet utilisateur est déjà administrateur',
          variant: 'destructive'
        });
        return;
      }

      // Add admin role
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({ user_id: profile.id, role: 'admin' });

      if (insertError) throw insertError;

      toast({
        title: 'Admin ajouté',
        description: 'L\'utilisateur est maintenant administrateur'
      });
      
      setNewAdminEmail('');
      loadAdmins();
    } catch (error) {
      console.error('Error adding admin:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'ajouter l\'admin',
        variant: 'destructive'
      });
    }
  };

  const removeAdmin = async (adminId: string, email: string) => {
    if (admins.length <= 1) {
      toast({
        title: 'Impossible',
        description: 'Il doit rester au moins 1 administrateur',
        variant: 'destructive'
      });
      return;
    }

    if (!confirm(`Retirer les droits admin de ${email} ?`)) return;

    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', adminId);

      if (error) throw error;

      toast({
        title: 'Admin retiré',
        description: 'Les droits ont été retirés'
      });
      
      loadAdmins();
    } catch (error) {
      console.error('Error removing admin:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de retirer l\'admin',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Gestion des Administrateurs ({admins.length}/5)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Email de l'utilisateur"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addAdmin()}
            />
            <Button 
              onClick={addAdmin}
              disabled={admins.length >= 5}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Ajouter
            </Button>
          </div>

          <div className="space-y-2">
            {admins.map((admin) => (
              <div
                key={admin.id}
                className="flex items-center justify-between p-3 bg-secondary rounded-lg"
              >
                <div>
                  <p className="font-medium">{admin.email}</p>
                  <p className="text-sm text-muted-foreground">
                    Depuis le {new Date(admin.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAdmin(admin.id, admin.email)}
                  disabled={admins.length <= 1}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUsersManagement;
