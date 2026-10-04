import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Schedule from "./pages/Schedule";
import MyBookings from "./pages/MyBookings";
import AdminClasses from "./pages/AdminClasses";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Schedule />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/bookings" element={<MyBookings />} />
        <Route path="/admin/classes" element={<AdminClasses />} />
      </Routes>
    </Router>
  );
}

export default App;
