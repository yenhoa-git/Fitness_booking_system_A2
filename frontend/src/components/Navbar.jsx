import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-blue-600 text-white p-4 flex justify-between items-center">
      <Link to="/" className="text-2xl font-bold">
        Zerow Gym
      </Link>
      <div>
        {user ? (
          <>
            <Link to="/schedule" className="mr-4">
              Schedule
            </Link>
            {user.role === 'member' && <Link to="/profile" className="mr-4">Profile</Link>}
            {user.role === "member" && (
              <Link to="/my-bookings" className="mr-4">
                My Bookings
              </Link>
            )}
            {user.role === "admin" && (
              <Link to="/admin/classes" className="mr-4">
                Manage classes
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="bg-red-500 px-4 py-2 rounded hover:bg-red-700"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="mr-4">
              Login
            </Link>
            <Link
              to="/register"
              className="bg-green-500 px-4 py-2 rounded hover:bg-green-700"
            >
              Sign up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
