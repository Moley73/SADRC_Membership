import { createContext, useContext } from 'react';
import { useAuth } from './useAuth';

// Create context with default values
const AuthContext = createContext({
  user: null,
  session: null,
  loading: true,
  error: null,
  isAdmin: false,
  signOut: async () => {},
  refreshSession: async () => {},
  getToken: () => null,
});

// Auth provider component
export const AuthProvider = ({ children }) => {
  const auth = useAuth();
  
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuthContext = () => useContext(AuthContext);

// HOC to protect routes requiring authentication
export function withAuth(Component) {
  return function WithAuth(props) {
    const { user, loading } = useAuthContext();
    
    // Handle the case where we're loading
    if (loading) {
      // You could render a loading spinner here
      return <div>Loading authentication...</div>;
    }
    
    // If not loading and no user, we're not authenticated
    if (!user) {
      if (typeof window !== 'undefined') {
        // Only redirect on the client-side
        window.location.href = '/login';
        return <div>Redirecting to login...</div>;
      }
      return null;
    }
    
    // If we have a user, render the component
    return <Component {...props} />;
  };
}

// Admin route protection
export function withAdmin(Component) {
  return function WithAdmin(props) {
    const { user, loading, isAdmin } = useAuthContext();
    
    // Handle the case where we're loading
    if (loading) {
      return <div>Loading authentication...</div>;
    }
    
    // If not loading and either no user or not admin
    if (!user || !isAdmin) {
      if (typeof window !== 'undefined') {
        // Redirect to unauthorized page or home
        window.location.href = '/unauthorized';
        return <div>Redirecting to unauthorized page...</div>;
      }
      return null;
    }
    
    // If we have a user and they're an admin, render the component
    return <Component {...props} />;
  };
}
