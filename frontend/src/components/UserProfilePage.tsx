import React, { useEffect, useState } from "react";
import { HiCheck, HiPencil, HiUserCircle, HiX } from "react-icons/hi";
import { useAuth } from "../contexts/AuthContext";

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
  const { user, isAdmin, token } = useAuth();
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
          const response = await fetch(`/user/${user.id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          });
          if (!response.ok) {
            const errData = await response
              .json()
              .catch(() => ({ detail: `Error: ${response.status}` }));
            throw new Error(errData.detail || `Failed to fetch profile data`);
          }
          const data: UserProfileData = await response.json();
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
  }, [user?.id, token]);

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
      const response = await fetch(`/user/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(changedData),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ detail: "Update failed. Unknown error." }));
        throw new Error(
          errorData.detail || `HTTP error! Status: ${response.status}`
        );
      }
      const updatedProfile: UserProfileData = await response.json();
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
    <div className="container mx-auto max-w-2xl p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="bg-white shadow-xl rounded-lg p-6 md:p-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start mb-8">
          <HiUserCircle className="w-24 h-24 md:w-32 md:h-32 text-gray-400 mb-4 sm:mb-0 sm:mr-8" />
          <div className="text-center sm:text-left flex-grow">
            {isEditing ? (
              <input
                type="text"
                name="full_name"
                value={editFormData.full_name || ""}
                onChange={handleInputChange}
                className="text-3xl font-bold text-gray-800 mb-1 w-full border-b-2 border-indigo-500 focus:outline-none py-1"
                placeholder="Full Name"
              />
            ) : (
              <h1 className="text-3xl font-bold text-gray-800 mb-1">
                {profileData.full_name} {/* Changed from fullName */}
              </h1>
            )}
            {/* Use getRoleDisplay for permissions */}
            <p className="text-md text-gray-600">
              Role: {getRoleDisplay(profileData.permissions)}
            </p>
          </div>
          {!isEditing ? (
            <button
              onClick={handleEditToggle}
              className="mt-4 sm:mt-0 p-2 text-[#002F41] hover:text-[#004057] rounded-md hover:bg-gray-100 transition duration-150 flex items-center"
            >
              <HiPencil className="mr-2 h-5 w-5" /> Edit Profile
            </button>
          ) : (
            <div className="mt-4 sm:mt-0 flex space-x-2">
              <button
                onClick={handleSaveChanges}
                disabled={isSaving}
                className="p-2 text-green-600 hover:text-green-700 rounded-md hover:bg-green-100 transition duration-150 flex items-center"
              >
                <HiCheck className="mr-1 h-5 w-5" /> Save
              </button>
              <button
                onClick={handleEditToggle}
                className="p-2 text-red-500 hover:text-red-700 rounded-md hover:bg-red-100 transition duration-150 flex items-center"
              >
                <HiX className="mr-1 h-5 w-5" /> Cancel
              </button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            {isEditing ? (
              <input
                type="email"
                name="email"
                value={editFormData.email || ""}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="your@email.com"
              />
            ) : (
              <p className="mt-1 text-md text-gray-900 bg-gray-50 p-3 rounded-md">
                {profileData.email}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              User ID
            </label>
            <p className="mt-1 text-md text-gray-700 bg-gray-50 p-3 rounded-md">
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
