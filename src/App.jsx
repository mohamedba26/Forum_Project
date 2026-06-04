import { Routes, Route, Navigate } from 'react-router-dom'
import { SidebarProvider } from './context/SidebarContext'
import { AuthProvider, useAuth } from './context/AuthContext'

import Layout            from './components/layout/Layout'
import AuthPage          from './pages/AuthPage'
import HomePage          from './pages/HomePage'

import PostePage         from './pages/PostePage'
import ProposerSujetPage from './pages/ProposerSujetPage'
import AjouterSujetPage  from './pages/AjouterSujetPage'
import MesPostesPage     from './pages/MesPostesPage'
import ChatPage          from './pages/ChatPage'
import AdminPage         from './pages/AdminPage'
import ModeratorPage     from './pages/ModeratorPage'
import NotFoundPage      from './pages/NotFoundPage'
import ProfilePage       from './pages/ProfilePage'

function ProtectedRoute({ children, requireAdmin, requireMod }) {
  const { user, isAdmin, isModerator } = useAuth()
  if (!user)                          return <Navigate to="/auth" replace />
  if (requireAdmin && !isAdmin)       return <Navigate to="/" replace />
  if (requireMod   && !isModerator)   return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />

        <Route path="/postes/:id" element={<PostePage />} />
        <Route path="/proposer-sujet" element={<ProtectedRoute><ProposerSujetPage /></ProtectedRoute>} />
        <Route path="/ajouter-sujet"  element={<ProtectedRoute><AjouterSujetPage /></ProtectedRoute>} />
        <Route path="/mes-postes"     element={<ProtectedRoute><MesPostesPage /></ProtectedRoute>} />
        <Route path="/profil"         element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/chat"           element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        <Route path="/chat/:userId"   element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        <Route path="/admin"          element={<ProtectedRoute requireAdmin><AdminPage /></ProtectedRoute>} />
        <Route path="/moderation"     element={<ProtectedRoute requireMod><ModeratorPage /></ProtectedRoute>} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <SidebarProvider>
        <AppRoutes />
      </SidebarProvider>
    </AuthProvider>
  )
}