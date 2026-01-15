import { Routes, Route } from 'react-router-dom'
import App from '../App'
import LogIn from '../components/Log-in'
import SignUp from '../components/Sign-up'

function PublicRoutes() {
  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/login" element={<LogIn />} />
      <Route path="/signup" element={<SignUp />} />
    </Routes>
  )
}

export default PublicRoutes