import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[BUNKER UI RECOVERY]:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 text-center font-mono">
          <div className="max-w-md w-full bg-zinc-900 border-2 border-amber-500/60 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="text-3xl">☢️</div>
            <h2 className="text-lg font-bold text-amber-400">
              Терминал перезагружен
            </h2>
            <p className="text-xs text-zinc-400">
              Обнаружен сбой отображения интерфейса. Нажмите кнопку ниже, чтобы мгновенно продолжить игру.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs cursor-pointer"
              >
                🔄 Продолжить игру
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('bunker_room_code');
                  localStorage.removeItem('bunker_player_id');
                  this.setState({ hasError: false, error: null });
                  window.location.href = '/';
                }}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs cursor-pointer"
              >
                ← В главное меню
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </React.StrictMode>,
);

