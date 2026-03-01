import { Routes, Route } from 'react-router-dom'
import App from '../App'
import UpgradePlan from '../components/UpgradePlan'

function PrivateRoutes() {
  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/upgrade-plan" element={<UpgradePlan />} />
    </Routes>
  )
}

export default PrivateRoutes