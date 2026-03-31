import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [memberCount, setMemberCount] = useState<number>(0);

  useEffect(() => {
    const fetchMemberCount = async () => {
      try {
        const response = await fetch("http://localhost:3000/members", {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setMemberCount(data.length);
        }
      } catch (err) {
        console.error("Failed to fetch member count:", err);
      }
    };

    fetchMemberCount();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const statItems = [
    {
      title: "Overview",
      value: "Active",
      detail: "System status: Normal"
    },
    {
      title: "Usage",
      value: "24h",
      detail: "Recent activity tracked"
    },
    {
      title: "Notifications",
      value: "0",
      detail: "No new alerts"
    },
    {
      title: "Members",
      value: memberCount.toString(),
      detail: "Total registered members"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <nav className="flex justify-between items-center px-8 py-4 bg-card border-b border-border shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-primary tracking-tight">
            Future+
          </span>
        </div>
        <div className="text-sm text-muted-foreground">
          Welcome,{" "}
          <strong className="text-foreground">{user.name || "User"}</strong>
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

      <main className="flex-1 p-6 md:p-10 max-w-7xl w-full mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-extrabold text-foreground mb-2 tracking-tight">
            Welcome to your Dashboard
          </h1>
          <p className="text-lg text-muted-foreground">
            You have successfully logged in and can now manage your account.
          </p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statItems.map((item, index) => (
            <div 
              key={index} 
              className={`p-6 bg-card border border-border rounded-xl shadow-sm hover:shadow-md hover:translate-y-[-2px] transition-all duration-200 flex flex-col h-full ${item.title === 'Members' ? 'cursor-pointer' : ''}`}
              onClick={() => item.title === 'Members' && navigate('/members')}
            >
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
                {item.title}
              </h3>
              
              <div className="text-3xl font-bold text-foreground mb-1">
                {item.value}
              </div>
              
              <p className="text-sm text-muted-foreground mt-auto">
                {item.detail}
              </p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );

};

export default DashboardPage;
