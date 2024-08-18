import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function LoginPage({ setIsAuthenticated }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Update the endpoint to point to the auth_service
    const endpoint = isRegistering ? '/api/auth_service/register' : '/api/auth_service/login';
    try {
      const response = await axios.post(endpoint, { username, password });
      if (response.status === 200 || response.status === 201) {
        // Store the token in a cookie
        document.cookie = `AuthToken=${response.data.token}; path=/;`;

        // Set the authentication state
        setIsAuthenticated(true);

        // Redirect to the dashboard
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Authentication failed');
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit}>
        <h2>{isRegistering ? 'Register' : 'Login'}</h2>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">{isRegistering ? 'Register' : 'Login'}</button>
        <p onClick={() => setIsRegistering(!isRegistering)}>
          {isRegistering ? 'Already have an account? Log in' : 'Don’t have an account? Register'}
        </p>
      </form>
    </div>
  );
}

export default LoginPage;
