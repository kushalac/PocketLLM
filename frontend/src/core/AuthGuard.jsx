import { Navigate } from "react-router-dom"
import AuthService from "./AuthService"

export const PrivateRoute = ({ children }) => {
  return AuthService.isAuthenticated() ? children : <Navigate to="/login" />
}

export const AdminRoute = ({ children }) => {
  const user = AuthService.getUser()
  const isAdmin = user && user.is_admin

  return isAdmin ? children : <Navigate to="/" />
}
