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
  HiX
} from "react-icons/hi";
import Modal from "./Modal";
import DataTable from "./common/DataTable";
import SearchFilter from "./common/SearchFilter";
import { useApi } from "../hooks/useApi";
import { Log, Task, Pagination, PaginatedResponse } from "../types";

const getLogStatusClass = (task_status: string) => {
  switch (task_status?.toLowerCase()) {
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
  const { request } = useApi();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const [logs, setLogs] = useState<Log[]>([]);
  const [pagination, setPagination] = useState<Pagination | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [viewingLog, setViewingLog] = useState<Log | null>(null);
  const [editingLog, setEditingLog] = useState<Log | null>(null);

  const [formData, setFormData] = useState({
    task_id: "",
    description: "",
    hours_spent_today: 0,
    task_status: "In Progress",
  });

  // Backend logs endpoint currently only supports pagination, no search filters exposed in controller
  const fetchLogs = async (page: number = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: "15",
      });

      const response = await request<PaginatedResponse<Log>>(`/log/?${queryParams.toString()}`);

      if (response.items) {
          setLogs(response.items);
          setPagination({
             page: response.page,
             per_page: response.per_page,
             total: response.total,
             total_pages: Math.ceil(response.total / response.per_page),
             has_next: response.has_next,
             has_prev: response.has_prev
          });
      } else {
          setLogs([]);
      }
    } catch (e: any) {
      setError(e.message || "Failed to load logs");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch tasks for dropdown
  const fetchTasks = async () => {
      try {
          // Fetching a batch of tasks. In production, this should be a searchable select.
          const response = await request<any>('/task/?limit=100');
          if (response.items) setTasks(response.items);
          else if (Array.isArray(response)) setTasks(response); // Fallback
      } catch (e) {
          console.error("Failed to fetch tasks", e);
      }
  };

  useEffect(() => {
    fetchLogs(currentPage);
  }, [currentPage]);

  useEffect(() => {
      if (isModalOpen) {
          fetchTasks();
      }
  }, [isModalOpen]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const openModal = () => {
    setFormData({
        task_id: "",
        description: "",
        hours_spent_today: 0,
        task_status: "In Progress"
    });
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const openEditModal = (log: Log) => {
    setEditingLog(log);
    setFormData({
      task_id: log.task_id,
      description: log.description,
      hours_spent_today: log.hours_spent_today,
      task_status: log.task_status,
    });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingLog(null);
  };

  const openViewModal = (log: Log) => {
      setViewingLog(log);
      setIsViewModalOpen(true);
  };

  const closeViewModal = () => {
      setIsViewModalOpen(false);
      setViewingLog(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'hours_spent_today' ? parseFloat(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
          task_id: formData.task_id,
          description: formData.description,
          hours_spent_today: formData.hours_spent_today,
          task_status: formData.task_status
      };

      if (isEditModalOpen && editingLog) {
        await request(`/log/${editingLog.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        alert("Log updated successfully!");
        closeEditModal();
      } else {
        await request("/log/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        alert("Log created successfully!");
        closeModal();
      }
      fetchLogs(currentPage);
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this log?")) return;
    try {
      await request(`/log/${id}`, { method: "DELETE" });
      alert("Log deleted successfully");
      fetchLogs(currentPage);
    } catch (e: any) {
      alert(`Error deleting log: ${e.message}`);
    }
  };

  const columns = [
    {
      header: "Timestamp",
      accessor: (log: Log) => (
        <div>
            <div className="text-sm text-gray-900">{new Date(log.timestamp * 1000).toLocaleString()}</div>
            <div className="text-xs text-gray-500">ID: {log.id}</div>
        </div>
      ),
    },
    {
      header: "Task / Project",
      accessor: (log: Log) => (
        <div>
            <div className="font-medium text-gray-900">{log.task_name}</div>
            <div className="text-xs text-gray-500">{log.project_name}</div>
        </div>
      ),
    },
    {
      header: "User",
      accessor: (log: Log) => (
          <span className="text-sm text-gray-700">{log.user_name}</span>
      )
    },
    {
      header: "Details",
      accessor: (log: Log) => (
        <div>
            <div className="text-sm text-gray-700 truncate w-48" title={log.description}>{log.description}</div>
            <div className="flex items-center mt-1 text-xs text-gray-500">
                <HiOutlineClock className="mr-1" /> {log.hours_spent_today} hrs
            </div>
        </div>
      ),
    },
    {
      header: "Status",
      accessor: (log: Log) => {
          const { Icon, className } = getLogStatusClass(log.task_status);
          return (
            <span className={`px-2 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${className}`}>
                <Icon className="mr-1 h-4 w-4" /> {log.task_status}
            </span>
          );
      },
    },
    {
      header: "Actions",
      className: "text-right",
      render: (log: Log) => (
        <div className="flex justify-end space-x-2">
          <button onClick={() => openViewModal(log)} className="text-[#002F41] hover:text-[#004057] p-1">
            <HiOutlineEye className="h-5 w-5" />
          </button>
          <button onClick={() => openEditModal(log)} className="text-indigo-600 hover:text-indigo-900 p-1">
            <HiOutlinePencil className="h-5 w-5" />
          </button>
          <button onClick={() => handleDelete(log.id)} className="text-red-600 hover:text-red-900 p-1">
             {/* Check if backend allows delete? Usually yes for admin or owner */}
            <HiOutlineBan className="h-5 w-5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        {/* Search is disabled as backend doesn't support it yet on this endpoint */}
        <div className="w-full max-w-xs"></div> 
        <button
          onClick={openModal}
          className="bg-[#002F41] hover:bg-[#004057] text-white font-semibold py-2 px-4 rounded inline-flex items-center transition duration-150"
        >
          <HiPlus className="mr-2 h-5 w-5" />
          Create New Log
        </button>
      </div>

      {error && <div className="text-red-600 bg-red-100 p-3 rounded">{error}</div>}

      <DataTable
        columns={columns}
        data={logs}
        pagination={pagination}
        onPageChange={handlePageChange}
        isLoading={isLoading}
      />

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen || isEditModalOpen}
        onClose={isEditModalOpen ? closeEditModal : closeModal}
        title={isEditModalOpen ? "Edit Log Entry" : "Create New Log Entry"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Task *</label>
            <select
                name="task_id"
                value={formData.task_id}
                onChange={handleInputChange}
                required
                disabled={isEditModalOpen} // Often log task ID shouldn't change, or if allowed, ensure backend supports it. Backend LogUpdateDTO doesn't seem to have task_id.
                className="mt-1 block w-full p-2 border rounded bg-white disabled:bg-gray-100"
            >
                <option value="">Select Task</option>
                {tasks.map(t => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                ))}
            </select>
            {isEditModalOpen && <p className="text-xs text-gray-500 mt-1">Task cannot be changed for existing log.</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Hours Spent *</label>
            <input
              type="number"
              name="hours_spent_today"
              value={formData.hours_spent_today}
              onChange={handleInputChange}
              required
              min="0.1"
              step="0.1"
              className="mt-1 block w-full input-standard p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows={3}
              className="mt-1 block w-full input-standard p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Task Status</label>
             <select
                  name="task_status"
                  value={formData.task_status}
                  onChange={handleInputChange}
                  className="mt-1 block w-full p-2 border rounded"
              >
                  <option value="To Do">To Do</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Done">Done</option>
                  <option value="Returned">Returned</option>
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
              {isEditModalOpen ? "Save Changes" : "Create Log"}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      {viewingLog && (
          <div className={`fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-gray-500 bg-opacity-75 p-4 sm:p-6 ${isViewModalOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <div className="relative w-full max-w-lg transform rounded-lg bg-white shadow-xl">
                  <div className="flex items-center justify-between border-b px-4 py-3">
                      <h3 className="text-lg font-medium leading-6 text-gray-900">Log Details</h3>
                      <button onClick={closeViewModal} className="text-gray-400 hover:text-gray-500">
                          <HiX className="h-6 w-6" />
                      </button>
                  </div>
                  <div className="p-6 space-y-4">
                      <div>
                          <h4 className="text-sm font-medium text-gray-500">Project</h4>
                          <p className="mt-1 text-gray-900">{viewingLog.project_name}</p>
                      </div>
                      <div>
                          <h4 className="text-sm font-medium text-gray-500">Task</h4>
                          <p className="mt-1 text-gray-900">{viewingLog.task_name}</p>
                      </div>
                      <div>
                          <h4 className="text-sm font-medium text-gray-500">User</h4>
                          <p className="mt-1 text-gray-900">{viewingLog.user_name}</p>
                      </div>
                      <div>
                          <h4 className="text-sm font-medium text-gray-500">Timestamp</h4>
                          <p className="mt-1 text-gray-900">{new Date(viewingLog.timestamp * 1000).toLocaleString()}</p>
                      </div>
                      <div className="border-t pt-4">
                           <h4 className="text-sm font-medium text-gray-500">Description</h4>
                           <p className="mt-2 text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded">{viewingLog.description}</p>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                          <div>
                              <h4 className="text-sm font-medium text-gray-500">Hours Spent</h4>
                              <p className="mt-1 text-gray-900">{viewingLog.hours_spent_today}</p>
                          </div>
                          <div>
                               <h4 className="text-sm font-medium text-gray-500">Status Set</h4>
                               <span className={`px-2 py-1 mt-1 inline-flex text-xs rounded-full ${getLogStatusClass(viewingLog.task_status).className}`}>
                                   {viewingLog.task_status}
                               </span>
                          </div>
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

export default LogsPage;
