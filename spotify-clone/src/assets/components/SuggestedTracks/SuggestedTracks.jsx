import React from 'react';
import './SuggestedTracks.css';

function SuggestedTracks() {
  return (
    <div className="section">
      <h2>Suggested New Tracks</h2>
      <div className="tracks">
        {/* Each track would be represented by a div */}
        <div className="track-card">
          <div>Track 1</div>
          <div>Artist 1</div>
          <div>3:20</div>
        </div>
        <div className="track-card">
          <div>Track 2</div>
          <div>Artist 2</div>
          <div>2:45</div>
        </div>
        {/* Add more tracks */}
      </div>
    </div>
  );
}

export default SuggestedTracks;
