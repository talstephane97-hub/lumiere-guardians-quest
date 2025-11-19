import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Coins, TrendingUp, Star, Award } from 'lucide-react';

interface PlayerScore {
  total_points: number;
  keys_points: number;
  regeneration_points: number;
  bonus_points: number;
  euros_value: number;
}

interface Props {
  userId: string;
}

const PlayerScoreDisplay = ({ userId }: Props) => {
  const [score, setScore] = useState<PlayerScore | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadScore();

    // Subscribe to score changes
    const channel = supabase
      .channel('player-score-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'player_scores',
          filter: `user_id=eq.${userId}`
        },
        () => loadScore()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const loadScore = async () => {
    try {
      const { data, error } = await supabase
        .from('player_scores')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      setScore(data || {
        total_points: 0,
        keys_points: 0,
        regeneration_points: 0,
        bonus_points: 0,
        euros_value: 0
      });
    } catch (error) {
      console.error('Error loading score:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !score) {
    return null;
  }

  const progressPercent = Math.min((score.total_points / 800) * 100, 100);

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-card to-card/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="w-5 h-5 text-primary" />
          Votre Score de Gardien
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score total */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            <span className="text-5xl font-bold text-primary">
              {score.total_points}
            </span>
            <span className="text-2xl text-muted-foreground">/ 800</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-lg">
            <Coins className="w-5 h-5 text-secondary" />
            <span className="font-semibold text-secondary">
              {score.euros_value.toFixed(2)} €
            </span>
            <span className="text-sm text-muted-foreground">
              (10 pts = 1 €)
            </span>
          </div>
        </div>

        {/* Barre de progression */}
        <div className="space-y-2">
          <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-xs text-center text-muted-foreground">
            {progressPercent.toFixed(1)}% complété
          </p>
        </div>

        {/* Détails des points */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star className="w-3 h-3 text-primary" />
              <span className="text-xs font-medium">Clés</span>
            </div>
            <p className="text-lg font-bold text-primary">{score.keys_points}</p>
          </div>

          <div className="text-center p-2 rounded-lg bg-muted/50">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="w-3 h-3 text-secondary" />
              <span className="text-xs font-medium">Régén.</span>
            </div>
            <p className="text-lg font-bold text-secondary">{score.regeneration_points}</p>
          </div>

          <div className="text-center p-2 rounded-lg bg-muted/50">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Award className="w-3 h-3 text-accent" />
              <span className="text-xs font-medium">Bonus</span>
            </div>
            <p className="text-lg font-bold text-accent">{score.bonus_points}</p>
          </div>
        </div>

        {/* Message motivant */}
        {score.total_points >= 800 && (
          <Badge className="w-full justify-center py-2 bg-gradient-to-r from-primary to-secondary">
            🎉 Gardien Accompli ! Score Maximum Atteint !
          </Badge>
        )}
      </CardContent>
    </Card>
  );
};

export default PlayerScoreDisplay;
