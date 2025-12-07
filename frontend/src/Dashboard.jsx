import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Dashboard.css';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
const Dashboard = () => {
const [timerStatus, setTimerStatus] = useState(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
// Fetch status every second
useEffect(() => {
const interval = setInterval(async () => {
try {
const response = await axios.get(`${API_URL}/api/status`);
setTimerStatus(response.data);
setError(null);
} catch (err) {
setError('Failed to fetch status');
}
}, 1000);
return () => clearInterval(interval);

}, []);
const handleStart = async () => {
setLoading(true);
try {
const response = await axios.post(`${API_URL}/api/start-day`);
setTimerStatus({ ...response.data, status: 'active' });
setError(null);
} catch (err) {
setError('Failed to start timer');
}
setLoading(false);
};
const handlePause = async () => {
setLoading(true);
try {
await axios.post(`${API_URL}/api/pause`);
setError(null);
} catch (err) {
setError('Failed to pause');
}
setLoading(false);
};
const handleResume = async () => {
setLoading(true);
try {
await axios.post(`${API_URL}/api/resume`);
setError(null);
} catch (err) {
setError('Failed to resume');
}
setLoading(false);
};
const handleEnd = async () => {
setLoading(true);
try {
await axios.post(`${API_URL}/api/end-day`);
setTimerStatus({ status: 'inactive' });
setError(null);
} catch (err) {
setError('Failed to end day');
}
setLoading(false);
};
const handleNextInterval = async () => {
  setLoading(true);
  try {
    await axios.post(`${API_URL}/api/next-interval`);
    setError(null);
  } catch (err) {
    setError('Failed to advance interval');
  }
  setLoading(false);
};
const formatTime = (seconds) =>{
const hours = Math.floor(seconds / 3600);
const minutes = Math.floor((seconds % 3600) / 60);
const secs = seconds % 60;
if (hours > 0) {
  return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
return `${minutes}:${String(secs).padStart(2, '0')}`;

};
return (
<div className="dashboard">
🏥 Post-Sleeve Health Timer
Interval-based medication & meal tracking
  {error && <div className="error-box">{error}</div>}

  {timerStatus && timerStatus.status !== 'inactive' ? (
    <>
      <div className="timer-container">
        <div className="current-interval">
          <h2>{timerStatus.currentInterval?.name}</h2>
          <p className="interval-action">{timerStatus.currentInterval?.action}</p>

          <div className="countdown">
            <div className="time-display">
              {formatTime(timerStatus.timeRemaining)}
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${Math.max(0, 100 - (timerStatus.timeRemaining / (timerStatus.currentInterval?.duration || 1) * 100))}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="next-interval">
          <h3>Next Interval</h3>
          <p>{timerStatus.nextInterval?.name || 'Day Complete'}</p>
        </div>

        <div className="controls">
  {!timerStatus.isPaused ? (
    <button onClick={handlePause} className="btn btn-pause" disabled={loading}>
      ⏸ Pause
    </button>
  ) : (
    <button onClick={handleResume} className="btn btn-resume" disabled={loading}>
      ▶ Resume
    </button>
  )}
  <button onClick={handleNextInterval} className="btn btn-next" disabled={loading}>
    ⏭ Skip
  </button>
  <button onClick={handleEnd} className="btn btn-end" disabled={loading}>
    ⏹ End Day
  </button>
</div>


        {timerStatus.isPaused && (
          <div className="paused-indicator">⏸ PAUSED</div>
        )}
      </div>
    </>
  ) : (
    <div className="start-container">
      <p>Ready to start your day?</p>
      <button onClick={handleStart} className="btn btn-start" disabled={loading}>
        🔔 Start Day Timer
      </button>
    </div>
  )}
</div>

);
};
export default Dashboard;
