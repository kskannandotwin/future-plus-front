import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";

interface MonthlyProfit {
  id: number;
  date: string;
  profit: number;
  loss: number;
  brokerCharge: number;
  netTotal: number;
}

interface Member {
  id: number;
  name: string;
  investmentAmount: number;
}

/** Parse a DD-MM-YYYY string into a timestamp for sorting */
const parseDate = (d: string): number => {
  const [day, month, year] = d.split("-").map(Number);
  return new Date(year, month - 1, day).getTime();
};

const MonthlyProfitPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [member, setMember] = useState<Member | null>(null);
  const [profits, setProfits] = useState<MonthlyProfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    date: "",
    profit: "",
    loss: "",
    brokerCharge: "",
  });

  const API_URL = `http://localhost:3000/members/${id}`;

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");

      // Fetch Member Details
      const memberRes = await fetch(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!memberRes.ok) throw new Error("Failed to fetch member details");
      const memberData = await memberRes.json();
      setMember(memberData);

      // Fetch Profits
      const profitsRes = await fetch(`${API_URL}/profits`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!profitsRes.ok) throw new Error("Failed to fetch profit records");
      const profitsData = await profitsRes.json();
      setProfits(profitsData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  /**
   * Compute a running net total per record ID.
   * Records are sorted chronologically (oldest first) and accumulated as:
   *   runningTotal = investmentAmount + Σ(profit - loss - brokerCharge)
   *
   * The display order in the table remains as returned by the API (newest first).
   */
  const { runningNetTotals, currentBalance } = useMemo(() => {
    const investment = Number(member?.investmentAmount ?? 0);
    const sorted = [...profits].sort((a, b) => parseDate(a.date) - parseDate(b.date));

    let running = investment;
    const totals: Record<number, number> = {};
    sorted.forEach((r) => {
      running += Number(r.profit) - Number(r.loss) - Number(r.brokerCharge ?? 0);
      totals[r.id] = running;
    });

    return { runningNetTotals: totals, currentBalance: running };
  }, [profits, member?.investmentAmount]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const token = localStorage.getItem("access_token");
      const isEditing = editingId !== null;
      const url = isEditing
        ? `http://localhost:3000/members/profits/${editingId}`
        : `${API_URL}/profits`;

      const response = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date: formData.date,
          profit: Number(formData.profit),
          loss: Number(formData.loss),
          brokerCharge: Number(formData.brokerCharge),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `Failed to ${isEditing ? "update" : "add"} profit record`
        );
      }

      setFormData({ date: "", profit: "", loss: "", brokerCharge: "" });
      setShowAddForm(false);
      setEditingId(null);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (profitId: number) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `http://localhost:3000/members/profits/${profitId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) throw new Error("Failed to delete record");
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEdit = (record: MonthlyProfit) => {
    setFormData({
      date: record.date,
      profit: record.profit.toString(),
      loss: record.loss.toString(),
      brokerCharge: (record.brokerCharge || 0).toString(),
    });
    setEditingId(record.id);
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setFormData({ date: "", profit: "", loss: "", brokerCharge: "" });
    setEditingId(null);
    setShowAddForm(false);
  };

  if (loading && !member) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const investment = Number(member?.investmentAmount ?? 0);
  const balanceGained = currentBalance >= investment;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <nav className="flex justify-between items-center px-8 py-4 bg-card border-b border-border shadow-sm">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate("/dashboard")}
        >
          <span className="text-xl font-bold text-primary tracking-tight">
            Future+
          </span>
        </div>
        <button
          className="px-4 py-2 border border-border rounded-xl text-sm font-medium text-muted-foreground hover:bg-accent transition-all"
          onClick={() => navigate("/members")}
        >
          Back to Members
        </button>
      </nav>

      <main className="flex-1 p-6 md:p-10 max-w-5xl w-full mx-auto">
        <header className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-foreground mb-1 tracking-tight">
              {member?.name}'s Profits
            </h1>
            <p className="text-muted-foreground text-sm">
              Original Investment:{" "}
              <span className="font-semibold text-foreground">
                ₹{investment.toLocaleString()}
              </span>
            </p>
            {profits.length > 0 && (
              <p className="text-sm mt-1">
                Current Balance:{" "}
                <span
                  className={`font-bold text-lg ${
                    balanceGained ? "text-green-600" : "text-red-600"
                  }`}
                >
                  ₹{currentBalance.toLocaleString()}
                </span>
                <span
                  className={`ml-2 text-xs font-medium ${
                    balanceGained ? "text-green-500" : "text-red-500"
                  }`}
                >
                  ({balanceGained ? "+" : ""}
                  {(currentBalance - investment).toLocaleString()})
                </span>
              </p>
            )}
          </div>
          <button
            onClick={() => {
              if (editingId) handleCancelEdit();
              else setShowAddForm(!showAddForm);
            }}
            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold shadow-lg hover:translate-y-[-1px] transition-all"
          >
            {editingId ? "Cancel Edit" : showAddForm ? "Cancel" : "Add Record"}
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
              {editingId ? "Edit Profit Record" : "Add Monthly Record"}
            </h2>
            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Date (DD-MM-YYYY)
                </label>
                <input
                  required
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                  placeholder="01-04-2026"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Profit (INR)
                </label>
                <input
                  required
                  type="number"
                  name="profit"
                  value={formData.profit}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Loss (INR)
                </label>
                <input
                  required
                  type="number"
                  name="loss"
                  value={formData.loss}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Broker Charge (INR)
                </label>
                <input
                  required
                  type="number"
                  name="brokerCharge"
                  value={formData.brokerCharge}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                  placeholder="0"
                />
              </div>
              <div className="md:col-span-3">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition-all"
                >
                  {editingId ? "Update Record" : "Save Record"}
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    Date
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    Profit
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    Loss
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    Broker Charge
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    Net Total
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {profits.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-muted-foreground"
                    >
                      {loading ? "Loading..." : "No records found for this member."}
                    </td>
                  </tr>
                ) : (
                  profits.map((record) => {
                    const runningTotal = runningNetTotals[record.id] ?? investment;
                    const isUp = runningTotal >= investment;
                    return (
                      <tr
                        key={record.id}
                        className="hover:bg-accent/5 transition-colors"
                      >
                        <td className="px-6 py-4 font-medium text-foreground">
                          {record.date}
                        </td>
                        <td className="px-6 py-4 text-green-600 font-medium">
                          ₹{Number(record.profit).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-red-600 font-medium">
                          ₹{Number(record.loss).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-orange-600 font-medium">
                          ₹{Number(record.brokerCharge || 0).toLocaleString()}
                        </td>
                        <td
                          className={`px-6 py-4 font-bold ${
                            isUp ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          ₹{runningTotal.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(record)}
                            className="p-2 text-muted-foreground hover:bg-accent rounded-lg transition-colors"
                            title="Edit record"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="18"
                              height="18"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(record.id)}
                            className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                            title="Delete record"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="18"
                              height="18"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
};

export default MonthlyProfitPage;
