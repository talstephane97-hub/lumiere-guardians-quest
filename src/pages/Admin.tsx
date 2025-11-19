// src/pages/Admin.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Shield,
  Sparkles,
  ArrowLeft,
  Check,
  X,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

// Types issus des types Supabase
type SubmissionRow = Database["public"]["Tables"]["submissions"]["Row"];
type MissionRefImageRow =
  Database["public"]["Tables"]["mission_reference_images"]["Row"];

// Mission vue par l'admin : juste un id
type AdminMission = {
  id: string;
};

// Profil simplifié : juste l’ID
type SimpleProfile = {
  id: string;
};

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Submissions (preuves)
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [updatingIds, setUpdatingIds] = useState<string[]>([]);

  // Missions & images de référence
  const [missions, setMissions] = useState<AdminMission[]>([]);
  const [loadingMissions, setLoadingMissions] = useState(false);
  const [refImagesByMission, setRefImagesByMission] = useState<
    Record<string, MissionRefImageRow[]>
  >({});
  const [refUploadFiles, setRefUploadFiles] = useState<
    Record<string, File | null>
  >({});
  const [refUploadingIds, setRefUploadingIds] = useState<string[]>([]);

  // Joueurs / rôles
  const [players, setPlayers] = useState<SimpleProfile[]>([]);
  const [adminUserIds, setAdminUserIds] = useState<string[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [updatingRoleIds, setUpdatingRoleIds] = useState<string[]>([]);

  // 🔹 Vérifier que l’utilisateur est connecté et charger les données
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);
      setLoading(false);

      await Promise.all([
        loadSubmissions(),
        loadMissionsAndReferenceImages(),
        loadPlayersAndRoles(),
      ]);
    };

    checkAuth();
  }, [navigate]);

  // 🔹 Charger toutes les submissions
  const loadSubmissions = async () => {
    setLoadingSubmissions(true);
    const { data, error } = await supabase
      .from("submissions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      console.error("Erreur loadSubmissions", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les preuves.",
        variant: "destructive",
      });
    } else if (data) {
      setSubmissions(data);
    }

    setLoadingSubmissions(false);
  };

  // 🔹 Construire la liste des missions + charger les images de référence
  const loadMissionsAndReferenceImages = async () => {
    setLoadingMissions(true);

    // 1) Construire les missions à partir des submissions (mission_id distincts)
    const { data: subMissions, error: subErr } = await supabase
      .from("submissions")
      .select("mission_id")
      .not("mission_id", "is", null);

    if (subErr) {
      console.error("Erreur loadMissions (submissions)", subErr);
      // pas de toast pour ne pas t'inonder, on aura juste "aucune mission"
      setMissions([]);
    } else if (subMissions) {
      const uniqueIds = Array.from(
        new Set(
          subMissions
            .map((row) => row.mission_id)
            .filter((id): id is string => !!id)
        )
      );

      // Si aucune mission trouvée, on peut au moins proposer "test-mission"
      if (uniqueIds.length === 0) {
        setMissions([{ id: "test-mission" }]);
      } else {
        setMissions(uniqueIds.map((id) => ({ id })));
      }
    }

    // 2) Charger toutes les images de référence
    const { data: refData, error: refError } = await supabase
      .from("mission_reference_images")
      .select("*");

    if (refError) {
      console.error("Erreur loadReferenceImages", refError);
      // on n'affiche pas d'erreur bloquante, ça reste optionnel
      setRefImagesByMission({});
    } else if (refData) {
      const byMission: Record<string, MissionRefImageRow[]> = {};
      for (const img of refData) {
        if (!img.mission_id) continue;
        const key = img.mission_id;
        if (!byMission[key]) byMission[key] = [];
        byMission[key].push(img);
      }
      setRefImagesByMission(byMission);
    }

    setLoadingMissions(false);
  };

  // 🔹 Charger la liste des joueurs + les rôles admin
  const loadPlayersAndRoles = async () => {
    setLoadingPlayers(true);

    // 1) On récupère tous les user_id qui ont déjà une submission
    const { data: submissionsData, error: submissionsError } = await supabase
      .from("submissions")
      .select("user_id")
      .not("user_id", "is", null);

    if (!submissionsError && submissionsData) {
      const uniqueIds = Array.from(
        new Set(submissionsData.map((row) => row.user_id as string))
      );
      setPlayers(uniqueIds.map((id) => ({ id })));
    }

    // 2) On récupère les rôles admin existants
    const { data: rolesData, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id, role");

    if (rolesError) {
      console.error("Erreur loadPlayers (roles)", rolesError);
      toast({
        title: "Erreur",
        description: "Impossible de charger les rôles (admins).",
        variant: "destructive",
      });
    } else if (rolesData) {
      const admins = rolesData
        .filter((r) => r.role === "admin")
        .map((r) => r.user_id);
      setAdminUserIds(admins);
    }

    setLoadingPlayers(false);
  };

  // 🔹 Validation manuelle d’une preuve
  const handleManualValidation = async (
    submissionId: string | null,
    status: "approved_manual" | "rejected_manual"
  ) => {
    if (!submissionId) return;

    setUpdatingIds((prev) => [...prev, submissionId]);

    const { error } = await supabase
      .from("submissions")
      .update({
        ai_validation_result: status,
        auto_validated: false,
      })
      .eq("id", submissionId);

    if (error) {
      console.error("Erreur handleManualValidation", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour cette preuve.",
        variant: "destructive",
      });
    } else {
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === submissionId
            ? { ...s, ai_validation_result: status, auto_validated: false }
            : s
        )
      );
      toast({
        title: "Succès",
        description:
          status === "approved_manual"
            ? "Preuve validée manuellement."
            : "Preuve rejetée manuellement.",
      });
    }

    setUpdatingIds((prev) => prev.filter((id) => id !== submissionId));
  };

  // 🔹 Sélection d’un fichier de référence pour une mission
  const handleSelectRefFile = (missionId: string, file: File | null) => {
    setRefUploadFiles((prev) => ({
      ...prev,
      [missionId]: file,
    }));
  };

  // 🔹 Upload d’une image de référence pour une mission
  const handleUploadReferenceImageForMission = async (missionId: string) => {
    const file = refUploadFiles[missionId];
    if (!file) {
      toast({
        title: "Attention",
        description: "Choisis une image avant d’uploader.",
      });
      return;
    }

    setRefUploadingIds((prev) => [...prev, missionId]);

    const path = `reference/${missionId}/${Date.now()}_${file.name}`;

    // 1) Upload dans le bucket Storage
    const { error: storageError } = await supabase.storage
      .from("mission-proofs")
      .upload(path, file);

    if (storageError) {
      console.error("Erreur upload ref image", storageError);
      toast({
        title: "Erreur",
        description:
          "Impossible d’uploader l’image de référence (vérifie le bucket 'mission-proofs').",
        variant: "destructive",
      });
      setRefUploadingIds((prev) => prev.filter((id) => id !== missionId));
      return;
    }

    // 2) Récupérer l’URL publique
    const {
      data: { publicUrl },
    } = supabase.storage.from("mission-proofs").getPublicUrl(path);

    // 3) Enregistrer dans la table mission_reference_images
    const { data: inserted, error: dbError } = await supabase
      .from("mission_reference_images")
      .insert({
        mission_id: missionId,
        image_url: publicUrl,
      })
      .select()
      .single();

    if (dbError || !inserted) {
      console.error("Erreur insert mission_reference_images", dbError);
      toast({
        title: "Erreur",
        description:
          "Image uploadée mais impossible de l’enregistrer en base.",
        variant: "destructive",
      });
    } else {
      setRefImagesByMission((prev) => {
        const existing = prev[missionId] ?? [];
        return {
          ...prev,
          [missionId]: [...existing, inserted],
        };
      });
      toast({
        title: "Succès",
        description: "Image de référence ajoutée pour cette mission.",
      });
    }

    setRefUploadingIds((prev) => prev.filter((id) => id !== missionId));
  };

  // 🔹 Rendre un joueur admin / retirer admin
  const handleToggleAdmin = async (
    targetUserId: string,
    makeAdmin: boolean
  ) => {
    setUpdatingRoleIds((prev) => [...prev, targetUserId]);

    if (makeAdmin) {
      const { error } = await supabase
        .from("user_roles")
        .upsert({ user_id: targetUserId, role: "admin" });

      if (error) {
        console.error("Erreur makeAdmin", error);
        toast({
          title: "Erreur",
          description: "Impossible de définir cet utilisateur comme admin.",
          variant: "destructive",
        });
      } else {
        setAdminUserIds((prev) =>
          prev.includes(targetUserId) ? prev : [...prev, targetUserId]
        );
        toast({
          title: "Succès",
          description: "Ce joueur est maintenant administrateur.",
        });
      }
    } else {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", targetUserId)
        .eq("role", "admin");

      if (error) {
        console.error("Erreur removeAdmin", error);
        toast({
          title: "Erreur",
          description: "Impossible de retirer le rôle admin.",
          variant: "destructive",
        });
      } else {
        setAdminUserIds((prev) => prev.filter((id) => id !== targetUserId));
        toast({
          title: "Succès",
          description: "Ce joueur n’est plus administrateur.",
        });
      }
    }

    setUpdatingRoleIds((prev) => prev.filter((id) => id !== targetUserId));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header admin */}
      <header className="bg-card border-b border-primary/20 sticky top-0 z-40 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-primary">
                Espace Administrateur
              </h1>
              <p className="text-sm text-muted-foreground">
                Missions, preuves, images de référence et rôles des joueurs.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="border-primary/50 text-primary hover:bg-primary/10"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour au jeu
            </Button>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="container mx-auto px-6 py-8 space-y-10">
        {/* SECTION MISSIONS */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">
                Missions & gestion des preuves
              </h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await Promise.all([
                  loadMissionsAndReferenceImages(),
                  loadSubmissions(),
                ]);
              }}
              disabled={loadingMissions || loadingSubmissions}
            >
              {loadingMissions || loadingSubmissions ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Actualisation...
                </>
              ) : (
                "Recharger"
              )}
            </Button>
          </div>

          {missions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune mission détectée pour le moment (aucune submission).
            </p>
          ) : (
            <div className="space-y-6">
              {missions.map((mission) => {
                const missionId = mission.id;
                const missionSubmissions = submissions.filter(
                  (s) => s.mission_id === missionId
                );
                const missionRefImages =
                  refImagesByMission[missionId] ?? [];
                const selectedFile = refUploadFiles[missionId] ?? null;
                const isUploadingRef = refUploadingIds.includes(missionId);

                const validationLabel = (s: SubmissionRow): string => {
                  if (s.ai_validation_result === "approved_manual") {
                    return "Validée manuellement";
                  }
                  if (s.ai_validation_result === "rejected_manual") {
                    return "Rejetée manuellement";
                  }
                  if (s.ai_validation_result) {
                    return s.ai_validation_result;
                  }
                  return "En attente / automatique";
                };

                return (
                  <div
                    key={missionId}
                    className="border border-border rounded-xl p-4 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">
                          Mission : {missionId}
                        </h3>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Bloc images de référence */}
                      <div>
                        <h4 className="text-sm font-semibold mb-2">
                          Images de référence
                        </h4>

                        <div className="flex flex-col gap-2 mb-3">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              handleSelectRefFile(
                                missionId,
                                e.target.files?.[0] ?? null
                              )
                            }
                            className="text-sm"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleUploadReferenceImageForMission(
                                missionId
                              )
                            }
                            disabled={isUploadingRef || !selectedFile}
                          >
                            {isUploadingRef ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Upload en cours...
                              </>
                            ) : (
                              "Uploader une image de référence"
                            )}
                          </Button>
                        </div>

                        {missionRefImages.length === 0 ? (
                          <p className="text-xs text-muted-foreground">
                            Aucune image de référence enregistrée pour cette
                            mission.
                          </p>
                        ) : (
                          <div className="grid grid-cols-2 gap-2">
                            {missionRefImages.map((img) => (
                              <div
                                key={img.id}
                                className="border border-border rounded-lg p-1"
                              >
                                <img
                                  src={img.image_url ?? ""}
                                  alt="Image de référence"
                                  className="w-full h-28 object-cover rounded"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Bloc preuves des joueurs pour cette mission */}
                      <div>
                        <h4 className="text-sm font-semibold mb-2">
                          Preuves des joueurs pour cette mission
                        </h4>

                        {missionSubmissions.length === 0 ? (
                          <p className="text-xs text-muted-foreground">
                            Aucune preuve envoyée pour le moment.
                          </p>
                        ) : (
                          <div className="overflow-x-auto rounded-lg border border-border">
                            <table className="min-w-full text-xs">
                              <thead className="bg-muted/50">
                                <tr>
                                  <th className="px-2 py-1 text-left">
                                    Date
                                  </th>
                                  <th className="px-2 py-1 text-left">
                                    Joueur
                                  </th>
                                  <th className="px-2 py-1 text-left">
                                    Type
                                  </th>
                                  <th className="px-2 py-1 text-left">
                                    Image
                                  </th>
                                  <th className="px-2 py-1 text-left">
                                    Validation
                                  </th>
                                  <th className="px-2 py-1 text-left">
                                    Actions
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {missionSubmissions.map((s) => {
                                  const createdAt = s.created_at
                                    ? new Date(
                                        s.created_at
                                      ).toLocaleString()
                                    : "—";
                                  const isUpdating = s.id
                                    ? updatingIds.includes(s.id)
                                    : false;
                                  const imageUrl =
                                    s.type === "photo"
                                      ? s.code_verb_entered ?? null
                                      : null;

                                  return (
                                    <tr
                                      key={s.id ?? Math.random()}
                                      className="border-t border-border/60"
                                    >
                                      <td className="px-2 py-1 align-top">
                                        {createdAt}
                                      </td>
                                      <td className="px-2 py-1 align-top font-mono">
                                        {s.user_id}
                                      </td>
                                      <td className="px-2 py-1 align-top">
                                        {s.type ?? "—"}
                                      </td>
                                      <td className="px-2 py-1 align-top">
                                        {imageUrl ? (
                                          <a
                                            href={imageUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="underline"
                                          >
                                            Voir
                                          </a>
                                        ) : (
                                          "—"
                                        )}
                                      </td>
                                      <td className="px-2 py-1 align-top">
                                        {validationLabel(s)}
                                      </td>
                                      <td className="px-2 py-1 align-top">
                                        <div className="flex gap-1">
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={
                                              isUpdating || !s.id
                                            }
                                            onClick={() =>
                                              handleManualValidation(
                                                s.id ?? null,
                                                "approved_manual"
                                              )
                                            }
                                          >
                                            <Check className="w-3 h-3 mr-1" />
                                            OK
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="border-red-500 text-red-500 hover:bg-red-500/10"
                                            disabled={
                                              isUpdating || !s.id
                                            }
                                            onClick={() =>
                                              handleManualValidation(
                                                s.id ?? null,
                                                "rejected_manual"
                                              )
                                            }
                                          >
                                            <X className="w-3 h-3 mr-1" />
                                            Refus
                                          </Button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* SECTION GESTION DES JOUEURS */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">
                Gestion des comptes joueurs
              </h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadPlayersAndRoles}
              disabled={loadingPlayers}
            >
              {loadingPlayers ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Actualisation...
                </>
              ) : (
                "Recharger"
              )}
            </Button>
          </div>

          {players.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun joueur trouvé (aucune submission pour l’instant).
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="min-w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left">
                      ID du joueur (user_id)
                    </th>
                    <th className="px-3 py-2 text-left">Rôle</th>
                    <th className="px-3 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((p) => {
                    const isAdmin = adminUserIds.includes(p.id);
                    const isUpdatingRole = updatingRoleIds.includes(p.id);

                    return (
                      <tr key={p.id} className="border-t border-border/60">
                        <td className="px-3 py-2 align-top font-mono text-xs">
                          {p.id}
                        </td>
                        <td className="px-3 py-2 align-top">
                          {isAdmin ? "Administrateur" : "Joueur"}
                        </td>
                        <td className="px-3 py-2 align-top">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isUpdatingRole}
                            onClick={() =>
                              handleToggleAdmin(p.id, !isAdmin)
                            }
                          >
                            {isAdmin ? "Retirer admin" : "Rendre admin"}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Admin;
