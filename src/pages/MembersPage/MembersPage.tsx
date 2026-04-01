import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

interface Member {
  id: number;
  name: string;
  investmentAmount: number;
  periodMonths: number;
  monthlyReturn: number;
  totalAmount: number;
  joinedDate: string;
}

const MembersPage: React.FC = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    investmentAmount: "",
    periodMonths: "",
    monthlyReturn: "",
    totalAmount: "",
    joinedDate: "",
  });

  const API_URL = "http://localhost:3000/members";

  const fetchMembers = async () => {
    try {
      const response = await fetch(API_URL, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      if (!response.ok) throw new Error("Failed to fetch members");
      const data = await response.json();
      setMembers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Simple validation for 1000 INR
    if (Number(formData.investmentAmount) < 1000) {
      setError("Min investment is 1000 INR");
      return;
    }

    try {
      const isEditing = editingId !== null;
      const response = await fetch(isEditing ? `${API_URL}/${editingId}` : API_URL, {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          name: formData.name,
          investmentAmount: Number(formData.investmentAmount),
          periodMonths: Number(formData.periodMonths),
          monthlyReturn: Number(formData.monthlyReturn),
          totalAmount: Number(formData.totalAmount),
          joinedDate: formData.joinedDate,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create member");
      }

      setFormData({
        name: "",
        investmentAmount: "",
        periodMonths: "",
        monthlyReturn: "",
        totalAmount: "",
        joinedDate: "",
      });
      setShowAddForm(false);
      setEditingId(null);
      fetchMembers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this member?")) return;
    
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      if (!response.ok) throw new Error("Failed to delete member");
      fetchMembers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEdit = (member: Member) => {
    setFormData({
      name: member.name,
      investmentAmount: member.investmentAmount.toString(),
      periodMonths: member.periodMonths.toString(),
      monthlyReturn: member.monthlyReturn.toString(),
      totalAmount: member.totalAmount.toString(),
      joinedDate: member.joinedDate || "",
    });
    setEditingId(member.id);
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setFormData({
      name: "",
      investmentAmount: "",
      periodMonths: "",
      monthlyReturn: "",
      totalAmount: "",
      joinedDate: "",
    });
    setEditingId(null);
    setShowAddForm(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <nav className="flex justify-between items-center px-8 py-4 bg-card border-b border-border shadow-sm">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/dashboard")}>
          <span className="text-xl font-bold text-primary tracking-tight">
            Future+
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button
            className="px-4 py-2 border border-border rounded-xl text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground hover:border-muted-foreground transition-all"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="flex-1 p-6 md:p-10 max-w-7xl w-full mx-auto">
        <header className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-foreground mb-2 tracking-tight">
              Members Management
            </h1>
            <p className="text-muted-foreground">
              View and manage all members and their investments.
            </p>
          </div>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold shadow-lg hover:shadow-primary/20 hover:translate-y-[-1px] transition-all"
          >
            {showAddForm ? "Cancel" : "Add Member"}
          </button>
        </header>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl">
            {error}
          </div>
        )}

        {showAddForm && (
          <section className="mb-10 p-6 bg-card border border-border rounded-2xl shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
            <h2 className="text-xl font-bold mb-6">
              {editingId ? "Edit Member" : "Create New Member"}
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <input
                  required
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="Member name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Investment Amount (INR)</label>
                <input
                  required
                  type="number"
                  name="investmentAmount"
                  value={formData.investmentAmount}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="Min 1000"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Period (Months)</label>
                <input
                  required
                  type="number"
                  name="periodMonths"
                  value={formData.periodMonths}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="Duration"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Monthly Return</label>
                <input
                  required
                  type="number"
                  name="monthlyReturn"
                  value={formData.monthlyReturn}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="Amount"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Total Amount</label>
                <input
                  required
                  type="number"
                  name="totalAmount"
                  value={formData.totalAmount}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="Final value"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Joined Date (DD-MM-YYYY)</label>
                <input
                  required
                  name="joinedDate"
                  value={formData.joinedDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="01-01-2023"
                />
              </div>
               <div className="flex items-end gap-3 lg:col-span-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition-all"
                >
                  {editingId ? "Update Member" : "Create Member"}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 py-2.5 border border-border rounded-xl font-semibold text-muted-foreground hover:bg-accent transition-all"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </section>
        )}

        <section className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">S.No</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">ID</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Investment</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Period</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Joined</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Monthly Return</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Amount</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                      <div className="flex justify-center items-center gap-2">
                        <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                        Loading members...
                      </div>
                    </td>
                  </tr>
                ) : members.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                      No members found. Add your first member to get started.
                    </td>
                  </tr>
                ) : (
                  members.map((member, index) => (
                    <tr key={member.id} className="hover:bg-accent/5 transition-colors">
                      <td className="px-6 py-4 font-mono text-sm text-muted-foreground">{index + 1}</td>
                      <td className="px-6 py-4 font-mono text-xs text-muted-foreground font-medium">#{member.id.toString().padStart(3, '0')}</td>
                      <td className="px-6 py-4">
                        <Link 
                          to={`/member-profit/${member.id}`}
                          className="font-semibold text-primary hover:underline text-left transition-all block"
                        >
                          {member.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-foreground">₹{Number(member.investmentAmount).toLocaleString()}</td>
                      <td className="px-6 py-4 text-foreground">{member.periodMonths} Months</td>
                      <td className="px-6 py-4 text-foreground font-medium text-muted-foreground">{member.joinedDate}</td>
                      <td className="px-6 py-4 text-foreground text-green-600 font-medium">₹{Number(member.monthlyReturn).toLocaleString()}</td>
                      <td className="px-6 py-4 text-foreground font-bold">₹{Number(member.totalAmount).toLocaleString()}</td>
                      <td className="px-6 py-4 text-right flex justify-end gap-2">
                        <button 
                          onClick={() => handleEdit(member)}
                          className="p-2 text-muted-foreground hover:bg-accent rounded-lg transition-colors"
                          title="Edit member"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => handleDelete(member.id)}
                          className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                          title="Delete member"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ) )
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
};

export default MembersPage;
