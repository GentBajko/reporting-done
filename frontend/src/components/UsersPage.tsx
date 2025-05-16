import React, { useEffect, useState } from "react";
import {
  HiOutlineBriefcase,
  HiOutlineClipboardList,
  HiOutlineEye,
  HiOutlinePencil,
  HiOutlineShieldCheck,
  HiOutlineTrash,
  HiOutlineUserCircle,
  HiPlus,
} from "react-icons/hi";
import Modal from "./Modal";

interface BasicProject {
  id: string;
  name: string;
}

interface BasicTask {
  id: string;
  title: string;
}

interface User {
  id: string;
  email: string;
  full_name: string;
  permissions: number;
  tasks: BasicTask[];
  projects: BasicProject[];
}

interface EditUserData {
  full_name: string;
  email: string;
  permissions: number;
}

interface NewUserData {
  email: string;
  password: string;
  full_name: string;
  permissions: number;
}

const getPermissionsRole = (
  permissions: number
): { role: string; Icon: React.ElementType; className: string } => {
  if (permissions === 1) {
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newUserFullName, setNewUserFullName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserPermissions, setNewUserPermissions] = useState(0);

  const [editUserFullName, setEditUserFullName] = useState("");
  const [editUserEmail, setEditUserEmail] = useState("");
  const [editUserPermissions, setEditUserPermissions] = useState(0);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("/user/", {
          headers: {
            Accept: "application/json",
          },
        });
        if (!response.ok) {
          const errData = await response
            .json()
            .catch(() => ({ detail: `Error: ${response.status}` }));
          throw new Error(errData.detail || "Failed to fetch users");
        }
        const data: User[] = await response.json();
        setUsers(data);
      } catch (err: any) {
        console.error("Error fetching users:", err);
        setError(err.message || "Could not load users.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    setNewUserFullName("");
    setNewUserEmail("");
    setNewUserPassword("");
    setNewUserPermissions(0);
  };

  const openEditModal = (userToEdit: User) => {
    setEditingUser(userToEdit);
    setEditUserFullName(userToEdit.full_name);
    setEditUserEmail(userToEdit.email);
    setEditUserPermissions(userToEdit.permissions);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingUser(null);
    setEditUserFullName("");
    setEditUserEmail("");
    setEditUserPermissions(0);
  };

  const handleCreateUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (newUserPassword.length < 8) {
      alert("Password must be at least 8 characters long.");
      return;
    }

    setIsCreating(true);
    setError(null);

    const formData = new FormData();
    formData.append("full_name", newUserFullName);
    formData.append("email", newUserEmail);
    formData.append("password", newUserPassword);
    formData.append("permissions", String(newUserPermissions));

    try {
      const response = await fetch("/user/", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ detail: "User creation failed. Unknown error." }));
        throw new Error(
          errorData.detail || `HTTP error! status: ${response.status}`
        );
      }
      const createdUser: User = await response.json();
      setUsers(
        [createdUser, ...users].sort((a, b) =>
          a.full_name.localeCompare(b.full_name)
        )
      );
      closeModal();
      alert(`User "${createdUser.full_name}" created successfully!`);
    } catch (err: any) {
      console.error("Error creating user:", err);
      setError(err.message || "Failed to create user.");
      alert(`Error creating user: ${err.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingUser) return;

    setIsSavingEdit(true);
    setError(null);

    const updatedData: Partial<EditUserData> = {};
    if (editUserFullName !== editingUser.full_name)
      updatedData.full_name = editUserFullName;
    if (editUserEmail !== editingUser.email) updatedData.email = editUserEmail;
    if (editUserPermissions !== editingUser.permissions)
      updatedData.permissions = editUserPermissions;

    if (Object.keys(updatedData).length === 0) {
      setIsSavingEdit(false);
      closeEditModal();
      alert("No changes detected.");
      return;
    }

    try {
      const response = await fetch(`/user/${editingUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ detail: "User update failed. Unknown error." }));
        throw new Error(
          errorData.detail || `HTTP error! status: ${response.status}`
        );
      }
      const updatedUserResponse: User = await response.json();
      setUsers(
        users
          .map((u) =>
            u.id === updatedUserResponse.id ? updatedUserResponse : u
          )
          .sort((a, b) => a.full_name.localeCompare(b.full_name))
      );
      closeEditModal();
      alert(`User "${updatedUserResponse.full_name}" updated successfully!`);
    } catch (err: any) {
      console.error("Error updating user:", err);
      setError(err.message || "Failed to update user.");
      alert(`Error updating user: ${err.message}`);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (
      !window.confirm(
        `Are you sure you want to delete user "${userName}" (ID: ${userId})? This action cannot be undone.`
      )
    ) {
      return;
    }
    setError(null);
    try {
      const response = await fetch(`/user/${userId}`, {});

      if (!response.ok) {
        if (response.status === 404) throw new Error("User not found.");
        if (response.status === 403)
          throw new Error("Access forbidden to delete this user.");
        if (response.status === 400) {
          const errorData = await response
            .json()
            .catch(() => ({ detail: "Bad request" }));
          throw new Error(errorData.detail || "Cannot delete user.");
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      setUsers(users.filter((user) => user.id !== userId));
      alert(`User "${userName}" deleted successfully.`);
    } catch (err: any) {
      console.error("Error deleting user:", err);
      setError(err.message || "Failed to delete user.");
      alert(`Error deleting user: ${err.message}`);
    }
  };

  if (isLoading) {
    return <div className="p-6 text-center">Loading users...</div>;
  }

  if (error && users.length === 0) {
    return (
      <div className="p-6 bg-red-100 border border-red-400 text-red-700 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-2">Error Loading Users</h2>
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <button
          onClick={openModal}
          className="bg-[#002F41] hover:bg-[#004057] text-white font-semibold py-2 px-4 rounded inline-flex items-center transition duration-150"
        >
          <HiPlus className="mr-2 h-5 w-5" />
          Create New User
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Full Name
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Email
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Role / Permissions
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Assignments
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.length === 0 && !isLoading && (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  No users found.
                  {isModalOpen ? "" : " Click 'Create New User' to add one."}
                </td>
              </tr>
            )}
            {users.map((user) => {
              const roleInfo = getPermissionsRole(user.permissions);
              return (
                <tr
                  key={user.id}
                  className="hover:bg-gray-50 transition duration-150"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-left">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold">
                          {user.full_name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .substring(0, 2)}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.full_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          ID: {user.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-left">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-left">
                    <span
                      className={`px-2.5 py-0.5 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${roleInfo.className}`}
                    >
                      <roleInfo.Icon className={`mr-1.5 h-4 w-4`} />
                      {roleInfo.role} (P: {user.permissions})
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-left">
                    <div className="flex items-center text-xs">
                      <HiOutlineBriefcase className="h-4 w-4 mr-1 text-gray-500" />{" "}
                      Projects: {user.projects.length}
                    </div>
                    <div className="flex items-center text-xs mt-1">
                      <HiOutlineClipboardList className="h-4 w-4 mr-1 text-gray-500" />{" "}
                      Tasks: {user.tasks.length}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => alert(`View ${user.full_name} - TBD`)}
                      className="text-[#002F41] hover:text-[#004057] mr-2 p-1 rounded hover:bg-gray-200 transition duration-150"
                      title="View User"
                    >
                      <HiOutlineEye className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => openEditModal(user)}
                      className="text-indigo-600 hover:text-indigo-900 mr-2 p-1 rounded hover:bg-gray-200 transition duration-150"
                      title="Edit User"
                    >
                      <HiOutlinePencil className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id, user.full_name)}
                      className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-gray-200 transition duration-150"
                      title="Delete User"
                    >
                      <HiOutlineTrash className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded-md">
          Error during user operation: {error}. Some data may be stale or
          incomplete.
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={closeModal} title="Create New User">
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label
              htmlFor="userName"
              className="block text-sm font-medium text-gray-700"
            >
              Full Name
            </label>
            <input
              type="text"
              name="userName"
              id="userName"
              value={newUserFullName}
              onChange={(e) => setNewUserFullName(e.target.value)}
              required
              className="mt-1 block w-full input-standard"
            />
          </div>
          <div>
            <label
              htmlFor="userEmail"
              className="block text-sm font-medium text-gray-700"
            >
              Email Address
            </label>
            <input
              type="email"
              name="userEmail"
              id="userEmail"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              required
              className="mt-1 block w-full input-standard"
            />
          </div>
          <div>
            <label
              htmlFor="userPassword"
              className="block text-sm font-medium text-gray-700"
            >
              Password (min 8 characters)
            </label>
            <input
              type="password"
              name="userPassword"
              id="userPassword"
              value={newUserPassword}
              onChange={(e) => setNewUserPassword(e.target.value)}
              required
              minLength={8}
              className="mt-1 block w-full input-standard"
            />
          </div>
          <div>
            <label
              htmlFor="userPermissions"
              className="block text-sm font-medium text-gray-700"
            >
              Permissions Level (Role)
            </label>
            <select
              id="userPermissions"
              value={newUserPermissions}
              onChange={(e) => setNewUserPermissions(Number(e.target.value))}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value={0}>User</option>
              <option value={1}>Admin</option>
            </select>
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={closeModal}
              disabled={isCreating}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition duration-150 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="px-4 py-2 text-sm font-medium text-white bg-[#002F41] hover:bg-[#004057] rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#002F41] transition duration-150 disabled:opacity-50"
            >
              {isCreating ? "Creating..." : "Create User"}
            </button>
          </div>
        </form>
      </Modal>

      {editingUser && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={closeEditModal}
          title={`Edit User: ${editingUser.full_name}`}
        >
          <form onSubmit={handleUpdateUser} className="space-y-4">
            <div>
              <label
                htmlFor="editUserFullName"
                className="block text-sm font-medium text-gray-700"
              >
                Full Name
              </label>
              <input
                type="text"
                id="editUserFullName"
                value={editUserFullName}
                onChange={(e) => setEditUserFullName(e.target.value)}
                required
                className="mt-1 block w-full input-standard"
              />
            </div>
            <div>
              <label
                htmlFor="editUserEmail"
                className="block text-sm font-medium text-gray-700"
              >
                Email Address
              </label>
              <input
                type="email"
                id="editUserEmail"
                value={editUserEmail}
                onChange={(e) => setEditUserEmail(e.target.value)}
                required
                className="mt-1 block w-full input-standard"
              />
            </div>
            <div>
              <label
                htmlFor="editUserPermissions"
                className="block text-sm font-medium text-gray-700"
              >
                Permissions Level (Role)
              </label>
              <select
                id="editUserPermissions"
                value={editUserPermissions}
                onChange={(e) => setEditUserPermissions(Number(e.target.value))}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value={0}>User</option>
                <option value={1}>Admin</option>
              </select>
            </div>
            <div className="pt-2 text-xs text-gray-500">
              User ID: {editingUser.id} (Password cannot be changed here)
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={closeEditModal}
                disabled={isSavingEdit}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition duration-150 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingEdit}
                className="px-4 py-2 text-sm font-medium text-white bg-[#002F41] hover:bg-[#004057] rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#002F41] transition duration-150 disabled:opacity-50"
              >
                {isSavingEdit ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default UsersPage;
