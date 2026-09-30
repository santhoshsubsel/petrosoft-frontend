
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import GenericPage from "./GenericPage";
import { getResource } from "../services/resourceService";

interface UserRow { id: string; name: string; email: string; status: string; role?: { name: string } | string }

export default function Users() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getResource<UserRow[]>("/users")
      .then(setUsers)
      .catch((err) => setError(err?.response?.data?.message || "Unable to load users."))
      .finally(() => setLoading(false));
  }, []);

  return <GenericPage title="User Management" subtitle="Manage Admin and Manager access with role-based permissions." action="Invite User">
    <div className="card overflow-hidden">
      {loading ? <div className="grid min-h-40 place-items-center"><Loader2 className="animate-spin text-brand-600"/></div> : error ? <div className="p-5 text-sm text-red-600">{error}</div> : (
        <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-sm">
          <thead className="bg-slate-50 text-xs text-slate-400"><tr><th className="px-5 py-3 text-left">Name</th><th>Email</th><th>Role</th><th>Status</th></tr></thead>
          <tbody>{users.map((user) => <tr key={user.id} className="border-t border-slate-100"><td className="px-5 py-4 font-bold">{user.name}</td><td>{user.email}</td><td>{typeof user.role === "object" ? user.role?.name : user.role || "-"}</td><td><span className="badge bg-emerald-50 text-emerald-600">{user.status}</span></td></tr>)}{!users.length && <tr><td colSpan={4} className="p-10 text-center text-slate-400">No users found.</td></tr>}</tbody>
        </table></div>
      )}
    </div>
  </GenericPage>;
}
