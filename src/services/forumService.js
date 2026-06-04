import api from './api'

export const forumService = {
  // Sujets
  getSujets:       (params)   => api.get('/sujets', { params }),
  getMesSujets:    ()         => api.get('/sujets/mes-sujets'),
  getSujet:        (id)       => api.get(`/sujets/${id}`),
  proposerSujet:   (data)     => api.post('/sujets', data),
  validerSujet:    (id)       => api.patch(`/sujets/${id}/valider`),
  supprimerSujet:  (id)       => api.delete(`/sujets/${id}`),
  toggleLikeSujet: (id)       => api.post(`/likes/sujet/${id}`),

  // Postes
  getPostes:       (sujetId, params) => api.get(`/sujets/${sujetId}/postes`, { params }),
  getPoste:        (id)       => api.get(`/postes/${id}`),
  creerPoste:      (sujetId, data) => api.post(`/sujets/${sujetId}/postes`, data, {
    headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {}
  }),
  validerPoste:    (id)       => api.patch(`/postes/${id}/valider`),
  supprimerPoste:  (id)       => api.delete(`/postes/${id}`),
  toggleLikePoste: (id, reaction = '👍') => api.post(`/likes/poste/${id}`, { reaction }),
  getReactionsPoste: (id) => api.get(`/likes/poste/${id}`),
  getCategories: () => api.get('/categories'),
  getPostesEnAttente: ()      => api.get('/postes/moderation', { params: { statut: 'en_attente' } }),
  getMesPostes:       ()      => api.get('/postes/me'),
  getMesCommentaires: ()      => api.get('/postes/me/commentaires'),
  getMesReactions:    ()      => api.get('/likes/me/reactions'),

  // Commentaires
  getCommentairesEnAttente: () => api.get('/commentaires/moderation'),
  getCommentaires:    (posteId) => api.get(`/postes/${posteId}/commentaires`),
  ajouterCommentaire: (posteId, data) => api.post(`/postes/${posteId}/commentaires`, data, {
    headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {}
  }),
  supprimerCommentaire: (id)   => api.delete(`/commentaires/${id}`),
  toggleLikeCommentaire: (id, reaction = '👍') => api.post(`/likes/commentaire/${id}`, { reaction }),

  // Reports
  reporterUtilisateur: (data) => api.post('/reports/utilisateur', data),
  reporterPoste:       (data) => api.post('/reports/poste', data),
  reporterCommentaire: (data) => api.post('/reports/commentaire', data),
  // Notifications
  getNotifications:      ()    => api.get('/reports/notifications'),
  marquerNotifLue:       (id)  => api.patch(`/reports/notifications/${id}/lu`),
  marquerToutesLues:     ()    => api.patch('/reports/notifications/mark-all-read'),
}