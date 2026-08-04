

import './App.css'
import {BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from 'react-router-dom'
import HotToast from './components/common/HotToast';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import Templates from './components/Templates';
import Editor from './components/Editor';
import MyResumes from './components/MyResumes';
import NotFound from './components/common/NotFound';

function App() {
  
  return (
  
    <Router>
      <Navbar />
      
      <HotToast />
      <Routes>
        <Route path='/*' element={<Navigate to='/not-found' />} />
        <Route path='/not-found' element={<NotFound />} />
        <Route path='/' element={<Home />} />
        <Route path='/login' element={<Login />} />
        <Route path='/register' element={<Register />} />
        <Route path='/templates' element={<Templates />} />
        <Route path='/editor' element={<Editor />} />
        <Route path='/my-resumes' element={<MyResumes />} />
      </Routes>
    </Router>
      
  )
}

export default App
