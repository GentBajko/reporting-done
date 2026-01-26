import React, { useCallback, useEffect, useState } from "react";
import {
  HiOutlineBan,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineExclamation,
  HiOutlineEye,
  HiOutlineInformationCircle,
  HiOutlinePencil,
  HiOutlineFilter,
  HiChevronDown,
  HiChevronUp,
  HiX
} from "react-icons/hi";
import { useApi } from "../hooks/useApi";
import type { Log, PaginatedResponse, Pagination, Task, Project, User } from "../types";
import Modal from "./Modal";
import DataTable from "./common/DataTable";
import FloatingActionButton from "./common/FloatingActionButton";

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
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  const [viewingLog, setViewingLog] = useState<Log | null>(null);
  const [editingLog, setEditingLog] = useState<Log | null>(null);

  const [formData, setFormData] = useState({
    task_id: "",
    description: "",
    hours_spent: 0,
    task_status: "In Progress",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [taskFilter, setTaskFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [hoursMin, setHoursMin] = useState<string>("");
  const [hoursMax, setHoursMax] = useState<string>("");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const activeFiltersCount = [
      statusFilter !== "all",
      projectFilter !== "all",
      userFilter !== "all",
      taskFilter !== "all",
      dateFrom !== "",
      dateTo !== "",
      hoursMin !== "",
      hoursMax !== ""
  ].filter(Boolean).length;

  const fetchLogs = async (
    page: number = 1, 
    status: string = "all", 
    project: string = "all", 
    user: string = "all",
    task: string = "all",
    fromDate: string = "",
    toDate: string = "",
    minHours: string = "",
    maxHours: string = ""
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: "25",
      });
      
      if (status !== "all") {
          const statusMap: Record<string, string> = {
                "todo": "To Do",
                "inprogress": "In Progress",
                "done": "Done",
                "returned": "Returned"
            };
          queryParams.append("task_status", statusMap[status] || status);
      }
      if (project !== "all") {
          queryParams.append("project_id", project);
      }
      if (user !== "all") {
          queryParams.append("user_id", user);
      }
      if (task !== "all") {
          queryParams.append("task_id", task);
      }
      if (fromDate) {
          const fromTimestamp = Math.floor(new Date(fromDate).getTime() / 1000);
          queryParams.append("date_from", fromTimestamp.toString());
      }
      if (toDate) {
          const toTimestamp = Math.floor(new Date(toDate + "T23:59:59").getTime() / 1000);
          queryParams.append("date_to", toTimestamp.toString());
      }
      if (minHours) {
          queryParams.append("hours_min", minHours);
      }
      if (maxHours) {
          queryParams.append("hours_max", maxHours);
      }

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
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load logs");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOptions = async () => {
      try {
          const taskRes = await request<PaginatedResponse<Task>>('/task/?limit=100');
          if (taskRes.items) setTasks(taskRes.items);

          const projRes = await request<PaginatedResponse<Project>>('/project/?limit=100');
          if (projRes.items) setProjects(projRes.items);
          
          const userRes = await request<PaginatedResponse<User>>('/user/?limit=100');
          if (userRes.items) setUsers(userRes.items);
      } catch (e: unknown) {
          console.error("Failed to fetch options", e);
      }
  };

  useEffect(() => {
    fetchLogs(currentPage, statusFilter, projectFilter, userFilter, taskFilter, dateFrom, dateTo, hoursMin, hoursMax);
  }, [currentPage, statusFilter, projectFilter, userFilter, taskFilter, dateFrom, dateTo, hoursMin, hoursMax]);

  useEffect(() => {
      fetchOptions();
  }, []);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const openModal = () => {
    setFormData({
        task_id: "",
        description: "",
        hours_spent: 0,
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
      hours_spent: log.hours_spent,
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
      [name]: name === 'hours_spent' ? parseFloat(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
          task_id: formData.task_id,
          description: formData.description,
          hours_spent: formData.hours_spent,
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
    } catch (e: unknown) {
      alert(`Error: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this log?")) return;
    try {
      await request(`/log/${id}`, { method: "DELETE" });
      alert("Log deleted successfully");
      fetchLogs(currentPage);
    } catch (e: unknown) {
      alert(`Error deleting log: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  };

  const columns = [
    {
      header: "Timestamp",
      accessor: (log: Log) => (
        <div>
            <div className="text-sm text-gray-900">{new Date(log.created_at * 1000).toLocaleString()}</div>
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
                <HiOutlineClock className="mr-1" /> {log.hours_spent} hrs
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

  const filteredLogs = logs;

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-[#002F41] shadow-sm">
        <div className="px-6 py-4">
          <div className="flex flex-col bg-white/10 p-4 rounded-lg border border-white/20 gap-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-end">
                {/* Search was hidden/removed previously as per code analysis. We keep the layout consistent with TasksPage but without search input for now if not needed, OR we just put the Filter button on the right.
                    Wait, the user prompt said "Just leave the controls at the top".
                    If there is no search, we can just show the Filter button.
                    Or we can add a "fake" spacer.
                */}
                <div className="flex items-center gap-2 ml-auto">
                    <button
                        onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border transition-colors ${
                            isFiltersOpen || activeFiltersCount > 0
                            ? "border-[#002F41] text-[#002F41] bg-white" 
                            : "border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                        }`}
                    >
                        <HiOutlineFilter className="h-5 w-5" />
                        <span>Filters</span>
                        {activeFiltersCount > 0 && (
                            <span className="flex items-center justify-center w-5 h-5 text-xs text-white bg-[#002F41] rounded-full">
                                {activeFiltersCount}
                            </span>
                        )}
                        {isFiltersOpen ? <HiChevronUp className="h-4 w-4" /> : <HiChevronDown className="h-4 w-4" />}
                    </button>
                    {(activeFiltersCount > 0) && (
                        <button 
                            onClick={() => {
                                setSearchQuery("");
                                setStatusFilter("all");
                                setProjectFilter("all");
                                setUserFilter("all");
                                setTaskFilter("all");
                                setDateFrom("");
                                setDateTo("");
                                setHoursMin("");
                                setHoursMax("");
                            }}
                            className="text-sm text-gray-300 hover:text-white px-3 py-2"
                        >
                            Reset
                        </button>
                    )}
                </div>
            </div>
            
            {isFiltersOpen && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-white/20">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-gray-300 uppercase">Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="text-sm text-gray-900 border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-[#71c9ed] outline-none"
                        >
                            <option value="all">All Statuses</option>
                            <option value="todo">To Do</option>
                            <option value="inprogress">In Progress</option>
                            <option value="done">Done</option>
                            <option value="returned">Returned</option>
                        </select>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-gray-300 uppercase">Project</label>
                        <select
                            value={projectFilter}
                            onChange={(e) => setProjectFilter(e.target.value)}
                            className="text-sm text-gray-900 border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-[#71c9ed] outline-none"
                        >
                            <option value="all">All Projects</option>
                            {projects.map(proj => (
                                <option key={proj.id} value={proj.id}>{proj.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-gray-300 uppercase">User</label>
                        <select
                            value={userFilter}
                            onChange={(e) => setUserFilter(e.target.value)}
                            className="text-sm text-gray-900 border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-[#71c9ed] outline-none"
                        >
                            <option value="all">All Users</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.full_name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-gray-300 uppercase">Task</label>
                        <select
                            value={taskFilter}
                            onChange={(e) => setTaskFilter(e.target.value)}
                            className="text-sm text-gray-900 border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-[#71c9ed] outline-none"
                        >
                            <option value="all">All Tasks</option>
                            {tasks.map(t => (
                                <option key={t.id} value={t.id}>{t.title}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-gray-300 uppercase">From Date</label>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="text-sm text-gray-900 border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-[#71c9ed] outline-none"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-gray-300 uppercase">To Date</label>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="text-sm text-gray-900 border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-[#71c9ed] outline-none"
                        />
                    </div>

                    <div className="flex flex-col gap-1 col-span-1 sm:col-span-2 lg:col-span-2">
                        <label className="text-xs font-medium text-gray-300 uppercase">Hours Range</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                placeholder="Min"
                                value={hoursMin}
                                onChange={(e) => setHoursMin(e.target.value)}
                                min="0"
                                step="0.5"
                                className="w-full text-sm text-gray-900 border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-[#71c9ed] outline-none"
                            />
                            <span className="text-gray-300">-</span>
                            <input
                                type="number"
                                placeholder="Max"
                                value={hoursMax}
                                onChange={(e) => setHoursMax(e.target.value)}
                                min="0"
                                step="0.5"
                                className="w-full text-sm text-gray-900 border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-[#71c9ed] outline-none"
                            />
                        </div>
                    </div>
                </div>
            )}
          </div>
        </div>
      </div>

      {error && <div className="text-red-600 bg-red-100 p-4 border-b border-red-200">{error}</div>}

      <div className="flex-1 overflow-auto">
        <DataTable
          columns={columns}
          data={filteredLogs}
          pagination={pagination}
          onPageChange={handlePageChange}
          isLoading={isLoading}
        />
      </div>

      <FloatingActionButton onClick={openModal} title="Create New Log" />

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
              name="hours_spent"
              value={formData.hours_spent}
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
                          <p className="mt-1 text-gray-900">{new Date(viewingLog.created_at * 1000).toLocaleString()}</p>
                      </div>
                      <div className="border-t pt-4">
                           <h4 className="text-sm font-medium text-gray-500">Description</h4>
                           <p className="mt-2 text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded">{viewingLog.description}</p>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                          <div>
                              <h4 className="text-sm font-medium text-gray-500">Hours Spent</h4>
                              <p className="mt-1 text-gray-900">{viewingLog.hours_spent}</p>
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
