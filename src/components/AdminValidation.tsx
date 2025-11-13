import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Loader2, ExternalLink } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Submission {
  id: string;
  mission_id: string;
  user_id: string;
  photo_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  profiles: {
    email: string;
    team_name: string | null;
  };
}

const AdminValidation = () => {
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadSubmissions();

    // Subscribe to changes
    const channel = supabase
      .channel('submissions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'submissions',
        },
        () => {
          loadSubmissions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadSubmissions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('submissions')
      .select(`
        id,
        mission_id,
        user_id,
        photo_url,
        status,
        created_at,
        profiles!inner (
          email,
          team_name
        )
      `)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setSubmissions(data as unknown as Submission[]);
    }
    setLoading(false);
  };

  const handleValidation = async (submissionId: string, newStatus: 'approved' | 'rejected') => {
    setProcessingId(submissionId);
    
    try {
      const { error } = await supabase
        .from('submissions')
        .update({
          status: newStatus,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', submissionId);

      if (error) throw error;

      // If approved, complete the mission
      if (newStatus === 'approved') {
        const submission = submissions.find(s => s.id === submissionId);
        if (submission) {
          const { error: progressError } = await supabase
            .from('missions_progress')
            .insert({
              user_id: submission.user_id,
              mission_id: submission.mission_id,
              day: 1,
              completed: true,
              validated_at: new Date().toISOString(),
            });

          if (progressError) {
            console.error('Progress error:', progressError);
          }
        }
      }

      toast({
        title: newStatus === 'approved' ? "Preuve validée ✓" : "Preuve refusée",
        description: newStatus === 'approved' 
          ? "Le Gardien peut continuer son parcours." 
          : "Le Gardien devra soumettre une nouvelle preuve.",
      });

    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const renderSubmissions = (status: 'pending' | 'approved' | 'rejected') => {
    const filtered = submissions.filter(s => s.status === status);

    if (filtered.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          {status === 'pending' ? 'Aucune soumission en attente' : `Aucune soumission ${status === 'approved' ? 'validée' : 'refusée'}`}
        </div>
      );
    }

    return (
      <div className="grid gap-4">
        {filtered.map((submission) => (
          <Card key={submission.id} className="p-4 bg-card border-primary/20">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Photo */}
              {submission.photo_url && (
                <div className="w-full md:w-48 aspect-video rounded-lg overflow-hidden bg-muted">
                  <img 
                    src={submission.photo_url} 
                    alt="Preuve mission"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Info */}
              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-primary">{submission.mission_id}</h3>
                    <p className="text-sm text-muted-foreground">
                      {submission.profiles.team_name || submission.profiles.email}
                    </p>
                  </div>
                  <Badge variant={
                    submission.status === 'approved' ? 'default' : 
                    submission.status === 'rejected' ? 'destructive' : 
                    'outline'
                  }>
                    {submission.status === 'pending' ? 'En attente' : 
                     submission.status === 'approved' ? 'Validé' : 'Refusé'}
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground">
                  Soumis le {new Date(submission.created_at).toLocaleString('fr-FR')}
                </p>

                {submission.photo_url && (
                  <a 
                    href={submission.photo_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-xs text-primary hover:underline"
                  >
                    Voir en plein écran <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                )}

                {/* Actions (only for pending) */}
                {submission.status === 'pending' && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() => handleValidation(submission.id, 'approved')}
                      disabled={processingId === submission.id}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {processingId === submission.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-1" />
                          Valider
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleValidation(submission.id, 'rejected')}
                      disabled={processingId === submission.id}
                    >
                      {processingId === submission.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <X className="w-4 h-4 mr-1" />
                          Refuser
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-primary mb-2">Validation des preuves</h2>
        <p className="text-muted-foreground">
          Validez les photos soumises par les Gardiens
        </p>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">
            En attente ({submissions.filter(s => s.status === 'pending').length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Validées ({submissions.filter(s => s.status === 'approved').length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Refusées ({submissions.filter(s => s.status === 'rejected').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          {renderSubmissions('pending')}
        </TabsContent>

        <TabsContent value="approved" className="mt-6">
          {renderSubmissions('approved')}
        </TabsContent>

        <TabsContent value="rejected" className="mt-6">
          {renderSubmissions('rejected')}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminValidation;
