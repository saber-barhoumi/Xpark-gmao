// src/app/(admin)/apps/email/hooks/useEmail.ts

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import emailService from '../services/emailService';
import { EnvoyerEmailDto } from '../types/email.types';

export const useEmail = (boiteInitiale = 'INBOX') => {
  const [boiteActive, setBoiteActive] = useState(boiteInitiale);
  const [page,        setPage]        = useState(1);
  const [search,      setSearch]      = useState('');
  const qc = useQueryClient();

  // ── Boîtes (sidebar compteurs) ────────────────────────────────
  const { data: boites, isLoading: boitesLoading } = useQuery({
    queryKey: ['email', 'boites'],
    queryFn:  emailService.getBoites,
    staleTime: 60_000,
    refetchInterval: 120_000,   // Rafraîchir toutes les 2 min
  });

  // ── Liste emails ──────────────────────────────────────────────
  const {
    data: emailsData,
    isLoading: emailsLoading,
    isFetching,
  } = useQuery({
    queryKey: ['email', 'list', boiteActive, page, search],
    queryFn:  () => emailService.getEmails(boiteActive, page, 20, search),
    staleTime: 30_000,
  });

  // ── Mutations ─────────────────────────────────────────────────
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['email'] });
  };

  const marquerLuMutation = useMutation({
    mutationFn: ({ uid, lu }: { uid: string; lu: boolean }) =>
      emailService.marquerLu(boiteActive, uid, lu),
    onSuccess: invalidate,
  });

  const etoilerMutation = useMutation({
    mutationFn: ({ uid, etoile }: { uid: string; etoile: boolean }) =>
      emailService.etoiler(boiteActive, uid, etoile),
    onSuccess: invalidate,
  });

  const supprimerMutation = useMutation({
    mutationFn: (uid: string) => emailService.supprimerEmail(boiteActive, uid),
    onSuccess: invalidate,
  });

  const envoyerMutation = useMutation({
    mutationFn: (dto: EnvoyerEmailDto) => emailService.envoyerEmail(dto),
    onSuccess: invalidate,
  });

  const changerBoite = useCallback((boite: string) => {
    setBoiteActive(boite);
    setPage(1);
    setSearch('');
  }, []);

  return {
    boites,        boitesLoading,
    emails:        emailsData?.emails ?? [],
    totalEmails:   emailsData?.total  ?? 0,
    nonLus:        emailsData?.nonLus ?? 0,
    totalPages:    emailsData?.totalPages ?? 0,
    emailsLoading, isFetching,
    boiteActive,   changerBoite,
    page,          setPage,
    search,        setSearch,
    marquerLu:     (uid: string, lu: boolean) => marquerLuMutation.mutate({ uid, lu }),
    etoiler:       (uid: string, etoile: boolean) => etoilerMutation.mutate({ uid, etoile }),
    supprimer:     (uid: string) => supprimerMutation.mutate(uid),
    envoyer:       (dto: EnvoyerEmailDto) => envoyerMutation.mutateAsync(dto),
  };
};
