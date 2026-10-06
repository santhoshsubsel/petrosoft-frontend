
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import GenericPage from "./GenericPage";
import { getResource } from "../services/resourceService";

interface UserRow { id: string; name: string; email: string; status: string; role?: { name: string } | string }

export default function Users() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    getResource<UserRow[]>("/users")
      .then(setUsers)
      .catch((err) => setError(err?.response?.data?.message || "Unable to load users."))
      .finally(() => setLoading(false));
  }, []);

  const getRole = (user: UserRow) =>
    typeof user.role === "object" ? user.role?.name ?? "-" : user.role || "-";
  const filteredUsers = users.filter((user) => {
    const role = getRole(user).toUpperCase();
    const status = user.status.toUpperCase();
    const matchesSearch = `${user.name} ${user.email} ${role} ${status}`
      .toLowerCase()
      .includes(search.trim().toLowerCase());
    return matchesSearch &&
      (roleFilter === "ALL" || role === roleFilter) &&
      (statusFilter === "ALL" || status === statusFilter);
  });

  return <GenericPage
    title="User Management"
    subtitle="Manage Admin and Manager access with role-based permissions."
    action="Invite User"
    searchValue={search}
    onSearchChange={setSearch}
    filterContent={(
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          Role
          <select className="rounded-lg border border-slate-200 bg-white px-3 py-2" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
            <option value="ALL">All roles</option>
            <option value="ADMIN">Admin</option>
            <option value="MANAGER">Manager</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          Status
          <select className="rounded-lg border border-slate-200 bg-white px-3 py-2" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </label>
        <button type="button" className="text-sm font-semibold text-brand-600" onClick={() => { setRoleFilter("ALL"); setStatusFilter("ALL"); setSearch(""); }}>Clear filters</button>
      </div>
    )}
    exportData={{
      headers: ["Name", "Email", "Role", "Status"],
      rows: filteredUsers.map((user) => [user.name, user.email, getRole(user), user.status]),
    }}
  >
    <div className="card overflow-hidden">
      {loading ? <div className="grid min-h-40 place-items-center"><Loader2 className="animate-spin text-brand-600"/></div> : error ? <div className="p-5 text-sm text-red-600">{error}</div> : (
        <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-sm">
          <thead className="bg-slate-50 text-xs text-slate-400"><tr><th className="px-5 py-3 text-left">Name</th><th>Email</th><th>Role</th><th>Status</th></tr></thead>
          <tbody>{filteredUsers.map((user) => <tr key={user.id} className="border-t border-slate-100"><td className="px-5 py-4 font-bold">{user.name}</td><td>{user.email}</td><td>{getRole(user)}</td><td><span className="badge bg-emerald-50 text-emerald-600">{user.status}</span></td></tr>)}{!filteredUsers.length && <tr><td colSpan={4} className="p-10 text-center text-slate-400">No users match these filters.</td></tr>}</tbody>
        </table></div>
      )}
    </div>
  </GenericPage>;
}
