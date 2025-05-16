import React, { useEffect, useState } from "react";
import {
  HiOutlineBan,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineExclamation,
  HiOutlineEye,
  HiOutlineIdentification,
  HiOutlineInformationCircle,
  HiOutlinePencil,
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
  task_id: string;
  description: string;
  hours_spent_today: number;
  task_status: string;
}

interface UpdateLogData {
  task_id: string;
  task_name: string;
  description: string;
  hours_spent_today: number;
  task_status: string;
}

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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<LogEntry | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newLogTaskId, setNewLogTaskId] = useState("");
  const [newLogDescription, setNewLogDescription] = useState("");
  const [newLogHoursSpent, setNewLogHoursSpent] = useState<number | string>("");
  const [newLogTaskStatus, setNewLogTaskStatus] = useState("In Progress");

  const [editLogTaskId, setEditLogTaskId] = useState("");
  const [editLogTaskName, setEditLogTaskName] = useState("");
  const [editLogDescription, setEditLogDescription] = useState("");
  const [editLogHoursSpent, setEditLogHoursSpent] = useState<number | string>(
    ""
  );
  const [editLogTaskStatus, setEditLogTaskStatus] = useState("");

  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("/log/");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: LogEntry[] = await response.json();
        setLogs(data.sort((a, b) => b.timestamp - a.timestamp));
      } catch (e: any) {
        console.error("Failed to fetch logs:", e);
        setError(e.message || "Failed to load logs");
      } finally {
        setIsLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    setNewLogTaskId("");
    setNewLogDescription("");
    setNewLogHoursSpent("");
    setNewLogTaskStatus("In Progress");
  };

  const openEditModal = (log: LogEntry) => {
    setEditingLog(log);
    setEditLogTaskId(log.task_id);
    setEditLogTaskName(log.task_name);
    setEditLogDescription(log.description);
    setEditLogHoursSpent(log.hours_spent_today);
    setEditLogTaskStatus(log.task_status);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingLog(null);
    setEditLogTaskId("");
    setEditLogTaskName("");
    setEditLogDescription("");
    setEditLogHoursSpent("");
    setEditLogTaskStatus("");
  };

  const handleCreateLog = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const hoursSpent = parseFloat(String(newLogHoursSpent));
    if (isNaN(hoursSpent)) {
      alert("Please enter a valid number for hours spent (can be 0).");
      return;
    }
    if (!newLogTaskId) {
      alert("Please select or enter a Task ID.");
      return;
    }

    const formData = new FormData();
    formData.append("task_id", newLogTaskId);
    formData.append("description", newLogDescription);
    formData.append("hours_spent_today", String(hoursSpent));
    formData.append("task_status", newLogTaskStatus);

    try {
      const response = await fetch("/log/", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ detail: "Failed to create log. Unknown error." }));
        throw new Error(
          errorData.detail || `HTTP error! status: ${response.status}`
        );
      }
      const createdLog: LogEntry = await response.json();
      setLogs([createdLog, ...logs].sort((a, b) => b.timestamp - a.timestamp));
      closeModal();
      alert(
        `Log entry for task ID "${createdLog.task_id}" created successfully!`
      );
    } catch (e: any) {
      console.error("Failed to create log:", e);
      setError(e.message || "Failed to create log");
      alert(`Error creating log: ${e.message}`);
    }
  };

  const handleUpdateLog = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingLog) return;

    const hoursSpent = parseFloat(String(editLogHoursSpent));
    if (isNaN(hoursSpent)) {
      alert("Please enter a valid number for hours spent.");
      return;
    }

    const formData = new FormData();
    formData.append("task_id", editLogTaskId);
    formData.append("task_name", editLogTaskName);
    formData.append("description", editLogDescription);
    formData.append("hours_spent_today", String(hoursSpent));
    formData.append("task_status", editLogTaskStatus);

    try {
      const response = await fetch(`/log/${editingLog.id}`, {
        method: "PUT",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ detail: "Failed to update log. Unknown error." }));
        throw new Error(
          errorData.detail || `HTTP error! status: ${response.status}`
        );
      }
      const updatedLog: LogEntry = await response.json();
      setLogs(
        logs
          .map((log) => (log.id === updatedLog.id ? updatedLog : log))
          .sort((a, b) => b.timestamp - a.timestamp)
      );
      closeEditModal();
      alert(
        `Log entry for task "${updatedLog.task_name}" updated successfully!`
      );
    } catch (e: any) {
      console.error("Failed to update log:", e);
      setError(e.message || "Failed to update log");
      alert(`Error updating log: ${e.message}`);
    }
  };

  const handleDeleteLog = async (logId: string, logTaskName: string) => {
    if (
      !window.confirm(
        `Are you sure you want to delete the log for "${logTaskName}" (ID: ${logId})? This will also adjust task hours.`
      )
    ) {
      return;
    }
    try {
      const response = await fetch(`/log/${logId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        if (response.status === 404) throw new Error("Log not found.");
        if (response.status === 403)
          throw new Error("Not authorized to delete this log.");
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      setLogs(logs.filter((log) => log.id !== logId));
      alert(`Log ID ${logId} deleted successfully.`);
    } catch (e: any) {
      console.error("Failed to delete log:", e);
      setError(e.message || "Failed to delete log");
      alert(`Error deleting log: ${e.message}`);
    }
  };

  if (isLoading) {
    return <div className="p-6 text-center">Loading logs...</div>;
  }

  if (error && logs.length === 0) {
    return (
      <div className="p-6 bg-red-100 border border-red-400 text-red-700 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-2">Error Loading Logs</h2>
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
            {logs.length === 0 && !isLoading && (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  No logs found.
                  {isModalOpen
                    ? ""
                    : " Click 'Create New Log Entry' to add one."}
                </td>
              </tr>
            )}
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
                      className="text-[#002F41] hover:text-[#004057] mr-2 p-1 rounded hover:bg-gray-200 transition duration-150"
                      title="View Log Details"
                    >
                      <HiOutlineEye className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => openEditModal(log)}
                      className="text-indigo-600 hover:text-indigo-800 mr-2 p-1 rounded hover:bg-gray-200 transition duration-150"
                      title="Edit Log"
                    >
                      <HiOutlinePencil className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteLog(log.id, log.task_name)}
                      className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-gray-200 transition duration-150"
                      title="Delete Log"
                    >
                      <HiOutlineBan className="h-5 w-5" />
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
          Error during log operation: {error}. Some data might be stale.
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title="Create New Log Entry"
      >
        <form onSubmit={handleCreateLog} className="space-y-4">
          <div>
            <label
              htmlFor="newLogTaskId"
              className="block text-sm font-medium text-gray-700"
            >
              Task ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="newLogTaskId"
              value={newLogTaskId}
              onChange={(e) => setNewLogTaskId(e.target.value)}
              required
              placeholder="Enter associated Task ID"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="newLogDescription"
              className="block text-sm font-medium text-gray-700"
            >
              Description / Notes <span className="text-red-500">*</span>
            </label>
            <textarea
              id="newLogDescription"
              value={newLogDescription}
              onChange={(e) => setNewLogDescription(e.target.value)}
              required
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            ></textarea>
          </div>
          <div>
            <label
              htmlFor="newLogHoursSpent"
              className="block text-sm font-medium text-gray-700"
            >
              Hours Spent Today <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="newLogHoursSpent"
              value={newLogHoursSpent}
              onChange={(e) => setNewLogHoursSpent(e.target.value)}
              required
              min="0"
              step="0.25"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="newLogTaskStatus"
              className="block text-sm font-medium text-gray-700"
            >
              New Task Status <span className="text-red-500">*</span>
            </label>
            <select
              id="newLogTaskStatus"
              value={newLogTaskStatus}
              onChange={(e) => setNewLogTaskStatus(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Done">Done</option>
              <option value="Returned">Returned</option>
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
              Create Log
            </button>
          </div>
        </form>
      </Modal>

      {editingLog && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={closeEditModal}
          title={`Edit Log Entry (ID: ${editingLog.id})`}
        >
          <form onSubmit={handleUpdateLog} className="space-y-4">
            <div>
              <label
                htmlFor="editLogTaskId"
                className="block text-sm font-medium text-gray-700"
              >
                Task ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="editLogTaskId"
                value={editLogTaskId}
                onChange={(e) => setEditLogTaskId(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-100"
                readOnly
              />
            </div>
            <div>
              <label
                htmlFor="editLogTaskName"
                className="block text-sm font-medium text-gray-700"
              >
                Task Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="editLogTaskName"
                value={editLogTaskName}
                onChange={(e) => setEditLogTaskName(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="editLogDescription"
                className="block text-sm font-medium text-gray-700"
              >
                Description / Notes <span className="text-red-500">*</span>
              </label>
              <textarea
                id="editLogDescription"
                value={editLogDescription}
                onChange={(e) => setEditLogDescription(e.target.value)}
                required
                rows={3}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              ></textarea>
            </div>
            <div>
              <label
                htmlFor="editLogHoursSpent"
                className="block text-sm font-medium text-gray-700"
              >
                Hours Spent <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="editLogHoursSpent"
                value={editLogHoursSpent}
                onChange={(e) => setEditLogHoursSpent(e.target.value)}
                required
                min="0"
                step="0.25"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="editLogTaskStatus"
                className="block text-sm font-medium text-gray-700"
              >
                New Task Status <span className="text-red-500">*</span>
              </label>
              <select
                id="editLogTaskStatus"
                value={editLogTaskStatus}
                onChange={(e) => setEditLogTaskStatus(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Done">Done</option>
                <option value="Returned">Returned</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={closeEditModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition duration-150"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-[#002F41] hover:bg-[#004057] rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#002F41] transition duration-150"
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

export default LogsPage;
