import React from 'react';
import { useNavigate } from 'react-router-dom';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <nav className="flex justify-between items-center px-8 py-4 bg-card border-b border-border shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-primary tracking-tight">Future+</span>
        </div>
        <div className="text-sm text-muted-foreground">
          Welcome, <strong className="text-foreground">{user.name || 'User'}</strong>
        </div>
        <div className="flex items-center">
          <button 
            className="px-4 py-2 border border-border rounded-xl text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground hover:border-muted-foreground transition-all" 
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </nav>
      
      <main className="flex-1 p-10 max-w-7xl w-full mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-extrabold text-foreground mb-2 tracking-tight">Welcome to your Dashboard</h1>
          <p className="text-lg text-muted-foreground">You have successfully logged in and can now manage your account.</p>
        </header>
        
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-card border border-border rounded-xl shadow-sm hover:translate-y-[-2px] hover:shadow-md transition-all">
            <h3 className="text-sm font-semibold text-muted-foreground mb-4">Overview</h3>
            <div className="text-4xl font-bold text-foreground mb-2">Active</div>
            <p className="text-sm text-muted-foreground">System status: Normal</p>
          </div>
          <div className="p-6 bg-card border border-border rounded-xl shadow-sm hover:translate-y-[-2px] hover:shadow-md transition-all">
            <h3 className="text-sm font-semibold text-muted-foreground mb-4">Usage</h3>
            <div className="text-4xl font-bold text-foreground mb-2">24h</div>
            <p className="text-sm text-muted-foreground">Recent activity tracked</p>
          </div>
          <div className="p-6 bg-card border border-border rounded-xl shadow-sm hover:translate-y-[-2px] hover:shadow-md transition-all">
            <h3 className="text-sm font-semibold text-muted-foreground mb-4">Notifications</h3>
            <div className="text-4xl font-bold text-foreground mb-2">0</div>
            <p className="text-sm text-muted-foreground">No new alerts</p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default DashboardPage;
