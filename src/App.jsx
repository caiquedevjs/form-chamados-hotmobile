import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import MultilineTextFields from './components/form.component'


function App() {
  const [count, setCount] = useState(0)

  return (
    <>
     <MultilineTextFields/>
    </>
  )
}

export default App
