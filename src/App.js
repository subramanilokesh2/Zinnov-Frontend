import './App.css';
import Dashboard from './Modules/Dashboard';
import Landing from './Landing';
import Signup from './Modules/signup';
import Help from './Modules/Help';
import Upload from './Modules/Upload';
import Databases from './Modules/Databases';
import News from './Modules/News';
import CurieLocal from './Modules/CurieLocal';
import { BrowserRouter, Routes, Route} from 'react-router-dom';


function App() {
  return (
    <div className="App">
          <BrowserRouter>
          <Routes>
        <Route path="/" element={<Landing/>} />
        <Route path="/signup" element={<Signup/>} />
        <Route path="/dashboard" element={<Dashboard/>} />
        <Route path="/help" element={<Help/>} />
        <Route path="/upload" element={<Upload/>} />
        <Route path="/files" element={<Databases/>} />
        <Route path="/news" element={<News/>} />
        <Route path="/curie" element={<CurieLocal user={JSON.parse(localStorage.getItem("authUser")||"{}")} />} />
      </Routes>
    </BrowserRouter>
    </div>
  );
}

export default App;
