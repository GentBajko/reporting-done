import React, { useEffect, useState } from "react";
import { HiCheck, HiPencil, HiUserCircle, HiX } from "react-icons/hi";
import { useAuth } from "../contexts/AuthContext";
import { useApi } from "../hooks/useApi";

interface UserProfileData {
  id: string;
  full_name: string;
  email: string;
  permissions: number;
}

interface EditProfileFormData {
  full_name?: string;
  email?: string;
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
        } catch (err: any) {
          console.error("Error fetching profile data:", err);
          setError(err.message || "Could not load profile data.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchProfileData();
    } else {
      setIsLoading(false);
      setError("User not authenticated. Please log in.");
    }
  }, [user?.id]);

  useEffect(() => {
    if (profileData && isEditing) {
      setEditFormData({
        full_name: profileData.full_name,
        email: profileData.email,
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
        email: profileData.email,
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
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
      alert("Profile updated successfully!");
    } catch (err: any) {
      console.error("Error saving profile data:", err);
      setError(err.message || "Could not save profile data.");
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleDisplay = (permissions: number | undefined): string => {
    if (permissions === 1) return "Admin";
    if (permissions === 0) return "User";
    return "Unknown";
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
    <div className="p-4 bg-white min-h-screen">
      <div className="max-w-2xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center sm:items-start mb-8 border-b border-gray-200 pb-6">
          <HiUserCircle className="w-24 h-24 md:w-32 md:h-32 text-gray-300 mb-4 sm:mb-0 sm:mr-8" />
          <div className="text-center sm:text-left flex-grow">
            {isEditing ? (
              <input
                type="text"
                name="full_name"
                value={editFormData.full_name || ""}
                onChange={handleInputChange}
                className="text-2xl font-bold text-gray-800 mb-1 w-full border-b border-gray-300 focus:border-indigo-500 focus:outline-none py-1"
                placeholder="Full Name"
              />
            ) : (
              <h1 className="text-2xl font-bold text-gray-800 mb-1">
                {profileData.full_name} {/* Changed from fullName */}
              </h1>
            )}
            {/* Use getRoleDisplay for permissions */}
            <p className="text-sm text-gray-500">
              Role: {getRoleDisplay(profileData.permissions)}
            </p>
          </div>
          {!isEditing ? (
            <button
              onClick={handleEditToggle}
              className="mt-4 sm:mt-0 p-2 text-[#002F41] hover:bg-gray-100 rounded transition duration-150 flex items-center text-sm"
            >
              <HiPencil className="mr-2 h-4 w-4" /> Edit Profile
            </button>
          ) : (
            <div className="mt-4 sm:mt-0 flex space-x-2">
              <button
                onClick={handleSaveChanges}
                disabled={isSaving}
                className="p-2 text-green-600 hover:bg-green-50 rounded transition duration-150 flex items-center text-sm"
              >
                <HiCheck className="mr-1 h-4 w-4" /> Save
              </button>
              <button
                onClick={handleEditToggle}
                className="p-2 text-red-500 hover:bg-red-50 rounded transition duration-150 flex items-center text-sm"
              >
                <HiX className="mr-1 h-4 w-4" /> Cancel
              </button>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              Email Address
            </label>
            {isEditing ? (
              <input
                type="email"
                name="email"
                value={editFormData.email || ""}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="your@email.com"
              />
            ) : (
              <p className="text-base text-gray-900">
                {profileData.email}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              User ID
            </label>
            <p className="text-sm text-gray-600 font-mono">
              {profileData.id}
            </p>
          </div>
        </div>
        {isSaving && (
          <p className="text-sm text-indigo-600 mt-4">Updating profile...</p>
        )}
      </div>
    </div>
  );
};

export default UserProfilePage;
