import { useState } from 'react'
import Banner from './components/Banner'
import Navbar from './components/Navbar'
import BottomNav from './components/BottomNav'
import Scelte from './pages/Scelte'
import Gironi from './pages/Gironi'
import Tabellone from './pages/Tabellone'
import Classifica from './pages/Classifica'
import Marcatori from './pages/Marcatori'

export default function App() {
  const [active, setActive] = useState('scelte')

  const pages = {
    scelte:     <Scelte />,
    gironi:     <Gironi />,
    tabellone:  <Tabellone />,
    classifica: <Classifica />,
    marcatori:  <Marcatori />,
  }

  return (
    <>
      <Banner />
      <Navbar active={active} setActive={setActive} />
      {pages[active]}
      <BottomNav active={active} setActive={setActive} />
    </>
  )
}
