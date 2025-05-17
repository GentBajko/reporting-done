import React, { useEffect, useState } from "react";
import {
  HiOutlineEye,
  HiOutlineMail,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineUserGroup,
  HiPlus,
} from "react-icons/hi";
import Modal from "./Modal";

interface BasicUser {
  id: string;
  full_name: string;
}

interface BasicTask {
  id: string;
  title: string;
  status?: string;
}

interface Project {
  id: string;
  name: string;
  email: string | null;
  send_email: boolean;
  archived: boolean;
  developers: BasicUser[];
  tasks: BasicTask[];
}

interface NewProjectData {
  name: string;
  email: string | null;
  send_email: boolean;
  archived: boolean;
}

interface ProjectFormData {
  name: string;
  email: string | null;
  send_email: boolean;
  archived: boolean;
}

const mockProjectsData: Project[] = [
  {
    id: "proj-1",
    name: "Project Alpha",
    email: "alpha_client@example.com",
    send_email: true,
    archived: false,
    developers: [
      { id: "usr-1", full_name: "Alice" },
      { id: "usr-2", full_name: "Bob" },
    ],
    tasks: [{ id: "task-1", title: "Design Homepage", status: "In Progress" }],
  },
  {
    id: "proj-2",
    name: "Project Beta",
    email: null,
    send_email: false,
    archived: false,
    developers: [{ id: "usr-3", full_name: "Carol" }],
    tasks: [
      { id: "task-2", title: "API Development", status: "To Do" },
      { id: "task-3", title: "Testing", status: "Done" },
    ],
  },
  {
    id: "proj-3",
    name: "Old Initiative Gamma",
    email: "gamma_contact@example.com",
    send_email: false,
    archived: true,
    developers: [],
    tasks: [],
  },
];

const getStatusClass = (archived: boolean) => {
  if (archived) {
    return "bg-gray-100 text-gray-800";
  }
  return "bg-green-100 text-green-800";
};

const ProjectsPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectEmail, setNewProjectEmail] = useState("");
  const [newProjectSendEmail, setNewProjectSendEmail] = useState(false);
  const [newProjectArchived, setNewProjectArchived] = useState(false);

  const [editProjectName, setEditProjectName] = useState("");
  const [editProjectEmail, setEditProjectEmail] = useState("");
  const [editProjectSendEmail, setEditProjectSendEmail] = useState(false);
  const [editProjectArchived, setEditProjectArchived] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("/project/");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: Project[] = await response.json();
        setProjects(data);
      } catch (e: any) {
        console.error("Failed to fetch projects:", e);
        setError(e.message || "Failed to load projects");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    setNewProjectName("");
    setNewProjectEmail("");
    setNewProjectSendEmail(false);
    setNewProjectArchived(false);
  };

  const openEditModal = (projectToEdit: Project) => {
    setEditingProject(projectToEdit);
    setEditProjectName(projectToEdit.name);
    setEditProjectEmail(projectToEdit.email || "");
    setEditProjectSendEmail(projectToEdit.send_email);
    setEditProjectArchived(projectToEdit.archived);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingProject(null);
    setEditProjectName("");
    setEditProjectEmail("");
    setEditProjectSendEmail(false);
    setEditProjectArchived(false);
  };

  const handleCreateProject = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const formData = new FormData();
    formData.append("name", newProjectName);
    formData.append("email", newProjectEmail);
    formData.append("send_email", String(newProjectSendEmail));
    formData.append("archived", String(newProjectArchived));

    try {
      const response = await fetch("/project/", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          detail: "Failed to create project. Unknown error.",
        }));
        throw new Error(
          errorData.detail || `HTTP error! status: ${response.status}`
        );
      }

      const createdProject: Project = await response.json();

      setProjects([createdProject, ...projects]);
      closeModal();

      alert(`Project "${createdProject.name}" created successfully!`);
    } catch (e: any) {
      console.error("Failed to create project:", e);
      setError(e.message || "Failed to create project");
      alert(`Error creating project: ${e.message}`);
    }
  };

  const handleUpdateProject = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    if (!editingProject) return;

    const projectToUpdate: ProjectFormData = {
      name: editProjectName,
      email: editProjectEmail === "" ? null : editProjectEmail,
      send_email: editProjectSendEmail,
      archived: editProjectArchived,
    };

    const formData = new FormData();
    formData.append("name", editProjectName);
    formData.append("email", editProjectEmail);
    formData.append("send_email", String(editProjectSendEmail));
    formData.append("archived", String(editProjectArchived));

    try {
      const response = await fetch(`/project/${editingProject.id}`, {
        method: "PUT",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          detail: "Failed to update project. Unknown error.",
        }));
        throw new Error(
          errorData.detail || `HTTP error! status: ${response.status}`
        );
      }

      const updatedProject: Project = await response.json();

      setProjects(
        projects.map((p) => (p.id === updatedProject.id ? updatedProject : p))
      );
      closeEditModal();
      alert(`Project "${updatedProject.name}" updated successfully!`);
    } catch (e: any) {
      console.error("Failed to update project:", e);
      setError(e.message || "Failed to update project");
      alert(`Error updating project: ${e.message}`);
    }
  };

  const handleDeleteProject = async (
    projectId: string,
    projectName: string
  ) => {
    if (
      !window.confirm(
        `Are you sure you want to delete project "${projectName}" (ID: ${projectId})? This action cannot be undone.`
      )
    ) {
      return;
    }
    setError(null);
    try {
      const response = await fetch(`/project/${projectId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        if (response.status === 404) throw new Error("Project not found.");
        if (response.status === 403)
          throw new Error("Access forbidden to delete this project.");

        const errorData = await response
          .json()
          .catch(() => ({ detail: "Cannot delete project" }));
        throw new Error(
          errorData.detail || `HTTP error! status: ${response.status}`
        );
      }

      setProjects(projects.filter((p) => p.id !== projectId));
      alert(`Project "${projectName}" deleted successfully.`);
    } catch (err: any) {
      console.error("Error deleting project:", err);
      setError(err.message || "Failed to delete project.");
      alert(`Error deleting project: ${err.message}`);
    }
  };

  if (isLoading) {
    return <div className="p-6 text-center">Loading projects...</div>;
  }

  if (error && projects.length === 0) {
    return (
      <div className="p-6 bg-red-100 border border-red-400 text-red-700 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-2">Error Loading Projects</h2>
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
        {/* Title is now in the main header, so we might not need one here explicitly, or it could be a sub-header */}
        {/* <h1 className="text-2xl font-semibold text-gray-800">Projects</h1> */}
        <button
          onClick={openModal}
          className="bg-[#002F41] hover:bg-[#004057] text-white font-semibold py-2 px-4 rounded inline-flex items-center transition duration-150"
        >
          <HiPlus className="mr-2 h-5 w-5" />
          Create New Project
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
                Project Name
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
                Developers
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Tasks
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Status
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {projects.length === 0 && !isLoading && (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  No projects found.
                  {isModalOpen ? "" : " Click 'Create New Project' to add one."}
                </td>
              </tr>
            )}
            {projects.map((project) => (
              <tr
                key={project.id}
                className="hover:bg-gray-50 transition duration-150"
              >
                <td className="px-6 py-4 whitespace-nowrap text-left">
                  <div className="text-sm font-medium text-gray-900">
                    {project.name}
                  </div>
                  <div className="text-xs text-gray-500">ID: {project.id}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-left">
                  {project.email ? (
                    <a
                      href={`mailto:${project.email}`}
                      className="text-sm text-indigo-600 hover:text-indigo-900 flex items-center"
                    >
                      <HiOutlineMail className="h-4 w-4 mr-1.5" />{" "}
                      {project.email}
                    </a>
                  ) : (
                    <span className="text-sm text-gray-500">N/A</span>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    {project.send_email
                      ? "Email notifications on"
                      : "Email notifications off"}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-left">
                  {project.developers.length > 0 ? (
                    <div className="flex items-center">
                      <HiOutlineUserGroup className="h-4 w-4 mr-1.5 text-gray-500" />
                      {project.developers
                        .map((dev) => dev.full_name)
                        .join(", ")}{" "}
                      ({project.developers.length})
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500">No developers</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-left">
                  {project.tasks.length} task(s)
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-left">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(
                      project.archived
                    )}`}
                  >
                    {project.archived ? "Archived" : "Active"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => alert(`View ${project.name} - TBD`)}
                    className="text-[#002F41] hover:text-[#004057] mr-2 p-1 rounded hover:bg-gray-200 transition duration-150"
                    title="View Project"
                  >
                    <HiOutlineEye className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => openEditModal(project)}
                    className="text-indigo-600 hover:text-indigo-900 mr-2 p-1 rounded hover:bg-gray-200 transition duration-150"
                    title="Edit Project"
                  >
                    <HiOutlinePencil className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() =>
                      handleDeleteProject(project.id, project.name)
                    }
                    className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-gray-200 transition duration-150"
                    title="Delete Project"
                  >
                    <HiOutlineTrash className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded-md">
          Error creating project: {error}. Some data might be stale.
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title="Create New Project"
      >
        <form onSubmit={handleCreateProject} className="space-y-4">
          <div>
            <label
              htmlFor="projectName"
              className="block text-sm font-medium text-gray-700"
            >
              Project Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="projectName"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="projectEmail"
              className="block text-sm font-medium text-gray-700"
            >
              Client Email (Optional)
            </label>
            <input
              type="email"
              id="projectEmail"
              value={newProjectEmail}
              onChange={(e) => setNewProjectEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div className="flex items-center">
            <input
              id="sendEmail"
              type="checkbox"
              checked={newProjectSendEmail}
              onChange={(e) => setNewProjectSendEmail(e.target.checked)}
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <label
              htmlFor="sendEmail"
              className="ml-2 block text-sm text-gray-900"
            >
              Send Email Notifications
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="archived"
              type="checkbox"
              checked={newProjectArchived}
              onChange={(e) => setNewProjectArchived(e.target.checked)}
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <label
              htmlFor="archived"
              className="ml-2 block text-sm text-gray-900"
            >
              Archive this project
            </label>
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-[#002F41] border border-transparent rounded-md shadow-sm hover:bg-[#004057] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00283a]"
            >
              Create Project
            </button>
          </div>
        </form>
      </Modal>

      {editingProject && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={closeEditModal}
          title={`Edit Project: ${editingProject.name}`}
        >
          <form onSubmit={handleUpdateProject} className="space-y-4">
            <div>
              <label
                htmlFor="editProjectName"
                className="block text-sm font-medium text-gray-700"
              >
                Project Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="editProjectName"
                value={editProjectName}
                onChange={(e) => setEditProjectName(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="editProjectEmail"
                className="block text-sm font-medium text-gray-700"
              >
                Client Email (Optional)
              </label>
              <input
                type="email"
                id="editProjectEmail"
                value={editProjectEmail}
                onChange={(e) => setEditProjectEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div className="flex items-center">
              <input
                id="editSendEmail"
                type="checkbox"
                checked={editProjectSendEmail}
                onChange={(e) => setEditProjectSendEmail(e.target.checked)}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label
                htmlFor="editSendEmail"
                className="ml-2 block text-sm text-gray-900"
              >
                Send Email Notifications
              </label>
            </div>
            <div className="flex items-center">
              <input
                id="editArchived"
                type="checkbox"
                checked={editProjectArchived}
                onChange={(e) => setEditProjectArchived(e.target.checked)}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label
                htmlFor="editArchived"
                className="ml-2 block text-sm text-gray-900"
              >
                Archive this project
              </label>
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={closeEditModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-[#002F41] border border-transparent rounded-md shadow-sm hover:bg-[#004057] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00283a]"
              >
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default ProjectsPage;
