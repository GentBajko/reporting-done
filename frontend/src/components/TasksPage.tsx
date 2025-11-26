import React, { useEffect, useState } from "react";
import {
  HiOutlineClock,
  HiOutlineCollection,
  HiOutlinePencil,
  HiOutlineRefresh,
  HiOutlineTrash,
  HiPlus,
  HiOutlineInformationCircle,
  HiX
} from "react-icons/hi";
import Modal from "./Modal";
import DataTable from "./common/DataTable";
import SearchFilter from "./common/SearchFilter";
import { useApi } from "../hooks/useApi";
import type { Task, Project, User, Pagination, Log, PaginatedResponse } from "../types";

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

  const fetchTasks = async (page: number = 1, search: string = "") => {
    setIsLoading(true);
    setError(null);
    try {
        const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: "10",
        });
        if (search) {
             queryParams.append("title", search); 
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
    } catch (e: any) {
      setError(e.message || "Failed to load tasks");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOptions = async () => {
      try {
          // Fetching all projects and users for dropdowns. 
          // In a large system this should be paginated or searchable dropdowns.
          // For now fetching first page or assuming backend returns all if limit is high.
          const projRes = await request<any>('/project/?limit=100');
          const userRes = await request<any>('/user/?limit=100');
          
          if (Array.isArray(projRes)) setProjects(projRes); // handling the non-paginated fallback or tuple if logic matches
          else if (projRes.items) setProjects(projRes.items);
          else if (Array.isArray(projRes[0])) setProjects(projRes[0]);

          if (Array.isArray(userRes)) setUsers(userRes);
          else if (userRes.items) setUsers(userRes.items);
          else if (Array.isArray(userRes[0])) setUsers(userRes[0]);

      } catch (e) {
          console.error("Failed to fetch options", e);
      }
  };

  useEffect(() => {
    fetchTasks(currentPage, searchQuery);
  }, [currentPage, searchQuery]);

  useEffect(() => {
      if (isModalOpen || isEditModalOpen) {
          fetchOptions();
      }
  }, [isModalOpen, isEditModalOpen]);

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
          const response = await request<any>(`/task/${task.id}/logs`);
          if (response.items) {
              setTaskLogs(response.items);
          } else if (Array.isArray(response)) {
               setTaskLogs(response);
          }
      } catch (e) {
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
      
      const payload: any = {
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
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await request(`/task/${id}`, { method: "DELETE" });
      alert("Task deleted successfully");
      fetchTasks(currentPage, searchQuery);
    } catch (e: any) {
      alert(`Error deleting task: ${e.message}`);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <SearchFilter value={searchQuery} onChange={setSearchQuery} placeholder="Search tasks..." />
        <button
          onClick={openModal}
          className="bg-[#002F41] hover:bg-[#004057] text-white font-semibold py-2 px-4 rounded inline-flex items-center transition duration-150"
        >
          <HiPlus className="mr-2 h-5 w-5" />
          Create New Task
        </button>
      </div>

      {error && <div className="text-red-600 bg-red-100 p-3 rounded">{error}</div>}

      <DataTable
        columns={columns}
        data={tasks}
        pagination={pagination}
        onPageChange={handlePageChange}
        isLoading={isLoading}
      />

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
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-gray-500 bg-opacity-75 p-4 sm:p-6">
            <div className="relative w-full max-w-3xl transform rounded-lg bg-white shadow-xl">
                <div className="flex items-center justify-between border-b px-4 py-3">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">Logs for: {currentTaskForLogs.title}</h3>
                    <button onClick={closeLogsModal} className="text-gray-400 hover:text-gray-500">
                        <HiX className="h-6 w-6" />
                    </button>
                </div>
                <div className="p-6 max-h-96 overflow-y-auto">
                     {taskLogs.length === 0 ? (
                         <p className="text-gray-500 text-center py-4">No logs found for this task.</p>
                     ) : (
                         <ul className="space-y-4">
                             {taskLogs.map(log => (
                                 <li key={log.id} className="bg-gray-50 p-3 rounded border border-gray-200">
                                     <div className="flex justify-between items-start">
                                         <div className="text-sm font-medium text-gray-900">
                                             {new Date(log.timestamp * 1000).toLocaleString()}
                                         </div>
                                         <span className={`px-2 text-xs rounded-full ${log.task_status === 'Done' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                             {log.task_status}
                                         </span>
                                     </div>
                                     <p className="text-sm text-gray-700 mt-1">{log.description}</p>
                                     <div className="text-xs text-gray-500 mt-2 flex justify-between">
                                         <span>User: {log.user_name}</span>
                                         <span>Hours: {log.hours_spent_today}</span>
                                     </div>
                                 </li>
                             ))}
                         </ul>
                     )}
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 rounded-b-lg">
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
