import React, { useEffect, useState } from "react";
import {
  HiOutlineBriefcase,
  HiOutlineClipboardList,
  HiOutlineEye,
  HiOutlinePencil,
  HiOutlineShieldCheck,
  HiOutlineTrash,
  HiOutlineUserCircle,
  HiX
} from "react-icons/hi";
import Modal from "./Modal";
import DataTable from "./common/DataTable";
import FloatingActionButton from "./common/FloatingActionButton";
import { useApi } from "../hooks/useApi";
import type { User, PaginatedResponse, Pagination } from "../types";

const getPermissionsRole = (
  permissions: number
): { role: string; Icon: React.ElementType; className: string } => {
    // Simplified logic based on current knowledge
  if (permissions >= 127) { // Assuming Admin is high number or specific flag set
    return {
      role: "Admin",
      Icon: HiOutlineShieldCheck,
      className: "bg-purple-100 text-purple-700",
    };
  }
  if (permissions & 1) { // Check bit 1 for Manage Users as Admin indicator? Or just assume 1 is Admin from previous code
       return {
      role: "Admin",
      Icon: HiOutlineShieldCheck,
      className: "bg-purple-100 text-purple-700",
    };
  }
  return {
    role: "User",
    Icon: HiOutlineUserCircle,
    className: "bg-blue-100 text-blue-700",
  };
};

const UsersPage = () => {
  const { request } = useApi();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);

  // Additional state for viewing details
  const [userStats, setUserStats] = useState<{projects: number, tasks: number, logs: number} | null>(null);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    permissions: 0,
  });

  const fetchUsers = async (page: number = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: "15",
      });

      const response = await request<PaginatedResponse<User>>(`/user/?${queryParams.toString()}`);
      
      if (response.items) {
          setUsers(response.items);
          setPagination({
             page: response.page,
             per_page: response.per_page,
             total: response.total,
             total_pages: Math.ceil(response.total / response.per_page),
             has_next: response.has_next,
             has_prev: response.has_prev
          });
      } else {
          setUsers([]);
      }
    } catch (e: any) {
      setError(e.message || "Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(currentPage);
  }, [currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const openModal = () => {
    setFormData({
        full_name: "",
        email: "",
        password: "",
        permissions: 0,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      full_name: user.full_name,
      email: user.email,
      password: "", // Password not editable directly here usually
      permissions: user.permissions,
    });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingUser(null);
  };

  const openViewModal = async (user: User) => {
      setViewingUser(user);
      setIsViewModalOpen(true);
      setUserStats(null);
      
      try {
          // Parallel fetch for counts if not present in user object
          // Using limit=1 just to get 'total' from pagination
          const [projRes, taskRes, logRes] = await Promise.all([
              request<PaginatedResponse<any>>(`/user/${user.id}/projects?limit=1`),
              request<PaginatedResponse<any>>(`/user/${user.id}/tasks?limit=1`),
              request<PaginatedResponse<any>>(`/user/${user.id}/logs?limit=1`)
          ]);

          setUserStats({
              projects: projRes.total,
              tasks: taskRes.total,
              logs: logRes.total
          });
      } catch (e) {
          console.error("Failed to fetch user stats", e);
      }
  };

  const closeViewModal = () => {
      setIsViewModalOpen(false);
      setViewingUser(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'permissions' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
          full_name: formData.full_name,
          email: formData.email,
          permissions: formData.permissions
      };
      
      if (!isEditModalOpen) {
          payload.password = formData.password;
      }

      if (isEditModalOpen && editingUser) {
        await request(`/user/${editingUser.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        alert("User updated successfully!");
        closeEditModal();
      } else {
        await request("/user/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        alert("User created successfully!");
        closeModal();
      }
      fetchUsers(currentPage);
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await request(`/user/${id}`, { method: "DELETE" });
      alert("User deleted successfully");
      fetchUsers(currentPage);
    } catch (e: any) {
      alert(`Error deleting user: ${e.message}`);
    }
  };

  const columns = [
    {
      header: "User",
      accessor: (user: User) => (
        <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold mr-3">
                {user.full_name.substring(0, 2).toUpperCase()}
            </div>
            <div>
                <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                <div className="text-xs text-gray-500">ID: {user.id}</div>
            </div>
        </div>
      ),
    },
    {
      header: "Email",
      accessor: "email" as keyof User,
    },
    {
      header: "Role",
      accessor: (user: User) => {
          const { role, Icon, className } = getPermissionsRole(user.permissions);
          return (
            <span className={`px-2.5 py-0.5 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${className}`}>
                <Icon className="mr-1.5 h-4 w-4" /> {role}
            </span>
          );
      },
    },
    {
      header: "Assignments",
      accessor: (user: User) => (
          <div className="text-xs text-gray-500 space-y-1">
              <div className="flex items-center"><HiOutlineBriefcase className="mr-1"/> Projects: {user.projects?.length || '?'}</div>
              <div className="flex items-center"><HiOutlineClipboardList className="mr-1"/> Tasks: {user.tasks?.length || '?'}</div>
          </div>
      )
    },
    {
      header: "Actions",
      className: "text-right",
      render: (user: User) => (
        <div className="flex justify-end space-x-2">
          <button onClick={() => openViewModal(user)} className="text-[#002F41] hover:text-[#004057] p-1">
            <HiOutlineEye className="h-5 w-5" />
          </button>
          <button onClick={() => openEditModal(user)} className="text-indigo-600 hover:text-indigo-900 p-1">
            <HiOutlinePencil className="h-5 w-5" />
          </button>
          <button onClick={() => handleDelete(user.id)} className="text-red-600 hover:text-red-900 p-1">
            <HiOutlineTrash className="h-5 w-5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {error && <div className="text-red-600 bg-red-100 p-3 rounded mx-2">{error}</div>}

      <DataTable
        columns={columns}
        data={users}
        pagination={pagination}
        onPageChange={handlePageChange}
        isLoading={isLoading}
      />

      <FloatingActionButton onClick={openModal} title="Create New User" />

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen || isEditModalOpen}
        onClose={isEditModalOpen ? closeEditModal : closeModal}
        title={isEditModalOpen ? "Edit User" : "Create New User"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name *</label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full input-standard p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full input-standard p-2 border rounded"
            />
          </div>
          {!isEditModalOpen && (
            <div>
                <label className="block text-sm font-medium text-gray-700">Password *</label>
                <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                minLength={8}
                className="mt-1 block w-full input-standard p-2 border rounded"
                />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700">Permissions Level</label>
             <select
                  name="permissions"
                  value={formData.permissions}
                  onChange={handleInputChange}
                  className="mt-1 block w-full p-2 border rounded"
              >
                  <option value={0}>User</option>
                  <option value={1}>Admin</option>
                  {/* Add more specific roles if known */}
              </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={isEditModalOpen ? closeEditModal : closeModal}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-[#002F41] hover:bg-[#004057] rounded-md"
            >
              {isEditModalOpen ? "Save Changes" : "Create User"}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      {viewingUser && (
          <div className={`fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-gray-500 bg-opacity-75 p-4 sm:p-6 ${isViewModalOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <div className="relative w-full max-w-lg transform rounded-lg bg-white shadow-xl">
                  <div className="flex items-center justify-between border-b px-4 py-3">
                      <h3 className="text-lg font-medium leading-6 text-gray-900">User Profile: {viewingUser.full_name}</h3>
                      <button onClick={closeViewModal} className="text-gray-400 hover:text-gray-500">
                          <HiX className="h-6 w-6" />
                      </button>
                  </div>
                  <div className="p-6 space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <h4 className="text-sm font-medium text-gray-500">Email</h4>
                              <p className="mt-1 text-gray-900">{viewingUser.email}</p>
                          </div>
                          <div>
                              <h4 className="text-sm font-medium text-gray-500">Role</h4>
                              <p className="mt-1 text-gray-900">{getPermissionsRole(viewingUser.permissions).role}</p>
                          </div>
                      </div>
                      
                      <div className="border-t pt-4">
                          <h4 className="text-md font-medium text-gray-900 mb-3">Statistics</h4>
                          {userStats ? (
                              <div className="grid grid-cols-3 gap-4 text-center">
                                  <div className="bg-blue-50 p-3 rounded-lg">
                                      <div className="text-2xl font-bold text-blue-600">{userStats.projects}</div>
                                      <div className="text-xs text-gray-500">Projects</div>
                                  </div>
                                  <div className="bg-green-50 p-3 rounded-lg">
                                      <div className="text-2xl font-bold text-green-600">{userStats.tasks}</div>
                                      <div className="text-xs text-gray-500">Tasks</div>
                                  </div>
                                  <div className="bg-purple-50 p-3 rounded-lg">
                                      <div className="text-2xl font-bold text-purple-600">{userStats.logs}</div>
                                      <div className="text-xs text-gray-500">Logs</div>
                                  </div>
                              </div>
                          ) : (
                              <div className="text-center text-gray-500">Loading stats...</div>
                          )}
                      </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 rounded-b-lg">
                      <button
                          type="button"
                          onClick={closeViewModal}
                          className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                      >
                          Close
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default UsersPage;
