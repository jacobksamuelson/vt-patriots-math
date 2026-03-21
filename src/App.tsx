import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { SplashScreen } from '@/screens/SplashScreen'
import { ProfileSelect } from '@/screens/ProfileSelect'
import { GradeSelect } from '@/screens/GradeSelect'
import { Hub } from '@/screens/Hub'
import { ProblemScreen } from '@/screens/ProblemScreen'
import { MiniGameScreen } from '@/screens/MiniGameScreen'
import { ResultsScreen } from '@/screens/ResultsScreen'
import { Leaderboard } from '@/screens/Leaderboard'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SplashScreen />} />
        <Route path="/profiles" element={<ProfileSelect />} />
        <Route path="/grade" element={<GradeSelect />} />
        <Route path="/hub" element={<Hub />} />
        <Route path="/play/:concept/:level" element={<ProblemScreen />} />
        <Route path="/minigame/:type" element={<MiniGameScreen />} />
        <Route path="/results" element={<ResultsScreen />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
      </Routes>
    </BrowserRouter>
  )
}
