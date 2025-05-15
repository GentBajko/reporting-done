import { useState } from "react";
import {
  HiOutlineBan,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineExclamation,
  HiOutlineEye,
  HiOutlineIdentification,
  HiOutlineInformationCircle,
  HiPlus,
} from "react-icons/hi";
import Modal from "./Modal";

interface LogEntry {
  id: string;
  task_name: string;
  description: string;
  user_id: string;
  user_name: string;
  project_id: string;
  project_name: string;
  hours_spent_today: number;
  task_status: string;
  timestamp: number;
  task_id: string;
}

interface NewLogData {
  task_name: string;
  description: string;
  hours_spent_today: number;
  task_status: string;
  user_id: string;
  user_name: string;
  project_id: string;
  project_name: string;
  task_id: string;
}

const mockLogsData: LogEntry[] = [
  {
    id: "log-ulid-1",
    task_name: "Design homepage mockups",
    description:
      "User JohnDoe logged in successfully. //This mock data needs update",
    user_id: "usr-123",
    user_name: "JohnDoe",
    project_id: "proj-abc",
    project_name: "Project Alpha",
    hours_spent_today: 0,
    task_status: "In Progress",
    timestamp: Math.floor((Date.now() - 1000 * 60 * 5) / 1000),
    task_id: "task-xyz-1",
  },
  {
    id: "log-ulid-2",
    task_name: "Develop API endpoints",
    description:
      "API endpoint /api/data returned a slow response (550ms). Consider optimizing query.",
    user_id: "usr-system",
    user_name: "System",
    project_id: "proj-def",
    project_name: "Project Beta",
    hours_spent_today: 0.5,
    task_status: "In Progress",
    timestamp: Math.floor((Date.now() - 1000 * 60 * 3) / 1000),
    task_id: "task-xyz-2",
  },
  {
    id: "log-ulid-3",
    task_name: "Payment Processing",
    description:
      "Failed to process payment for order #12345. Error: Insufficient funds.",
    user_id: "usr-system",
    user_name: "System",
    project_id: "proj-ghi",
    project_name: "E-commerce Platform",
    hours_spent_today: 0,
    task_status: "Blocked",
    timestamp: Math.floor((Date.now() - 1000 * 60 * 1) / 1000),
    task_id: "task-xyz-3",
  },
];

const getLogStatusClass = (task_status: string) => {
  switch (task_status.toLowerCase()) {
    case "in progress":
      return {
        Icon: HiOutlineInformationCircle,
        className: "text-blue-500 bg-blue-100",
      };
    case "completed":
    case "done":
      return {
        Icon: HiOutlineCheckCircle,
        className: "text-green-500 bg-green-100",
      };
    case "blocked":
    case "error":
      return { Icon: HiOutlineBan, className: "text-red-500 bg-red-100" };
    case "warning":
      return {
        Icon: HiOutlineExclamation,
        className: "text-yellow-500 bg-yellow-100",
      };
    default:
      return {
        Icon: HiOutlineInformationCircle,
        className: "text-gray-500 bg-gray-100",
      };
  }
};

const LogsPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>(mockLogsData);

  const [newLogTaskName, setNewLogTaskName] = useState("");
  const [newLogDescription, setNewLogDescription] = useState("");
  const [newLogHoursSpent, setNewLogHoursSpent] = useState<number | string>("");
  const [newLogTaskStatus, setNewLogTaskStatus] = useState("In Progress");
  const [newLogUserId, setNewLogUserId] = useState("");
  const [newLogUserName, setNewLogUserName] = useState("");
  const [newLogProjectId, setNewLogProjectId] = useState("");
  const [newLogProjectName, setNewLogProjectName] = useState("");
  const [newLogTaskId, setNewLogTaskId] = useState("");

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    setNewLogTaskName("");
    setNewLogDescription("");
    setNewLogHoursSpent("");
    setNewLogTaskStatus("In Progress");
    setNewLogUserId("");
    setNewLogUserName("");
    setNewLogProjectId("");
    setNewLogProjectName("");
    setNewLogTaskId("");
  };

  const handleCreateLog = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const hoursSpent = parseFloat(String(newLogHoursSpent));
    if (isNaN(hoursSpent)) {
      alert("Please enter a valid number for hours spent.");
      return;
    }

    const logToCreate: NewLogData = {
      task_name: newLogTaskName,
      description: newLogDescription,
      hours_spent_today: hoursSpent,
      task_status: newLogTaskStatus,
      user_id: newLogUserId || "usr-mock-log",
      user_name: newLogUserName || "Mock User Log",
      project_id: newLogProjectId || "proj-mock-log",
      project_name: newLogProjectName || "Mock Project Log",
      task_id: newLogTaskId || "task-mock-log",
    };

    const createdLog: LogEntry = {
      id: String(Date.now()),
      ...logToCreate,
      timestamp: Math.floor(Date.now() / 1000),
    };

    setLogs([createdLog, ...logs].sort((a, b) => b.timestamp - a.timestamp));
    closeModal();
    alert(
      `Log entry for "${
        createdLog.task_name
      }" created! (mock)\n(Data for backend: ${JSON.stringify(logToCreate)})`
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
          Create New Log Entry
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
                Timestamp
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Project / Task
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                User
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Log Message / Hours
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Task Status
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logs.map((log) => {
              const { Icon, className } = getLogStatusClass(log.task_status);
              return (
                <tr
                  key={log.id}
                  className="hover:bg-gray-50 transition duration-150"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-left">
                    {new Date(log.timestamp * 1000).toLocaleString()}
                    <div className="text-xs text-gray-500">ID: {log.id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-normal text-sm text-gray-900 text-left">
                    <div>{log.project_name}</div>
                    <div className="text-xs text-gray-600">{log.task_name}</div>
                    <div className="text-xs text-gray-500 mt-1 flex items-center">
                      <HiOutlineIdentification className="w-3 h-3 mr-1" /> Task
                      ID: {log.task_id}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center">
                      <HiOutlineIdentification className="w-3 h-3 mr-1" /> Proj
                      ID: {log.project_id}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-left">
                    {log.user_name}
                    <div className="text-xs text-gray-500">
                      ID: {log.user_id}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-normal text-sm text-gray-900 text-left">
                    {log.description}
                    <div className="text-xs text-gray-500 mt-1 flex items-center">
                      <HiOutlineClock className="w-3 h-3 mr-1 text-blue-500" />{" "}
                      Hours: {log.hours_spent_today.toFixed(1)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-left">
                    <span
                      className={`px-2.5 py-0.5 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${className}`}
                    >
                      <Icon className="mr-1.5 h-4 w-4" />
                      {log.task_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() =>
                        alert(`View details for log ${log.id} - TBD`)
                      }
                      className="text-[#002F41] hover:text-[#004057] p-1 rounded hover:bg-gray-200 transition duration-150"
                      title="View Log Details"
                    >
                      <HiOutlineEye className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {logs.length === 0 && (
        <div className="text-center py-10 bg-white shadow-md rounded-lg">
          <p className="text-gray-500">No log entries found.</p>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title="Create New Log Entry"
      >
        <form onSubmit={handleCreateLog} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
            <div>
              <label
                htmlFor="logTaskId"
                className="block text-sm font-medium text-gray-700"
              >
                Task ID
              </label>
              <input
                type="text"
                name="logTaskId"
                id="logTaskId"
                value={newLogTaskId}
                onChange={(e) => setNewLogTaskId(e.target.value)}
                required
                className="mt-1 block w-full input-standard"
                placeholder="task-ulid-goes-here"
              />
            </div>
            <div>
              <label
                htmlFor="logTaskName"
                className="block text-sm font-medium text-gray-700"
              >
                Task Name
              </label>
              <input
                type="text"
                name="logTaskName"
                id="logTaskName"
                value={newLogTaskName}
                onChange={(e) => setNewLogTaskName(e.target.value)}
                required
                className="mt-1 block w-full input-standard"
              />
            </div>
            <div>
              <label
                htmlFor="logProjectId"
                className="block text-sm font-medium text-gray-700"
              >
                Project ID
              </label>
              <input
                type="text"
                name="logProjectId"
                id="logProjectId"
                value={newLogProjectId}
                onChange={(e) => setNewLogProjectId(e.target.value)}
                required
                className="mt-1 block w-full input-standard"
              />
            </div>
            <div>
              <label
                htmlFor="logProjectName"
                className="block text-sm font-medium text-gray-700"
              >
                Project Name
              </label>
              <input
                type="text"
                name="logProjectName"
                id="logProjectName"
                value={newLogProjectName}
                onChange={(e) => setNewLogProjectName(e.target.value)}
                required
                className="mt-1 block w-full input-standard"
              />
            </div>
            <div>
              <label
                htmlFor="logUserId"
                className="block text-sm font-medium text-gray-700"
              >
                User ID
              </label>
              <input
                type="text"
                name="logUserId"
                id="logUserId"
                value={newLogUserId}
                onChange={(e) => setNewLogUserId(e.target.value)}
                required
                className="mt-1 block w-full input-standard"
              />
            </div>
            <div>
              <label
                htmlFor="logUserName"
                className="block text-sm font-medium text-gray-700"
              >
                User Name
              </label>
              <input
                type="text"
                name="logUserName"
                id="logUserName"
                value={newLogUserName}
                onChange={(e) => setNewLogUserName(e.target.value)}
                required
                className="mt-1 block w-full input-standard"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="logDescription"
              className="block text-sm font-medium text-gray-700"
            >
              Description / Work Done
            </label>
            <textarea
              name="logDescription"
              id="logDescription"
              value={newLogDescription}
              onChange={(e) => setNewLogDescription(e.target.value)}
              required
              rows={3}
              className="mt-1 block w-full input-standard"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="logHoursSpent"
                className="block text-sm font-medium text-gray-700"
              >
                Hours Spent Today
              </label>
              <input
                type="number"
                name="logHoursSpent"
                id="logHoursSpent"
                value={newLogHoursSpent}
                onChange={(e) => setNewLogHoursSpent(e.target.value)}
                required
                min="0"
                step="0.1"
                className="mt-1 block w-full input-standard"
              />
            </div>
            <div>
              <label
                htmlFor="logTaskStatus"
                className="block text-sm font-medium text-gray-700"
              >
                New Task Status
              </label>
              <select
                name="logTaskStatus"
                id="logTaskStatus"
                value={newLogTaskStatus}
                onChange={(e) => setNewLogTaskStatus(e.target.value)}
                className="mt-1 block w-full input-standard"
              >
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Blocked">Blocked</option>
                <option value="On Hold">On Hold</option>
                <option value="Needs Review">Needs Review</option>
              </select>
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
              Create Log
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default LogsPage;
