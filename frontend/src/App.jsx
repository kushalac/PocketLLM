import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { PrivateRoute, AdminRoute } from "./core/AuthGuard"
import Login from "./features/auth/Login"
import Register from "./features/auth/Register"
import ChatInterface from "./features/chat/ChatInterface"
import AdminDashboard from "./features/admin/AdminDashboard"
import HistoryPage from "./features/history/HistoryPage"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/chat"
          element={
            <PrivateRoute>
              <ChatInterface />
            </PrivateRoute>
          }
        />

        <Route
          path="/history"
          element={
            <PrivateRoute>
              <HistoryPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <PrivateRoute>
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            </PrivateRoute>
          }
        />

        <Route path="/" element={<Navigate to="/chat" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
