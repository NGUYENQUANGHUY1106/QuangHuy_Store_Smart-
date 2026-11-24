import { AppRouter } from './AppRouter'
import { CartProvider } from '../context/CartContext'
import { AuthProvider } from '../context/AuthContext'

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppRouter />
      </CartProvider>
    </AuthProvider>
  )
}
