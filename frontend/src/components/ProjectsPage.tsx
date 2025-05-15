import { useState } from "react";
import {
  HiOutlineEye,
  HiOutlineMail,
  HiOutlinePencil,
  HiOutlineUserGroup,
  HiPlus,
} from "react-icons/hi";
import Modal from "./Modal";

// Basic interfaces for related data - these would ideally be more detailed
// and potentially imported from a shared types file aligned with backend models.
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

// Corresponds to ProjectCreateModel
interface NewProjectData {
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
    return "bg-gray-100 text-gray-800"; // Archived
  }
  return "bg-green-100 text-green-800"; // Active
};

const ProjectsPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>(mockProjectsData);

  // Form state for new project, aligned with NewProjectData
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectEmail, setNewProjectEmail] = useState(""); // Store as string, convert to null if empty
  const [newProjectSendEmail, setNewProjectSendEmail] = useState(false);
  const [newProjectArchived, setNewProjectArchived] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    setNewProjectName("");
    setNewProjectEmail("");
    setNewProjectSendEmail(false);
    setNewProjectArchived(false);
  };

  const handleCreateProject = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const projectToCreate: NewProjectData = {
      name: newProjectName,
      email: newProjectEmail === "" ? null : newProjectEmail,
      send_email: newProjectSendEmail,
      archived: newProjectArchived,
    };

    // In a real app, this object (projectToCreate) would be sent to the backend.
    // The backend would return the created project including its ID, developers, tasks etc.
    // For now, we'll mock this response.
    const createdProject: Project = {
      id: String(Date.now()), // Mock ID
      ...projectToCreate,
      developers: [], // Mock: new projects start with no developers assigned via this form
      tasks: [], // Mock: new projects start with no tasks via this form
    };

    setProjects([createdProject, ...projects]);
    closeModal();
    alert(
      `Project "${
        createdProject.name
      }" created! (mock)\n(Data for backend: ${JSON.stringify(
        projectToCreate
      )})`
    );
  };

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
                    onClick={() => alert(`Edit ${project.name} - TBD`)}
                    className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-gray-200 transition duration-150"
                    title="Edit Project"
                  >
                    <HiOutlinePencil className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {projects.length === 0 && (
        <div className="text-center py-10 bg-white shadow-md rounded-lg">
          <p className="text-gray-500">
            No projects found. Get started by creating a new one!
          </p>
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
              Project Name
            </label>
            <input
              type="text"
              name="projectName"
              id="projectName"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white text-gray-900"
            />
          </div>
          <div>
            <label
              htmlFor="projectEmail"
              className="block text-sm font-medium text-gray-700"
            >
              Client/Project Email (Optional)
            </label>
            <input
              type="email"
              name="projectEmail"
              id="projectEmail"
              value={newProjectEmail}
              onChange={(e) => setNewProjectEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white text-gray-900"
            />
          </div>
          <div className="flex items-start space-x-4">
            <div className="flex items-center h-5">
              <input
                id="sendEmail"
                name="sendEmail"
                type="checkbox"
                checked={newProjectSendEmail}
                onChange={(e) => setNewProjectSendEmail(e.target.checked)}
                className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
              />
            </div>
            <div className="text-sm">
              <label htmlFor="sendEmail" className="font-medium text-gray-700">
                Send Email Notifications
              </label>
              <p className="text-gray-500">
                Enable email updates for this project.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="flex items-center h-5">
              <input
                id="archived"
                name="archived"
                type="checkbox"
                checked={newProjectArchived}
                onChange={(e) => setNewProjectArchived(e.target.checked)}
                className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
              />
            </div>
            <div className="text-sm">
              <label htmlFor="archived" className="font-medium text-gray-700">
                Archive Project
              </label>
              <p className="text-gray-500">
                Mark this project as archived (inactive).
              </p>
            </div>
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
              Create Project
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProjectsPage;
