import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Sidebar.css';

function Sidebar() {
  const [activeItem, setActiveItem] = useState('Home');
  const navigate = useNavigate();

  const menuItems = [
    { name: 'Home', path: '/dashboard' },
    { name: 'Explore', path: '/explore' },
    { name: 'Videos', path: '/videos' },
    { name: 'Mixes & Radio', path: '/mixes-radio' },
    { name: 'Playlists', path: '/playlists' },
    { name: 'Albums', path: '/albums' },
    { name: 'Tracks', path: '/tracks' },
    { name: 'Artists', path: '/artists' },
  ];

  const handleMenuClick = (item) => {
    setActiveItem(item.name);
    navigate(item.path);
  };

  return (
    <div className="sidebar">
      {menuItems.slice(0, 3).map((item) => (
        <div
          key={item.name}
          className={`nav-item ${activeItem === item.name ? 'active' : ''}`}
          onClick={() => handleMenuClick(item)}
        >
          {item.name}
        </div>
      ))}

      <div className="collection-header">MY COLLECTION</div>

      {menuItems.slice(3).map((item) => (
        <div
          key={item.name}
          className={`nav-item ${activeItem === item.name ? 'active' : ''}`}
          onClick={() => handleMenuClick(item)}
        >
          {item.name}
        </div>
      ))}

      <div className="my-playlists-header">MY PLAYLISTS</div>
      <div className="nav-item" onClick={() => handleMenuClick({ name: 'Create...', path: '/create-playlist' })}>
        Create...
      </div>
    </div>
  );
}

export default Sidebar;
