import React from 'react';
import './SuggestedAlbums.css';

function SuggestedAlbums() {
  return (
    <div className="section">
      <h2>Suggested New Albums</h2>
      <div className="albums">
        {/* Each album would be represented by a div */}
        <div className="album-card">Album 1</div>
        <div className="album-card">Album 2</div>
        <div className="album-card">Album 3</div>
        <div className="album-card">Album 4</div>
        <div className="album-card">Album 5</div>
      </div>
    </div>
  );
}

export default SuggestedAlbums;
