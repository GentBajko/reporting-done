import React, { useEffect, useState } from "react";
import {
  HiCamera,
  HiCheck,
  HiClock,
  HiCreditCard,
  HiDocumentText,
  HiFolder,
  HiPencil,
  HiShieldCheck,
  HiUserCircle,
  HiX,
} from "react-icons/hi";
import { useApi } from "../hooks/useApi";
import { useAuth } from "../hooks/useAuth";

interface Identifiable {
  id: string;
  avatar_url?: string | null;
}

interface ContactInfo {
  email: string;
  phone?: string | null;
}

interface PersonalInfo {
  name: string;
  last_name: string;
  full_name?: string;
}

interface OrganizationInfo {
  organizationId?: string | null;
  role_type: number;
  permissions: number;
  status: number;
  is_verified: boolean;
}

interface SubscriptionInfo {
  subscription: string;
  limit: number;
  month_usage?: number | null;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  subscription_status?: string | null;
  stripe_price_id?: string | null;
  stripe_subscription_item_id?: string | null;
  subscription_start_date?: string | null;
  subscription_cancel_date?: string | null;
}

interface SecurityInfo {
  last_login?: string | null;
  failed_login_attempts: number;
  password_reset_required: boolean;
}

interface Timestamps {
  created_at: string;
  updated_at: string;
  monthly_at?: string | null;
}

interface ProjectResponse {
  id: string;
  name: string;
}

interface FileResponse {
  id: string;
  name: string;
}

interface UserResources {
  projects: ProjectResponse[];
  files: FileResponse[];
}

type UserProfileData = Identifiable &
  ContactInfo &
  PersonalInfo &
  OrganizationInfo &
  SubscriptionInfo &
  SecurityInfo &
  Timestamps &
  UserResources;

interface EditProfileFormData {
  full_name?: string;
  name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
}

const UserProfilePage = () => {
  const { user } = useAuth();
  const { request } = useApi();
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<EditProfileFormData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      setIsLoading(true);
      setError(null);
      const fetchProfileData = async () => {
        try {
          const data = await request<UserProfileData>(`/user/${user.id}`);
          setProfileData(data);
        } catch (err: unknown) {
          setError(
            err instanceof Error ? err.message : "Could not load profile data."
          );
        } finally {
          setIsLoading(false);
        }
      };
      fetchProfileData();
    } else {
      setIsLoading(false);
      setError("User not authenticated. Please log in.");
    }
  }, [user?.id, request]);

  useEffect(() => {
    if (profileData && isEditing) {
      setEditFormData({
        full_name: profileData.full_name,
        name: profileData.name,
        last_name: profileData.last_name,
        email: profileData.email,
        phone: profileData.phone || "",
      });
    } else if (!isEditing) {
      setEditFormData({});
    }
  }, [profileData, isEditing]);

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (isEditing && profileData) {
      setEditFormData({
        full_name: profileData.full_name,
        name: profileData.name,
        last_name: profileData.last_name,
        email: profileData.email,
        phone: profileData.phone || "",
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    const formData = new FormData();
    formData.append("avatar", file);

    setIsSaving(true);
    try {
      // Assuming the endpoint is /user/{id}/avatar for file uploads
      // We need to bypass the default JSON content-type of useApi for FormData
      // so we'll use fetch directly or rely on useApi not setting Content-Type if we pass FormData?
      // The current useApi implementation sets headers: { 'Accept': 'application/json', ...options.headers }
      // fetch handles FormData content-type automatically if not set.
      
      // Using request with a body that is FormData:
      // Note: We might need to cast the body to any because RequestInit body is BodyInit | null | undefined
      const updatedProfile = await request<UserProfileData>(`/user/${user.id}/avatar`, {
        method: "POST",
        body: formData as unknown as BodyInit,
        // Important: Do NOT set Content-Type header for FormData, let the browser set it with boundary
      });
      setProfileData(updatedProfile);
      alert("Avatar updated successfully!");
    } catch (err: unknown) {
      console.error("Error uploading avatar:", err);
      setError("Failed to upload avatar image.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!profileData || !user?.id) return;

    const changedData: EditProfileFormData = {};
    if (
      editFormData.full_name !== undefined &&
      editFormData.full_name !== profileData.full_name
    ) {
      changedData.full_name = editFormData.full_name;
    }
    if (
      editFormData.email !== undefined &&
      editFormData.email !== profileData.email
    ) {
      changedData.email = editFormData.email;
    }

    if (Object.keys(changedData).length === 0) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const updatedProfile = await request<UserProfileData>(`/user/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changedData),
      });
      setProfileData(updatedProfile);
      setIsEditing(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not save profile data.");
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleString();
  };

  if (isLoading && !profileData && !error) {
    return <div className="text-center p-10">Loading profile...</div>;
  }

  if (error) {
    return (
      <div className="text-center p-10 text-red-600 bg-red-100 rounded-md">
        Error: {error}
      </div>
    );
  }

  if (!profileData && !isLoading) {
    return (
      <div className="text-center p-10">
        User profile not found or user not logged in.
      </div>
    );
  }

  if (!profileData) return <div className="text-center p-10">Loading...</div>;

  return (
    <div className="max-w-5xl mx-auto my-12 px-6 sm:px-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between pb-8 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row items-center sm:items-start">
          <div className="relative group">
             {profileData.avatar_url ? (
                <img 
                  src={profileData.avatar_url} 
                  alt="Profile" 
                  className="w-24 h-24 rounded-full object-cover mb-4 sm:mb-0 sm:mr-8 border border-gray-200"
                />
             ) : (
                <HiUserCircle className="w-24 h-24 text-gray-300 mb-4 sm:mb-0 sm:mr-8" />
             )}
             
             <label className="absolute bottom-4 right-8 sm:right-8 sm:bottom-0 bg-white rounded-full p-1.5 shadow-md cursor-pointer hover:bg-gray-50 transition-colors border border-gray-200 group-hover:flex hidden">
                <HiCamera className="w-4 h-4 text-gray-600" />
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={isSaving}
                />
             </label>

             {profileData.is_verified && (
                <div className="absolute top-0 right-6 sm:right-6 bg-white rounded-full p-1 shadow-sm z-10">
                   <HiShieldCheck className="w-6 h-6 text-blue-500" title="Verified User" />
                </div>
             )}
          </div>
          
          <div className="text-center sm:text-left pt-2">
            <div className="flex items-center justify-center sm:justify-start mb-2">
              {isEditing ? (
                <div className="flex space-x-3">
                  <input
                    type="text"
                    name="name"
                    value={editFormData.name || ""}
                    onChange={handleInputChange}
                    className="text-3xl font-bold text-gray-900 border-b-2 border-gray-200 focus:border-indigo-600 focus:outline-none py-1 w-40 bg-transparent transition-colors"
                    placeholder="First Name"
                  />
                  <input
                    type="text"
                    name="last_name"
                    value={editFormData.last_name || ""}
                    onChange={handleInputChange}
                    className="text-3xl font-bold text-gray-900 border-b-2 border-gray-200 focus:border-indigo-600 focus:outline-none py-1 w-40 bg-transparent transition-colors"
                    placeholder="Last Name"
                  />
                </div>
              ) : (
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                  {profileData.name || profileData.full_name || "Unknown User"}{" "}
                  {profileData.last_name}
                </h1>
              )}
            </div>
            <p className="text-gray-500 text-base mb-3">{profileData.email}</p>
            <div className="flex flex-wrap gap-3 justify-center sm:justify-start items-center">
               <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${profileData.status === 1 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                 Status: {profileData.status}
               </span>
               <span className="text-xs text-gray-400 flex items-center">
                 <HiClock className="mr-1" /> Joined {formatDate(profileData.created_at)}
               </span>
            </div>
          </div>
        </div>
        <div className="mt-6 sm:mt-2">
          {!isEditing ? (
            <button
              onClick={handleEditToggle}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <HiPencil className="mr-2 h-4 w-4 text-gray-500" /> Edit Profile
            </button>
          ) : (
            <div className="flex space-x-3">
              <button
                onClick={handleSaveChanges}
                disabled={isSaving}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <HiCheck className="mr-2 h-4 w-4" /> Save
              </button>
              <button
                onClick={handleEditToggle}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <HiX className="mr-2 h-4 w-4 text-gray-500" /> Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="py-10 space-y-12">
        
        {/* Personal & Contact Details */}
        <section>
          <div className="flex items-center mb-6">
            <div className="bg-indigo-100 p-2 rounded-lg mr-3">
               <HiDocumentText className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Personal Details</h2>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div>
              <dt className="text-sm font-medium text-gray-500 mb-1">User ID</dt>
              <dd className="text-base text-gray-900 font-mono break-all">{profileData.id}</dd>
            </div>
             <div>
              <dt className="text-sm font-medium text-gray-500 mb-1">Phone Number</dt>
              <dd className="text-base text-gray-900">
                {isEditing ? (
                   <input
                    type="text"
                    name="phone"
                    value={editFormData.phone || ""}
                    onChange={handleInputChange}
                    className="block w-full border-b border-gray-300 focus:border-indigo-500 focus:outline-none py-1 bg-transparent"
                    placeholder="+1 (555) 000-0000"
                  />
                ) : (
                  profileData.phone || <span className="text-gray-400 italic">Not provided</span>
                )}
              </dd>
            </div>
             <div>
              <dt className="text-sm font-medium text-gray-500 mb-1">Last Login</dt>
              <dd className="text-base text-gray-900">{formatDate(profileData.last_login)}</dd>
            </div>
          </div>
        </section>

        <div className="border-t border-gray-100" />

        {/* Subscription & Usage */}
        <section>
           <div className="flex items-center mb-6">
             <div className="bg-indigo-100 p-2 rounded-lg mr-3">
               <HiCreditCard className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Subscription & Usage</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
               <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                 <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Current Plan</p>
                 <p className="text-2xl font-bold text-gray-900 mb-1">{profileData.subscription || "Free Tier"}</p>
                 <div className="flex items-center mt-2">
                    <span className={`w-2 h-2 rounded-full mr-2 ${!profileData.subscription_status || profileData.subscription_status === 'active' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                    <span className="text-sm text-gray-600 capitalize">{profileData.subscription_status || "Active"}</span>
                 </div>
               </div>
            </div>
            
            <div className="lg:col-span-2 flex flex-col justify-center">
               <div className="flex space-x-8 text-sm text-gray-500 mt-4 lg:mt-0">
                 <div>
                   <span className="block text-xs uppercase tracking-wide text-gray-400 mb-1">Billing Cycle Start</span>
                   <span className="font-medium text-gray-900">{formatDate(profileData.subscription_start_date)}</span>
                 </div>
                 <div>
                   <span className="block text-xs uppercase tracking-wide text-gray-400 mb-1">Next Reset</span>
                   <span className="font-medium text-gray-900">{formatDate(profileData.monthly_at)}</span>
                 </div>
               </div>
            </div>
          </div>
        </section>

        <div className="border-t border-gray-100" />

        {/* Resources */}
        <section>
           <div className="flex items-center mb-6">
             <div className="bg-indigo-100 p-2 rounded-lg mr-3">
               <HiFolder className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Resources</h2>
          </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                 <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-medium text-gray-900">Active Projects</h3>
                    <span className="bg-gray-100 px-2.5 py-0.5 rounded-full text-xs font-medium text-gray-600">{profileData.projects?.length || 0}</span>
                 </div>
                 <div className="space-y-2">
                     {profileData.projects && profileData.projects.length > 0 ? (
                        profileData.projects.map(p => (
                            <div key={p.id} className="flex items-center p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors">
                                <div className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></div>
                                <span className="text-sm text-gray-700 truncate">{p.name}</span>
                            </div>
                        ))
                     ) : <p className="text-sm text-gray-400 italic">No projects found.</p>}
                 </div>
              </div>
           </div>
        </section>
      
      </div>
    </div>
  );
};

export default UserProfilePage;
