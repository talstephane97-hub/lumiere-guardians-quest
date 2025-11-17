import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';

interface Submission {
  id: string;
  user_id: string;
  mission_id: string;
  photo_url: string | null;
  status: string;
  created_at: string;
  profiles?: {
    email: string;
    team_name: string | null;
  };
}

const AdminValidation = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadSubmissions();
    const channel = supabase.channel('submissions-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'submissions' }, () => loadSubmissions()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const loadSubmissions = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('submissions').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      // Fetch profiles separately
      const userIds = [...new Set(data.map(s => s.user_id))];
      const { data: profiles } = await supabase.from('profiles').select('id, email, team_name').in('id', userIds);
      const profileMap = new Map(profiles?.map(p => [p.id, p]));
      setSubmissions(data.map(s => ({ ...s, profiles: profileMap.get(s.user_id) })) as Submission[]);
    }
    setLoading(false);
  };

  const handleValidation = async (submissionId: string, approved: boolean) => {
    setProcessingId(submissionId);
    try {
      const submission = submissions.find(s => s.id === submissionId);
      await supabase.from('submissions').update({ status: approved ? 'approved' : 'rejected', reviewed_at: new Date().toISOString() }).eq('id', submissionId);
      if (approved && submission) {
        await supabase.from('missions_progress').insert({ user_id: submission.user_id, mission_id: submission.mission_id, day: 1, completed: true, validated_at: new Date().toISOString(), proof_url: submission.photo_url });
      }
      toast({ title: approved ? "Approuvée" : "Rejetée" });
      await loadSubmissions();
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
    setProcessingId(null);
  };

  const renderSubmissions = (status: string) => {
    const filtered = submissions.filter(s => s.status === status);
    if (filtered.length === 0) return <div className="text-center py-12 text-muted-foreground"><Clock className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>Aucune soumission</p></div>;
    return <div className="grid gap-4">{filtered.map((s) => (
      <Card key={s.id} className="p-4"><div className="flex gap-4">{s.photo_url && <img src={s.photo_url} alt="Preuve" className="w-32 h-32 object-cover rounded-lg" />}<div className="flex-1"><h4 className="font-bold">{s.mission_id}</h4><p className="text-sm text-muted-foreground">{s.profiles?.team_name} - {s.profiles?.email}</p><p className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleString('fr-FR')}</p>{status === 'pending' && <div className="flex gap-2 mt-3"><Button onClick={() => handleValidation(s.id, true)} disabled={processingId === s.id} size="sm" className="bg-green-600"><CheckCircle className="w-4 h-4 mr-2" />Approuver</Button><Button onClick={() => handleValidation(s.id, false)} disabled={processingId === s.id} size="sm" variant="destructive"><XCircle className="w-4 h-4 mr-2" />Rejeter</Button></div>}</div></div></Card>
    ))}</div>;
  };

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <Tabs defaultValue="pending"><TabsList className="grid w-full grid-cols-3"><TabsTrigger value="pending">En attente ({submissions.filter(s => s.status === 'pending').length})</TabsTrigger><TabsTrigger value="approved">Approuvées ({submissions.filter(s => s.status === 'approved').length})</TabsTrigger><TabsTrigger value="rejected">Rejetées ({submissions.filter(s => s.status === 'rejected').length})</TabsTrigger></TabsList><TabsContent value="pending" className="mt-6">{renderSubmissions('pending')}</TabsContent><TabsContent value="approved" className="mt-6">{renderSubmissions('approved')}</TabsContent><TabsContent value="rejected" className="mt-6">{renderSubmissions('rejected')}</TabsContent></Tabs>
  );
};

export default AdminValidation;
