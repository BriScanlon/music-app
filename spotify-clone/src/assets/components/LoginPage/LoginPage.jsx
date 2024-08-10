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
    const endpoint = isRegistering ? '/api/user_service/register' : '/api/user_service/login';
    try {
      const response = await axios.post(endpoint, { username, password });
      if (response.status === 200 || response.status === 201) {
        document.cookie = `auth_token=${response.data.token}; path=/`;
        setIsAuthenticated(true);
        navigate('/dashboard'); // Ensure this line is correctly implemented
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
