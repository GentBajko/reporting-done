import { useState } from "react";
import {
  HiOutlineBriefcase,
  HiOutlineClipboardList,
  HiOutlineEye,
  HiOutlinePencil,
  HiOutlineShieldCheck,
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

interface NewUserData {
  email: string;
  password: string;
  full_name: string;
  permissions: number;
}

const mockUsersData: User[] = [
  {
    id: "usr-ulid-1",
    email: "alice.admin@example.com",
    full_name: "Alice Wonderland (Admin)",
    permissions: 1,
    tasks: [
      { id: "task-1", title: "Design Review" },
      { id: "task-2", title: "API Spec" },
    ],
    projects: [{ id: "proj-1", name: "Project Alpha" }],
  },
  {
    id: "usr-ulid-2",
    email: "bob.user@example.com",
    full_name: "Bob The Builder",
    permissions: 0,
    tasks: [{ id: "task-3", title: "Frontend Implementation" }],
    projects: [
      { id: "proj-1", name: "Project Alpha" },
      { id: "proj-2", name: "Project Beta" },
    ],
  },
  {
    id: "usr-ulid-3",
    email: "carol.inactive@example.com",
    full_name: "Carol Danvers (User)",
    permissions: 0,
    tasks: [],
    projects: [],
  },
];

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
  const [users, setUsers] = useState<User[]>(mockUsersData);

  const [newUserFullName, setNewUserFullName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserPermissions, setNewUserPermissions] = useState<number>(0);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    setNewUserFullName("");
    setNewUserEmail("");
    setNewUserPassword("");
    setNewUserPermissions(0);
  };

  const handleCreateUser = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (newUserPassword.length < 8) {
      alert("Password must be at least 8 characters long.");
      return;
    }

    const userToCreate: NewUserData = {
      full_name: newUserFullName,
      email: newUserEmail,
      password: newUserPassword,
      permissions: newUserPermissions,
    };

    const createdUser: User = {
      id: String(Date.now()),
      ...userToCreate,
      tasks: [],
      projects: [],
    };

    setUsers([createdUser, ...users]);
    closeModal();
    alert(
      `User "${
        createdUser.full_name
      }" created! (mock)\n(Data for backend: ${JSON.stringify({
        ...userToCreate,
        password: "********",
      })})`
    );
  };

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
                      onClick={() => alert(`Edit ${user.full_name} - TBD`)}
                      className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-gray-200 transition duration-150"
                      title="Edit User"
                    >
                      <HiOutlinePencil className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {users.length === 0 && (
        <div className="text-center py-10 bg-white shadow-md rounded-lg">
          <p className="text-gray-500">
            No users found. Get started by creating a new one!
          </p>
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
              name="userPermissions"
              id="userPermissions"
              value={newUserPermissions}
              onChange={(e) =>
                setNewUserPermissions(parseInt(e.target.value, 10))
              }
              className="mt-1 block w-full input-standard"
            >
              <option value={0}>User</option>
              <option value={1}>Admin</option>
            </select>
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition duration-150"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-[#002F41] hover:bg-[#004057] rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#002F41] transition duration-150"
            >
              Create User
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UsersPage;
