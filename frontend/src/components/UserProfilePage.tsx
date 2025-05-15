import React, { useEffect, useState } from "react";
import { HiCheck, HiPencil, HiUserCircle, HiX } from "react-icons/hi";
import { useAuth } from "../contexts/AuthContext"; // Assuming AuthContext provides current user info

// Mock User Data Structure (align with backend User model as much as possible)
interface UserProfileData {
  id: string;
  fullName: string;
  email: string;
  role: "Admin" | "User"; // Simplified from permissions integer
  // We might add projects/tasks counts here later if needed
}

const UserProfilePage = () => {
  const { currentUser, isAdmin } = useAuth(); // Assuming currentUser is available from AuthContext
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<UserProfileData>>(
    {}
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock current user ID (replace with actual ID from AuthContext or props)
  // const viewingUserId = currentUser?.id || 'usr-mock-self'; // Example if currentUser has id
  // For now, let's assume we are always viewing the logged-in user's profile

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    // Simulate fetching profile data for the current user
    // In a real app, you might fetch this based on currentUser.id
    // or if an admin is viewing, a different user ID.
    setTimeout(() => {
      if (currentUser) {
        // currentUser would come from useAuth()
        setProfileData({
          id: currentUser.id || "usr-mock-id", // Use actual ID if available
          fullName:
            currentUser.fullName ||
            (isAdmin ? "Administrator Name" : "Current User Name"),
          email:
            currentUser.email ||
            (isAdmin ? "admin@example.com" : "user@example.com"),
          role: isAdmin ? "Admin" : "User",
        });
      } else {
        // Fallback mock if currentUser is not yet populated or for testing
        setProfileData({
          id: "usr-mock-fallback",
          fullName: "Fallback User",
          email: "fallback@example.com",
          role: "User",
        });
        // setError('Could not load user profile. Please log in again.');
      }
      setIsLoading(false);
    }, 800);
  }, [currentUser, isAdmin]);

  useEffect(() => {
    if (profileData) {
      setEditFormData({
        fullName: profileData.fullName,
        email: profileData.email,
        // Role editing might be restricted to admins on a different page or via specific logic
      });
    }
  }, [profileData, isEditing]);

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveChanges = async () => {
    if (!profileData) return;
    setIsLoading(true);
    setError(null);
    console.log("Saving profile data:", editFormData);
    // TODO: Implement actual API call to PUT /user/{profileData.id}
    // with { full_name: editFormData.fullName, email: editFormData.email, ...permissions if applicable }
    // Ensure to send only changed fields or what UserCreateModel expects.
    setTimeout(() => {
      setProfileData((prev) => (prev ? { ...prev, ...editFormData } : null));
      setIsLoading(false);
      setIsEditing(false);
      alert("Profile updated successfully! (mock)");
    }, 1200);
  };

  if (isLoading && !profileData) {
    return <div className="text-center p-10">Loading profile...</div>;
  }

  if (error) {
    return (
      <div className="text-center p-10 text-red-600 bg-red-100 rounded-md">
        Error: {error}
      </div>
    );
  }

  if (!profileData) {
    return <div className="text-center p-10">User profile not found.</div>;
  }

  return (
    <div className="container mx-auto max-w-2xl p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="bg-white shadow-xl rounded-lg p-6 md:p-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start mb-8">
          <HiUserCircle className="w-24 h-24 md:w-32 md:h-32 text-gray-400 mb-4 sm:mb-0 sm:mr-8" />
          <div className="text-center sm:text-left flex-grow">
            {isEditing ? (
              <input
                type="text"
                name="fullName"
                value={editFormData.fullName || ""}
                onChange={handleInputChange}
                className="text-3xl font-bold text-gray-800 mb-1 w-full border-b-2 border-indigo-500 focus:outline-none py-1"
                placeholder="Full Name"
              />
            ) : (
              <h1 className="text-3xl font-bold text-gray-800 mb-1">
                {profileData.fullName}
              </h1>
            )}
            <p className="text-md text-gray-600">Role: {profileData.role}</p>
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
                disabled={isLoading}
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

          {/* Placeholder for future sections like Projects, Tasks, Activity etc. */}
          {/* Example:
          <div className="pt-4 mt-6 border-t border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Activity</h2>
            <p className="text-gray-600">User's recent projects and tasks will be listed here.</p>
          </div>
          */}
        </div>
        {isLoading && isEditing && (
          <p className="text-sm text-indigo-600 mt-4">Updating profile...</p>
        )}
      </div>
    </div>
  );
};

export default UserProfilePage;
