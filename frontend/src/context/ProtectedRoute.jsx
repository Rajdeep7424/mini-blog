import {Navigate} from 'react-router-dom'
import {useAuth} from './AuthContext.jsx'

export function PrivateRoute({children}){
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? children : <Navigate to="/login" replace/>;
}