import React, { useCallback, useEffect, useState } from "react";
import {
  HiOutlineClock,
  HiOutlineCollection,
  HiOutlineFilter,
  HiOutlinePencil,
  HiOutlineRefresh,
  HiOutlineSearch,
  HiOutlineTrash,
  HiChevronDown,
  HiChevronUp,
  HiX
} from "react-icons/hi";
import { useApi } from "../hooks/useApi";
import type { Log, PaginatedResponse, Pagination, Project, Task, User } from "../types";
import Modal from "./Modal";
import DataTable from "./common/DataTable";
import FloatingActionButton from "./common/FloatingActionButton";

const TasksPage = () => {
  const { request } = useApi();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [pagination, setPagination] = useState<Pagination | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [taskLogs, setTaskLogs] = useState<Log[]>([]);
  const [currentTaskForLogs, setCurrentTaskForLogs] = useState<Task | null>(null);

  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    project_id: "",
    user_id: "",
    hours_required: 0,
    description: "",
    status: "To Do",
  });

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [returnedFilter, setReturnedFilter] = useState<string>("all");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [hoursProgressFilter, setHoursProgressFilter] = useState<string>("all");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const activeFiltersCount = [
      statusFilter !== "all",
      projectFilter !== "all",
      userFilter !== "all",
      returnedFilter !== "all",
      hoursProgressFilter !== "all",
      dateFrom !== "",
      dateTo !== ""
  ].filter(Boolean).length;

  const fetchTasks = async (
    page: number = 1, 
    search: string = "", 
    status: string = "all", 
    project: string = "all", 
    user: string = "all", 
    returned: string = "all",
    fromDate: string = "",
    toDate: string = "",
    hoursProgress: string = "all"
  ) => {
    setIsLoading(true);
    setError(null);
    try {
        const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: "25",
        });
        if (search) {
             queryParams.append("title", search); 
        }
        if (status !== "all") {
            const statusMap: Record<string, string> = {
                "todo": "To Do",
                "inprogress": "In Progress",
                "done": "Done"
            };
            queryParams.append("status", statusMap[status] || status);
        }
        if (project !== "all") {
            queryParams.append("project_id", project);
        }
        if (user !== "all") {
            queryParams.append("user_id", user);
        }
        if (returned !== "all") {
            queryParams.append("returned", (returned === "returned").toString());
        }
        if (fromDate) {
            const fromTimestamp = Math.floor(new Date(fromDate).getTime() / 1000);
            queryParams.append("date_from", fromTimestamp.toString());
        }
        if (toDate) {
            const toTimestamp = Math.floor(new Date(toDate + "T23:59:59").getTime() / 1000);
            queryParams.append("date_to", toTimestamp.toString());
        }
        if (hoursProgress !== "all") {
            queryParams.append("hours_progress", hoursProgress);
        }

        const response = await request<PaginatedResponse<Task>>(`/task/?${queryParams.toString()}`);

        if (response.items) {
             setTasks(response.items);
             setPagination({
                 page: response.page,
                 per_page: response.per_page,
                 total: response.total,
                 total_pages: Math.ceil(response.total / response.per_page),
                 has_next: response.has_next,
                 has_prev: response.has_prev
             });
        } else {
            setTasks([]);
        }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load tasks");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOptions = async () => {
      try {
          const projRes = await request<PaginatedResponse<Project>>('/project/?limit=100');
          const userRes = await request<PaginatedResponse<User>>('/user/?limit=100');
          
          if (projRes.items) setProjects(projRes.items);
          if (userRes.items) setUsers(userRes.items);
      } catch (e: unknown) {
          console.error("Failed to fetch options", e);
      }
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  useEffect(() => {
    fetchTasks(currentPage, searchQuery, statusFilter, projectFilter, userFilter, returnedFilter, dateFrom, dateTo, hoursProgressFilter);
  }, [currentPage, searchQuery, statusFilter, projectFilter, userFilter, returnedFilter, dateFrom, dateTo, hoursProgressFilter]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const openModal = () => {
    setFormData({
        title: "",
        project_id: "",
        user_id: "",
        hours_required: 0,
        description: "",
        status: "To Do"
    });
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      project_id: task.project_id,
      user_id: task.user_id,
      hours_required: task.hours_required,
      description: task.description,
      status: task.status || "To Do",
    });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingTask(null);
  };

  const openLogsModal = async (task: Task) => {
      setCurrentTaskForLogs(task);
      setIsLogsModalOpen(true);
      try {
          const response = await request<PaginatedResponse<Log>>(`/task/${task.id}/logs`);
          if (response.items) {
              setTaskLogs(response.items);
          }
      } catch (e: unknown) {
          console.error("Failed to fetch task logs", e);
      }
  };

  const closeLogsModal = () => {
      setIsLogsModalOpen(false);
      setTaskLogs([]);
      setCurrentTaskForLogs(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'hours_required' ? parseFloat(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Using JSON body instead of FormData for better type handling if backend supports it (FastAPI Pydantic does)
      // Or FormData as before. Previous code used FormData.
      // Let's stick to JSON as it's cleaner for numbers.
      // Backend accepts Pydantic models, so JSON is preferred.
      
      const payload = {
          title: formData.title,
          project_id: formData.project_id,
          user_id: formData.user_id,
          hours_required: formData.hours_required,
          description: formData.description,
          status: formData.status
      };

      if (isEditModalOpen && editingTask) {
        await request(`/task/${editingTask.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        alert("Task updated successfully!");
        closeEditModal();
      } else {
        await request("/task/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        alert("Task created successfully!");
        closeModal();
      }
      fetchTasks(currentPage, searchQuery);
    } catch (e: unknown) {
      alert(`Error: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await request(`/task/${id}`, { method: "DELETE" });
      alert("Task deleted successfully");
      fetchTasks(currentPage, searchQuery);
    } catch (e: unknown) {
      alert(`Error deleting task: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  };

  const columns = [
    {
      header: "Title",
      accessor: (task: Task) => (
        <div>
          <div className="font-medium text-gray-900">{task.title}</div>
          <div className="text-xs text-gray-500 truncate w-64" title={task.description}>{task.description}</div>
        </div>
      ),
    },
    {
      header: "Project",
      accessor: (task: Task) => (
          <span className="text-sm text-gray-700">{task.project_name}</span>
      )
    },
    {
      header: "Assigned To",
      accessor: (task: Task) => (
          <span className="text-sm text-gray-700">{task.user_name}</span>
      )
    },
    {
      header: "Hours",
      accessor: (task: Task) => (
        <div className="flex items-center text-gray-700">
           <HiOutlineClock className="mr-1 text-gray-400" />
           {task.hours_worked} / {task.hours_required}
        </div>
      ),
    },
    {
      header: "Status",
      accessor: (task: Task) => (
        <span
          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
             task.status === 'Done' ? 'bg-green-100 text-green-800' :
             task.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
             task.returned ? 'bg-yellow-100 text-yellow-800' :
             'bg-gray-100 text-gray-800'
          }`}
        >
          {task.returned ? 'Returned' : task.status}
        </span>
      ),
    },
    {
        header: "Returned",
        className: "text-center",
        accessor: (task: Task) => (
             task.returned ? <HiOutlineRefresh className="h-5 w-5 text-yellow-500 mx-auto" title="Returned" /> : <span className="text-gray-300">-</span>
        )
    },
    {
      header: "Actions",
      className: "text-right",
      render: (task: Task) => (
        <div className="flex justify-end space-x-2">
          <button onClick={() => openLogsModal(task)} className="text-gray-600 hover:text-gray-900 p-1" title="View Logs">
            <HiOutlineCollection className="h-5 w-5" />
          </button>
          <button onClick={() => openEditModal(task)} className="text-indigo-600 hover:text-indigo-900 p-1">
            <HiOutlinePencil className="h-5 w-5" />
          </button>
          <button onClick={() => handleDelete(task.id)} className="text-red-600 hover:text-red-900 p-1">
            <HiOutlineTrash className="h-5 w-5" />
          </button>
        </div>
      ),
    },
  ];

  const filteredTasks = tasks;

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-[#002F41] shadow-sm">
        <div className="px-6 py-4">
          <div className="flex flex-col bg-white/10 p-4 rounded-lg border border-white/20 gap-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 min-w-[240px]">
                    <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by title..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002F41] focus:border-[#002F41] outline-none transition-colors bg-white"
                    />
                </div>
                <div className="flex items-center gap-2">
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
                    {(activeFiltersCount > 0 || searchQuery) && (
                         <button 
                            onClick={() => {
                                setSearchQuery("");
                                setStatusFilter("all");
                                setProjectFilter("all");
                                setUserFilter("all");
                                setReturnedFilter("all");
                                setDateFrom("");
                                setDateTo("");
                                setHoursProgressFilter("all");
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
                        <label className="text-xs font-medium text-gray-300 uppercase">Assigned To</label>
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
                        <label className="text-xs font-medium text-gray-300 uppercase">Returned</label>
                        <select
                            value={returnedFilter}
                            onChange={(e) => setReturnedFilter(e.target.value)}
                            className="text-sm text-gray-900 border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-[#71c9ed] outline-none"
                        >
                            <option value="all">Any</option>
                            <option value="returned">Returned</option>
                            <option value="notreturned">Not Returned</option>
                        </select>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-gray-300 uppercase">Progress</label>
                        <select
                            value={hoursProgressFilter}
                            onChange={(e) => setHoursProgressFilter(e.target.value)}
                            className="text-sm text-gray-900 border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-[#71c9ed] outline-none"
                        >
                            <option value="all">Any</option>
                            <option value="not_started">Not Started</option>
                            <option value="on_track">On Track</option>
                            <option value="overdue">Overdue</option>
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
                </div>
            )}
          </div>
        </div>
      </div>

      {error && <div className="text-red-600 bg-red-100 p-4 border-b border-red-200">{error}</div>}

      <div className="flex-1 overflow-auto">
        <DataTable
          columns={columns}
          data={filteredTasks}
          pagination={pagination}
          onPageChange={handlePageChange}
          isLoading={isLoading}
        />
      </div>

      <FloatingActionButton onClick={openModal} title="Create New Task" />

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen || isEditModalOpen}
        onClose={isEditModalOpen ? closeEditModal : closeModal}
        title={isEditModalOpen ? "Edit Task" : "Create New Task"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full input-standard p-2 border rounded"
            />
          </div>
          <div>
              <label className="block text-sm font-medium text-gray-700">Project *</label>
              <select
                  name="project_id"
                  value={formData.project_id}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full p-2 border rounded"
              >
                  <option value="">Select Project</option>
                  {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
              </select>
          </div>
          <div>
              <label className="block text-sm font-medium text-gray-700">Assigned User</label>
              <select
                  name="user_id"
                  value={formData.user_id}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full p-2 border rounded"
              >
                  <option value="">Select User</option>
                  {users.map(u => (
                      <option key={u.id} value={u.id}>{u.full_name}</option>
                  ))}
              </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Hours Required *</label>
            <input
              type="number"
              name="hours_required"
              value={formData.hours_required}
              onChange={handleInputChange}
              required
              min="0.5"
              step="0.5"
              className="mt-1 block w-full input-standard p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="mt-1 block w-full input-standard p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
             <select
                  name="status"
                  value={formData.status}
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
              {isEditModalOpen ? "Save Changes" : "Create Task"}
            </button>
          </div>
        </form>
      </Modal>

       {/* Logs Modal */}
       {isLogsModalOpen && currentTaskForLogs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500 bg-opacity-75 p-4 sm:p-6">
            <div className="relative w-full max-w-3xl max-h-[85vh] flex flex-col transform rounded-lg bg-white shadow-xl">
                <div className="flex items-center justify-between border-b px-4 py-3 flex-shrink-0">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">Logs for: {currentTaskForLogs.title}</h3>
                    <button onClick={closeLogsModal} className="text-gray-400 hover:text-gray-500">
                        <HiX className="h-6 w-6" />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto flex-1">
                     {taskLogs.length === 0 ? (
                         <p className="text-gray-500 text-center py-4">No logs found for this task.</p>
                     ) : (
                         <ul className="space-y-4">
                             {taskLogs.map(log => (
                                 <li key={log.id} className="bg-gray-50 p-3 rounded border border-gray-200">
                                     <div className="flex justify-between items-start">
                                         <div className="text-sm font-medium text-gray-900">
                                             {new Date(log.created_at * 1000).toLocaleString()}
                                         </div>
                                         <span className={`px-2 text-xs rounded-full ${log.task_status === 'Done' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                             {log.task_status}
                                         </span>
                                     </div>
                                     <p className="text-sm text-gray-700 mt-1">{log.description}</p>
                                     <div className="text-xs text-gray-500 mt-2 flex justify-between">
                                         <span>User: {log.user_name}</span>
                                         <span>Hours: {log.hours_spent}</span>
                                     </div>
                                 </li>
                             ))}
                         </ul>
                     )}
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 rounded-b-lg flex-shrink-0">
                    <button
                        onClick={closeLogsModal}
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

export default TasksPage;
