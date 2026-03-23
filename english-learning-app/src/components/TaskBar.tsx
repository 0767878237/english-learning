import React from 'react';
import './TaskBar.css';
import { VSTEP_LEVELS } from '../types';
import type { VstepLevel } from '../types';
import { useAuth } from '../hooks/useAuth';

type TaskBarProps = {
  selectedLevel: VstepLevel;
  onSelectLevel: (level: VstepLevel) => void;
};

const TaskBar: React.FC<TaskBarProps> = ({ selectedLevel, onSelectLevel }) => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement | null>(null);
  const buttonRef = React.useRef<HTMLButtonElement | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;

    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (!target) return;

      if (menuRef.current?.contains(target)) return;
      if (buttonRef.current?.contains(target)) return;
      setIsOpen(false);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="task-bar">
      <div className="left-group">
        <div className="logo">
          <h1>English Learn</h1>
        </div>

        <div className="level-dropdown" ref={menuRef}>
          <button
            ref={buttonRef}
            type="button"
            className="btn level-btn"
            aria-haspopup="menu"
            aria-expanded={isOpen}
            onClick={() => setIsOpen((v) => !v)}
          >
            <span className="level-btn__label">VSTEP: {selectedLevel}</span>
            <span className="level-btn__caret" aria-hidden="true">
              ▾
            </span>
          </button>

          {isOpen && (
            <div className="level-menu" role="menu" aria-label="Chọn cấp độ VSTEP">
              {VSTEP_LEVELS.map((level) => (
                <button
                  key={level}
                  type="button"
                  role="menuitem"
                  className={`level-item ${level === selectedLevel ? 'is-selected' : ''}`}
                  onClick={() => {
                    onSelectLevel(level);
                    setIsOpen(false);
                  }}
                >
                  {level}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="buttons">
        {user ? (
          <div className="user-section">
            <span className="username">👤 {user.username}</span>
            <button 
              className="btn logout-btn"
              onClick={logout}
            >
              Đăng xuất
            </button>
          </div>
        ) : (
          <>
            <button className="btn login-btn">Đăng nhập</button>
            <button className="btn register-btn">Đăng ký</button>
          </>
        )}
      </div>
    </div>
  );
};

export default TaskBar;