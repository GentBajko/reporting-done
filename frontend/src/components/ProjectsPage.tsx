import React, { useCallback, useEffect, useState } from "react";
import {
  HiChevronDown,
  HiChevronUp,
  HiOutlineClipboardList,
  HiOutlineEye,
  HiOutlineFilter,
  HiOutlineMail,
  HiOutlinePencil,
  HiOutlineSearch,
  HiOutlineTrash,
  HiOutlineUserGroup,
  HiX
} from "react-icons/hi";
import { useApi } from "../hooks/useApi";
import type { Pagination, Project } from "../types";
import Modal from "./Modal";
import DataTable from "./common/DataTable";
import FloatingActionButton from "./common/FloatingActionButton";

const ProjectsPage = () => {
  const { request } = useApi();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [pagination, setPagination] = useState<Pagination | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [viewingProject, setViewingProject] = useState<Project | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    send_email: false,
    archived: false,
  });

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [emailFilter, setEmailFilter] = useState<string>("all");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const activeFiltersCount = [
      statusFilter !== "all",
      emailFilter !== "all",
  ].filter(Boolean).length;

  const fetchProjects = useCallback(async (page: number = 1, search: string = "", status: string = "all", email: string = "all") => {
    setIsLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: "25",
      });
      if (search) {
        queryParams.append("name", search);
      }
      if (status !== "all") {
        queryParams.append("archived", (status === "archived").toString());
      }
      if (email !== "all") {
        queryParams.append("send_email", (email === "with").toString());
      }
      
      const response = await request<any>(`/project/?${queryParams.toString()}`);
      
      if (response.items) {
          setProjects(response.items);
          setPagination({
             page: response.page,
             per_page: response.per_page,
             total: response.total,
             total_pages: Math.ceil(response.total / response.per_page),
             has_next: response.has_next,
             has_prev: response.has_prev
          });
      } else if (Array.isArray(response)) {
         if (response.length === 2 && Array.isArray(response[0]) && 'total' in response[1]) {
             setProjects(response[0]);
             setPagination(response[1]);
         } else {
             setProjects(response);
             setPagination(undefined);
         }
      } else {
          setProjects([]);
      }

    } catch (e: any) {
      setError(e.message || "Failed to load projects");
    } finally {
      setIsLoading(false);
    }
  }, [request]);

  useEffect(() => {
    fetchProjects(currentPage, searchQuery, statusFilter, emailFilter);
  }, [fetchProjects, currentPage, searchQuery, statusFilter, emailFilter]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const openModal = () => {
    setFormData({ name: "", email: "", send_email: false, archived: false });
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const openEditModal = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      email: project.email || "",
      send_email: project.send_email,
      archived: project.archived,
    });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingProject(null);
  };

  const openViewModal = (project: Project) => {
      setViewingProject(project);
      setIsViewModalOpen(true);
  };

  const closeViewModal = () => {
      setIsViewModalOpen(false);
      setViewingProject(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = new FormData();
      data.append("name", formData.name);
      data.append("email", formData.email);
      data.append("send_email", String(formData.send_email));
      data.append("archived", String(formData.archived));

      if (isEditModalOpen && editingProject) {
        await request(`/project/${editingProject.id}`, {
          method: "PUT",
          body: data,
        });
        alert("Project updated successfully!");
        closeEditModal();
      } else {
        await request("/project/", {
          method: "POST",
          body: data,
        });
        alert("Project created successfully!");
        closeModal();
      }
      fetchProjects(currentPage, searchQuery);
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    try {
      await request(`/project/${id}`, { method: "DELETE" });
      alert("Project deleted successfully");
      fetchProjects(currentPage, searchQuery);
    } catch (e: any) {
      alert(`Error deleting project: ${e.message}`);
    }
  };

  const columns = [
    {
      header: "Project Name",
      accessor: (project: Project) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{project.name}</div>
          <div className="text-xs text-gray-500">ID: {project.id}</div>
        </div>
      ),
    },
    {
      header: "Email",
      accessor: (project: Project) => (
        <div>
            {project.email ? (
                <a href={`mailto:${project.email}`} className="text-indigo-600 hover:underline flex items-center">
                    <HiOutlineMail className="mr-1" /> {project.email}
                </a>
            ) : <span className="text-gray-400">N/A</span>}
            <div className="text-xs text-gray-500">{project.send_email ? 'Notifs On' : 'Notifs Off'}</div>
        </div>
      ),
    },
    {
      header: "Team",
      accessor: (project: Project) => (
          <div className="flex items-center text-gray-700">
              <HiOutlineUserGroup className="mr-1" /> {project.developers?.length || 0} Devs
          </div>
      )
    },
    {
        header: "Tasks",
        accessor: (project: Project) => (
            <div className="flex items-center text-gray-700">
                <HiOutlineClipboardList className="mr-1" /> {project.tasks?.length || 0} Tasks
            </div>
        )
      },
    {
      header: "Status",
      accessor: (project: Project) => (
        <span
          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            project.archived ? "bg-gray-100 text-gray-800" : "bg-green-100 text-green-800"
          }`}
        >
          {project.archived ? "Archived" : "Active"}
        </span>
      ),
    },
    {
      header: "Actions",
      className: "text-right",
      render: (project: Project) => (
        <div className="flex justify-end space-x-2">
          <button onClick={() => openViewModal(project)} className="text-[#002F41] hover:text-[#004057] p-1">
            <HiOutlineEye className="h-5 w-5" />
          </button>
          <button onClick={() => openEditModal(project)} className="text-indigo-600 hover:text-indigo-900 p-1">
            <HiOutlinePencil className="h-5 w-5" />
          </button>
          <button onClick={() => handleDelete(project.id)} className="text-red-600 hover:text-red-900 p-1">
            <HiOutlineTrash className="h-5 w-5" />
          </button>
        </div>
      ),
    },
  ];

  // Backend handles filtering now
  const filteredProjects = projects;

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
                        placeholder="Search by name..."
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
                            setEmailFilter("all");
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
                            <option value="all">All</option>
                            <option value="active">Active</option>
                            <option value="archived">Archived</option>
                        </select>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-gray-300 uppercase">Email Notifications</label>
                        <select
                            value={emailFilter}
                            onChange={(e) => setEmailFilter(e.target.value)}
                            className="text-sm text-gray-900 border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-[#71c9ed] outline-none"
                        >
                            <option value="all">All</option>
                            <option value="with">Notifications On</option>
                            <option value="without">Notifications Off</option>
                        </select>
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
          data={filteredProjects}
          pagination={pagination}
          onPageChange={handlePageChange}
          isLoading={isLoading}
        />
      </div>

      <FloatingActionButton onClick={openModal} title="Create New Project" />

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen || isEditModalOpen}
        onClose={isEditModalOpen ? closeEditModal : closeModal}
        title={isEditModalOpen ? "Edit Project" : "Create New Project"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Project Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full input-standard p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email (Optional)</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="mt-1 block w-full input-standard p-2 border rounded"
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              name="send_email"
              checked={formData.send_email}
              onChange={handleInputChange}
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">Send Email Notifications</label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              name="archived"
              checked={formData.archived}
              onChange={handleInputChange}
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">Archived</label>
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
              {isEditModalOpen ? "Save Changes" : "Create Project"}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      {viewingProject && (
          <div className={`fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-gray-500 bg-opacity-75 p-4 sm:p-6 transition-opacity ${isViewModalOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <div className="relative w-full max-w-5xl transform rounded-lg bg-white shadow-xl transition-all">
                  <div className="flex items-center justify-between border-b px-4 py-3">
                      <h3 className="text-lg font-medium leading-6 text-gray-900">Project Details: {viewingProject.name}</h3>
                      <button onClick={closeViewModal} className="text-gray-400 hover:text-gray-500">
                          <HiX className="h-6 w-6" />
                      </button>
                  </div>
                  <div className="p-6 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                              <h4 className="text-sm font-medium text-gray-500">Contact Email</h4>
                              <p className="mt-1 text-sm text-gray-900">{viewingProject.email || "N/A"}</p>
                          </div>
                          <div>
                              <h4 className="text-sm font-medium text-gray-500">Status</h4>
                              <p className="mt-1 text-sm text-gray-900">{viewingProject.archived ? "Archived" : "Active"}</p>
                          </div>
                      </div>

                      <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-2">Team Members ({viewingProject.developers?.length || 0})</h4>
                          <div className="flex flex-wrap gap-2">
                              {viewingProject.developers?.length === 0 && <p className="text-sm text-gray-500">No developers assigned.</p>}
                              {viewingProject.developers?.map(dev => (
                                  <div key={dev.id} className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full border border-gray-200">
                                      <span className="text-sm font-medium text-gray-900">{dev.full_name}</span>
                                      <span className="text-xs text-gray-500">{dev.email}</span>
                                  </div>
                              ))}
                          </div>
                      </div>

                      <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-2">Tasks ({viewingProject.tasks?.length || 0})</h4>
                          {viewingProject.tasks?.length === 0 ? (
                              <p className="text-sm text-gray-500">No tasks found.</p>
                          ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                                  {viewingProject.tasks?.map(task => (
                                      <div key={task.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                          <p className="font-medium text-sm text-gray-900 truncate" title={task.title}>{task.title}</p>
                                          <div className="flex items-center justify-between mt-1">
                                              <span className={`text-xs px-1.5 py-0.5 rounded ${
                                                  task.status === 'Done' ? 'bg-green-100 text-green-700' :
                                                  task.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                                                  'bg-gray-100 text-gray-600'
                                              }`}>{task.status}</span>
                                              <span className="text-xs text-gray-500">{task.hours_worked}/{task.hours_required}h</span>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          )}
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

export default ProjectsPage;
