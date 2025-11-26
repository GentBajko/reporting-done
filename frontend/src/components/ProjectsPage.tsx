import React, { useEffect, useState } from "react";
import {
  HiOutlineClipboardList,
  HiOutlineEye,
  HiOutlineMail,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineUserGroup,
  HiPlus,
  HiX
} from "react-icons/hi";
import { useApi } from "../hooks/useApi";
import type { Pagination, Project } from "../types";
import Modal from "./Modal";
import DataTable from "./common/DataTable";
import SearchFilter from "./common/SearchFilter";

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

  const fetchProjects = async (page: number = 1, search: string = "") => {
    setIsLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });
      if (search) {
        queryParams.append("name", search); // Assuming exact match for now, or backend handles it
      }
      
      // The backend currently returns [data, pagination] tuple or similar based on analysis? 
      // Wait, look at get_all_projects in project_view.py:
      // return output, pagination
      // And it's an endpoint. Fastapi usually returns JSON. 
      // If the return type is Tuple[List[Model], Pagination], FastAPI might serialize it as [list, pagination_dict].
      // Let's check the previous ProjectsPage implementation... it expected `data: Project[] = await response.json()`.
      // This implies the previous implementation MIGHT have been wrong about pagination if the backend WAS updated to return a tuple.
      // OR the backend returns a list directly if no pagination wrapper model is used. 
      // Let's look at project_controller.py to see the router definition.
      
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
         // Legacy fallback if structure is different
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
  };

  useEffect(() => {
    fetchProjects(currentPage, searchQuery);
  }, [currentPage, searchQuery]); // Debounce search in real app

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <SearchFilter value={searchQuery} onChange={setSearchQuery} placeholder="Search projects..." />
        <button
          onClick={openModal}
          className="bg-[#002F41] hover:bg-[#004057] text-white font-semibold py-2 px-4 rounded inline-flex items-center transition duration-150"
        >
          <HiPlus className="mr-2 h-5 w-5" />
          Create New Project
        </button>
      </div>

      {error && <div className="text-red-600 bg-red-100 p-3 rounded">{error}</div>}

      <DataTable
        columns={columns}
        data={projects}
        pagination={pagination}
        onPageChange={handlePageChange}
        isLoading={isLoading}
      />

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
              <div className="relative w-full max-w-3xl transform rounded-lg bg-white shadow-xl transition-all">
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
                          <ul className="divide-y divide-gray-200 bg-gray-50 rounded-md border border-gray-200">
                              {viewingProject.developers?.length === 0 && <li className="p-3 text-sm text-gray-500">No developers assigned.</li>}
                              {viewingProject.developers?.map(dev => (
                                  <li key={dev.id} className="p-3 text-sm flex justify-between">
                                      <span>{dev.full_name}</span>
                                      <span className="text-gray-400 text-xs">{dev.email}</span>
                                  </li>
                              ))}
                          </ul>
                      </div>

                      <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-2">Tasks ({viewingProject.tasks?.length || 0})</h4>
                          <div className="max-h-48 overflow-y-auto rounded-md border border-gray-200 bg-gray-50">
                            <ul className="divide-y divide-gray-200">
                                {viewingProject.tasks?.length === 0 && <li className="p-3 text-sm text-gray-500">No tasks found.</li>}
                                {viewingProject.tasks?.map(task => (
                                    <li key={task.id} className="p-3 text-sm flex justify-between items-center">
                                        <div>
                                            <p className="font-medium">{task.title}</p>
                                            <p className="text-xs text-gray-500">{task.status}</p>
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {task.hours_worked} / {task.hours_required} hrs
                                        </div>
                                    </li>
                                ))}
                            </ul>
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

export default ProjectsPage;
