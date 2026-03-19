import React from 'react';
import './TaskBar.css';

const TaskBar: React.FC = () => {
  return (
    <div className="task-bar">
      <div className="logo">
        <h1>English Learn</h1>
      </div>
      <div className="buttons">
        <button className="btn login-btn">Đăng nhập</button>
        <button className="btn register-btn">Đăng ký</button>
      </div>
    </div>
  );
};

export default TaskBar;