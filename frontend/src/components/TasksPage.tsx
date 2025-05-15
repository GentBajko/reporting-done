import { useState } from "react";
import {
  HiOutlineClock,
  HiOutlineCollection,
  HiOutlineEye,
  HiOutlinePencil,
  HiOutlineRefresh,
  HiPlus,
} from "react-icons/hi";
import Modal from "./Modal"; // Assuming Modal.tsx is in the same directory or adjust path

// Basic Log interface for Task.logs - align with LogCreateModel from backend
interface BasicLog {
  id: string;
  task_name: string; // Or should this be derived/omitted if it's part of Task?
  description: string;
  hours_spent_today: number; // float in backend
  task_status: string;
  user_id: string;
  user_name: string;
  timestamp: number; // int in backend (Unix timestamp)
  task_id: string;
}

interface Task {
  id: string;
  project_id: string;
  project_name: string;
  user_id: string;
  user_name: string;
  title: string;
  hours_required: number; // float in backend
  hours_worked: number; // float in backend
  returned: boolean;
  description: string;
  logs: BasicLog[];
  status: string | null; // Optional[str] in backend
  last_updated: number | null; // Optional[int] in backend (Unix timestamp)
  timestamp: number; // int in backend (Unix timestamp)
}

// Corresponds to TaskCreateModel
interface NewTaskData {
  project_id: string;
  project_name: string;
  user_id: string;
  user_name: string;
  title: string;
  hours_required: number;
  description: string;
  // hours_worked, returned, status, timestamp are handled by backend or have defaults
}

const mockTasksData: Task[] = [
  {
    id: "task-1",
    project_id: "proj-1",
    project_name: "Project Alpha",
    user_id: "usr-1",
    user_name: "Alice",
    title: "Design homepage mockups",
    hours_required: 16,
    hours_worked: 8,
    returned: false,
    description: "Create detailed mockups for the new homepage layout.",
    logs: [],
    status: "In Progress",
    last_updated: Math.floor((Date.now() - 1000 * 60 * 60 * 24) / 1000), // 1 day ago
    timestamp: Math.floor((Date.now() - 1000 * 60 * 60 * 48) / 1000), // 2 days ago
  },
  {
    id: "task-2",
    project_id: "proj-2",
    project_name: "Project Beta",
    user_id: "usr-2",
    user_name: "Bob",
    title: "Develop API endpoints",
    hours_required: 40,
    hours_worked: 0,
    returned: false,
    description: "Implement all necessary API endpoints as per specification.",
    logs: [],
    status: "To Do",
    last_updated: null,
    timestamp: Math.floor((Date.now() - 1000 * 60 * 60 * 72) / 1000), // 3 days ago
  },
  {
    id: "task-3",
    project_id: "proj-1",
    project_name: "Project Alpha",
    user_id: "usr-3",
    user_name: "Carol",
    title: "User testing for new feature",
    hours_required: 8,
    hours_worked: 8,
    returned: true,
    description:
      "Conduct user testing sessions and gather feedback. Task was returned for revisions.",
    logs: [],
    status: "Done", // Example, might be 'Returned' or similar if `returned` is true
    last_updated: Math.floor(Date.now() / 1000),
    timestamp: Math.floor((Date.now() - 1000 * 60 * 60 * 24 * 5) / 1000), // 5 days ago
  },
];

// const getPriorityClass = (priority: Task["priority"]) => {
//   switch (priority) {
//     case "High":
//       return "text-red-600 font-semibold";
//     case "Medium":
//       return "text-yellow-600 font-semibold";
//     case "Low":
//       return "text-green-600 font-semibold";
//     default:
//       return "text-gray-600";
//   }
// };

// Keeping previous getStatusClass for general status strings. Backend status is flexible.
const getStatusClass = (status: string | null) => {
  if (!status) return "bg-gray-100 text-gray-700";
  switch (status.toLowerCase()) {
    case "to do":
      return "bg-gray-200 text-gray-800";
    case "in progress":
      return "bg-blue-200 text-blue-800";
    case "done":
      return "bg-green-200 text-green-800";
    case "returned":
      return "bg-yellow-200 text-yellow-800";
    default:
      return "bg-purple-200 text-purple-800"; // For other custom statuses
  }
};

const TasksPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>(mockTasksData);

  // Form state for new task, aligned with NewTaskData
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskProjectId, setNewTaskProjectId] = useState(""); // In real app, from a selector
  const [newTaskProjectName, setNewTaskProjectName] = useState(""); // In real app, from a selector
  const [newTaskUserId, setNewTaskUserId] = useState(""); // In real app, from a selector
  const [newTaskUserName, setNewTaskUserName] = useState(""); // In real app, from a selector
  const [newTaskHoursRequired, setNewTaskHoursRequired] = useState<
    number | string
  >("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskStatus, setNewTaskStatus] = useState<string>("To Do"); // Default for new task

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    setNewTaskTitle("");
    setNewTaskProjectId("");
    setNewTaskProjectName("");
    setNewTaskUserId("");
    setNewTaskUserName("");
    setNewTaskHoursRequired("");
    setNewTaskDescription("");
    setNewTaskStatus("To Do");
  };

  const handleCreateTask = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const hoursRequired = parseFloat(String(newTaskHoursRequired));
    if (isNaN(hoursRequired) || hoursRequired <= 0) {
      alert("Please enter a valid positive number for hours required.");
      return;
    }

    const taskToCreate: NewTaskData = {
      title: newTaskTitle,
      project_id: newTaskProjectId || "proj-mock",
      project_name: newTaskProjectName || "Mock Project",
      user_id: newTaskUserId || "usr-mock",
      user_name: newTaskUserName || "Mock User",
      hours_required: hoursRequired,
      description: newTaskDescription,
      // status will be part of taskToCreate in backend but is optional in TaskCreateModel
    };

    // Mocking backend response for TaskResponseModel
    const createdTask: Task = {
      id: String(Date.now()), // Mock ID
      ...taskToCreate,
      hours_worked: 0, // Default for new task
      returned: false, // Default for new task
      logs: [], // Default for new task
      status: newTaskStatus, // Set initial status from form
      last_updated: Math.floor(Date.now() / 1000),
      timestamp: Math.floor(Date.now() / 1000),
    };

    setTasks([createdTask, ...tasks]);
    closeModal();
    alert(
      `Task "${
        createdTask.title
      }" created! (mock)\n(Data for backend: ${JSON.stringify(taskToCreate)})`
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
          Create New Task
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
                Title
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Project
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Assigned To
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Hours (Worked/Required)
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Returned
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tasks.map((task) => (
              <tr
                key={task.id}
                className="hover:bg-gray-50 transition duration-150"
              >
                <td className="px-6 py-4 whitespace-normal text-left">
                  <div className="text-sm font-medium text-gray-900">
                    {task.title}
                  </div>
                  <div className="text-xs text-gray-500 break-words">
                    {task.description.substring(0, 100)}
                    {task.description.length > 100 && "..."}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-left">
                  {task.project_name}
                  <div className="text-xs text-gray-500">
                    ID: {task.project_id}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-left">
                  {task.user_name}
                  <div className="text-xs text-gray-500">
                    ID: {task.user_id}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-left">
                  <div className="flex items-center">
                    <HiOutlineClock className="h-4 w-4 mr-1.5 text-gray-500" />
                    {task.hours_worked.toFixed(1)} /{" "}
                    {task.hours_required.toFixed(1)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-left">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(
                      task.status
                    )}`}
                  >
                    {task.status || "N/A"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  {task.returned ? (
                    <HiOutlineRefresh
                      className="h-5 w-5 text-yellow-500"
                      title="Task Returned"
                    />
                  ) : (
                    <span className="text-xs text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() =>
                      alert(
                        `View task ${task.title} logs (${task.logs.length}) - TBD`
                      )
                    }
                    className="text-gray-500 hover:text-gray-700 mr-2 p-1 rounded hover:bg-gray-200 transition duration-150"
                    title="View Logs"
                  >
                    <HiOutlineCollection className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => alert(`View ${task.title} - TBD`)}
                    className="text-[#002F41] hover:text-[#004057] mr-2 p-1 rounded hover:bg-gray-200 transition duration-150"
                    title="View Task Details"
                  >
                    <HiOutlineEye className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => alert(`Edit ${task.title} - TBD`)}
                    className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-gray-200 transition duration-150"
                    title="Edit Task"
                  >
                    <HiOutlinePencil className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {tasks.length === 0 && (
        <div className="text-center py-10 bg-white shadow-md rounded-lg">
          <p className="text-gray-500">
            No tasks found. Get started by creating a new one!
          </p>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={closeModal} title="Create New Task">
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label
              htmlFor="taskTitle"
              className="block text-sm font-medium text-gray-700"
            >
              Task Title
            </label>
            <input
              type="text"
              name="taskTitle"
              id="taskTitle"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white text-gray-900"
            />
          </div>

          {/* In a real app, these would be dropdowns populated from backend data */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="taskProjectId"
                className="block text-sm font-medium text-gray-700"
              >
                Project ID
              </label>
              <input
                type="text"
                name="taskProjectId"
                id="taskProjectId"
                value={newTaskProjectId}
                onChange={(e) => setNewTaskProjectId(e.target.value)}
                placeholder="e.g., proj-123"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm bg-white text-gray-900"
              />
            </div>
            <div>
              <label
                htmlFor="taskProjectName"
                className="block text-sm font-medium text-gray-700"
              >
                Project Name
              </label>
              <input
                type="text"
                name="taskProjectName"
                id="taskProjectName"
                value={newTaskProjectName}
                onChange={(e) => setNewTaskProjectName(e.target.value)}
                placeholder="e.g., Project Alpha"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm bg-white text-gray-900"
              />
            </div>
            <div>
              <label
                htmlFor="taskUserId"
                className="block text-sm font-medium text-gray-700"
              >
                User ID (Assignee)
              </label>
              <input
                type="text"
                name="taskUserId"
                id="taskUserId"
                value={newTaskUserId}
                onChange={(e) => setNewTaskUserId(e.target.value)}
                placeholder="e.g., usr-456"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm bg-white text-gray-900"
              />
            </div>
            <div>
              <label
                htmlFor="taskUserName"
                className="block text-sm font-medium text-gray-700"
              >
                User Name (Assignee)
              </label>
              <input
                type="text"
                name="taskUserName"
                id="taskUserName"
                value={newTaskUserName}
                onChange={(e) => setNewTaskUserName(e.target.value)}
                placeholder="e.g., John Doe"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm bg-white text-gray-900"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="taskHoursRequired"
              className="block text-sm font-medium text-gray-700"
            >
              Hours Required
            </label>
            <input
              type="number"
              name="taskHoursRequired"
              id="taskHoursRequired"
              value={newTaskHoursRequired}
              onChange={(e) => setNewTaskHoursRequired(e.target.value)}
              required
              min="0.1"
              step="0.1"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white text-gray-900"
            />
          </div>

          <div>
            <label
              htmlFor="taskDescription"
              className="block text-sm font-medium text-gray-700"
            >
              Description
            </label>
            <textarea
              name="taskDescription"
              id="taskDescription"
              value={newTaskDescription}
              onChange={(e) => setNewTaskDescription(e.target.value)}
              required
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white text-gray-900"
            />
          </div>
          <div>
            <label
              htmlFor="taskStatus"
              className="block text-sm font-medium text-gray-700"
            >
              Initial Status
            </label>
            <select
              name="taskStatus"
              id="taskStatus"
              value={newTaskStatus}
              onChange={(e) => setNewTaskStatus(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
            >
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              {/* Add other relevant initial statuses if needed, e.g., Blocked, On Hold */}
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
              Create Task
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TasksPage;
