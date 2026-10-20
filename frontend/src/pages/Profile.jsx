import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../axiosConfig';

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '' });
  const [loading, setLoading] = useState(true);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axiosInstance.get('/api/auth/profile', {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setProfile(response.data);
      } catch (fetchError) {
        setError(fetchError.response?.data?.message || 'Failed to fetch profile information.');
      } finally {
        setLoading(false);
      }
    };

    if (user?.token) {
      fetchProfile();
    } else {
      setLoading(false);
      setError('Please log in to view your profile.');
    }
  }, [user]);

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    if (passwordData.newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    setPasswordLoading(true);
    try {
      await axiosInstance.put('/api/auth/password', passwordData, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setMessage('Password updated successfully.');
      setPasswordData({ oldPassword: '', newPassword: '' });
      setShowPasswordForm(false);
    } catch (passwordError) {
      setError(passwordError.response?.data?.message || 'Failed to change password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center mt-20">Loading profile...</div>;
  }

  return (
    <div className="max-w-md mx-auto mt-20 bg-white p-6 shadow-md rounded">
      <h1 className="text-2xl font-bold mb-4 text-center">Your Profile</h1>

      {error && <p className="mb-4 text-red-600">{error}</p>}
      {message && <p className="mb-4 text-green-600">{message}</p>}

      {profile && (
        <>
          <section className="mb-4 p-4 border rounded">
            <h2 className="font-bold mb-2">Membership Plan</h2>
            <p>{profile.membershipPlan || 'Standard Member'}</p>
          </section>

          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="w-full mb-3 bg-blue-600 text-white p-2 rounded"
          >
            {showDetails ? 'Hide detailed personal information' : 'View detailed personal information'}
          </button>

          {showDetails && (
            <section className="mb-4 p-4 border rounded">
              <h2 className="font-bold mb-2">Personal Information</h2>
              <p><strong>Name:</strong> {profile.name}</p>
              <p><strong>Email:</strong> {profile.email}</p>
            </section>
          )}

          <button
            type="button"
            onClick={() => {
              setShowPasswordForm(!showPasswordForm);
              setMessage('');
              setError('');
            }}
            className="w-full bg-gray-700 text-white p-2 rounded"
          >
            Change password
          </button>

          {showPasswordForm && (
            <form onSubmit={handlePasswordChange} className="mt-4">
              <label htmlFor="oldPassword" className="block mb-1">Current password</label>
              <input
                id="oldPassword"
                type="password"
                value={passwordData.oldPassword}
                onChange={(event) => setPasswordData({ ...passwordData, oldPassword: event.target.value })}
                className="w-full mb-3 p-2 border rounded"
                required
              />

              <label htmlFor="newPassword" className="block mb-1">New password</label>
              <input
                id="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={(event) => setPasswordData({ ...passwordData, newPassword: event.target.value })}
                className="w-full mb-3 p-2 border rounded"
                minLength="6"
                required
              />

              <button
                type="submit"
                disabled={passwordLoading}
                className="w-full bg-green-600 text-white p-2 rounded disabled:opacity-50"
              >
                {passwordLoading ? 'Updating password...' : 'Update password'}
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
};

export default Profile;
