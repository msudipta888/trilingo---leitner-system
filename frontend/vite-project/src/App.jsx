import React, { useState } from 'react'
import {Routes,Route} from 'react-router-dom'
import FlashcardApp from './FlashcardCard'
import Register from './Register'
import Login from './Login'
const App = () => {
  const [token,setToken] = useState("");
  return (
    <div>
      <Routes>
        <Route path='/' element={<Register setToken={setToken}/>} />
        <Route path='/login' element={<Login setToken={setToken}/>} />
        <Route path='/flashcard' element={<FlashcardApp/>} />
        
      </Routes>
    </div>
  )
}

export default App
