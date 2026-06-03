import api from './api'

export const adminService = {
  // Utilisateurs
  getUtilisateurs:          (params) => api.get('/admin/utilisateurs', { params }),
  getUtilisateursEnAttente: ()       => api.get('/admin/utilisateurs/en-attente'),
  bloquerUtilisateur:       (id)     => api.patch(`/admin/utilisateurs/${id}/bloquer`),
  debloquerUtilisateur: (id)     => api.patch(`/admin/utilisateurs/${id}/debloquer`),
  donnerRoleModo:       (id)     => api.patch(`/admin/utilisateurs/${id}/moderateur`),
  supprimerRoleModo:    (id)     => api.patch(`/admin/utilisateurs/${id}/utilisateur`),

  // Sujets
  getSujetsEnAttente: ()   => api.get('/admin/sujets/en-attente'),
  getAllSujets:        ()   => api.get('/admin/sujets'),
  supprimerSujet:     (id) => api.delete(`/admin/sujets/${id}`),
  validerSujet:       (id) => api.patch(`/sujets/${id}/valider`),

  // Rapports
  getRapports:        ()   => api.get('/admin/reports'),
  getAdminRapports:   ()   => api.get('/reports/admin'),
  getModoRapports:    ()   => api.get('/reports/moderateur'),
  traiterRapport:     (id) => api.patch(`/reports/${id}/traiter`),
  ignorerRapport:     (id) => api.patch(`/reports/${id}/ignorer`),
  bloquerDepuisReport:(userId) => api.patch(`/reports/admin/${userId}/bloquer`),
  ignorerUserReports: (userId) => api.patch(`/reports/admin/${userId}/ignorer`),

  // Pending stats (badge)
  getPendingStats:    ()   => api.get('/stats/pending'),
}