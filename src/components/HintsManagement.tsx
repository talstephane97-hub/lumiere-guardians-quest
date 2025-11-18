import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Send, Users } from 'lucide-react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Team {
  team_name: string;
  player_count: number;
}

const HintsManagement = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [hintMessage, setHintMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('team_name')
        .not('team_name', 'is', null);

      if (error) throw error;

      // Group by team and count
      const teamCounts = (data || []).reduce((acc: any, { team_name }) => {
        if (team_name) {
          acc[team_name] = (acc[team_name] || 0) + 1;
        }
        return acc;
      }, {});

      const formattedTeams = Object.entries(teamCounts).map(([team_name, count]) => ({
        team_name,
        player_count: count as number
      }));

      setTeams(formattedTeams);
    } catch (error) {
      console.error('Error loading teams:', error);
    }
  };

  const sendHint = async () => {
    if (!hintMessage.trim()) {
      toast({
        title: 'Erreur',
        description: 'Veuillez écrire un message',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      let userIds: string[] = [];

      if (selectedTeam === 'all') {
        // Get all user IDs
        const { data, error } = await supabase
          .from('profiles')
          .select('id');
        
        if (error) throw error;
        userIds = data.map(p => p.id);
      } else {
        // Get user IDs for specific team
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('team_name', selectedTeam);
        
        if (error) throw error;
        userIds = data.map(p => p.id);
      }

      // Insert hint messages for all users
      const messages = userIds.map(user_id => ({
        user_id,
        role: 'assistant',
        content: `📢 Indice de l'organisateur : ${hintMessage}`
      }));

      const { error: insertError } = await supabase
        .from('chat_messages')
        .insert(messages);

      if (insertError) throw insertError;

      toast({
        title: 'Indice envoyé',
        description: `Message envoyé à ${selectedTeam === 'all' ? 'toutes les équipes' : selectedTeam} (${userIds.length} joueur${userIds.length > 1 ? 's' : ''})`
      });

      setHintMessage('');
    } catch (error) {
      console.error('Error sending hint:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'envoyer l\'indice',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Envoyer des Indices
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Destinataire</Label>
            <Select value={selectedTeam} onValueChange={setSelectedTeam}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Toutes les équipes
                  </div>
                </SelectItem>
                {teams.map((team) => (
                  <SelectItem key={team.team_name} value={team.team_name}>
                    {team.team_name} ({team.player_count} joueur{team.player_count > 1 ? 's' : ''})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Message d'indice</Label>
            <Textarea
              value={hintMessage}
              onChange={(e) => setHintMessage(e.target.value)}
              placeholder="Écrivez votre indice ici..."
              rows={4}
            />
          </div>

          <Button 
            onClick={sendHint} 
            disabled={loading || !hintMessage.trim()}
            className="w-full"
          >
            <Send className="w-4 h-4 mr-2" />
            {loading ? 'Envoi...' : 'Envoyer l\'indice'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default HintsManagement;
