import { BrowserRouter, Routes, Route } from 'react-router-dom';
import JobsList from './pages/JobsList';
import NewJob from './pages/NewJob';
import JobDetail from './pages/JobDetail';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<JobsList/>} />
        <Route path="/new" element={<NewJob/>} />
        <Route path="/jobs/:id" element={<JobDetail/>} />
      </Routes>
    </BrowserRouter>
  );
}
