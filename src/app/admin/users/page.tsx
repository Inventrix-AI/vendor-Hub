"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { Layout } from "@/components/Layout";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { Users, UserPlus, Edit, Power, PowerOff, Shield, User, Key } from "lucide-react";
import Cookies from "js-cookie";

interface User {
  id: number;
  email: string;
  full_name: string;
  phone: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
}

export default function UsersManagement() {
  const { loading: authLoading, isAuthorized } = useAuthGuard({
    requiredRole: ["super_admin"],
  });

  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    phone: "",
    role: "admin"
  });
  const [editFormData, setEditFormData] = useState({
    role: "",
    full_name: "",
    phone: "",
  });
  const [passwordResetData, setPasswordResetData] = useState({
    new_password: "",
    confirm_password: "",
  });

  // Fetch users
  const { data: usersData, isLoading } = useQuery<{ users: User[] }>(
    "admin-users",
    async () => {
      const token = Cookies.get("access_token");
      const response = await fetch("/api/admin/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    },
    {
      enabled: isAuthorized && !authLoading,
    }
  );

  // Create user mutation
  const createMutation = useMutation(
    async (data: typeof formData) => {
      const token = Cookies.get("access_token");
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create user");
      }
      return response.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries("admin-users");
        setShowCreateModal(false);
        setFormData({
          email: "",
          password: "",
          full_name: "",
          phone: "",
          role: "admin"
        });
        alert("User created successfully");
      },
      onError: (error: Error) => {
        alert(error.message);
      },
    }
  );

  // Update user mutation
  const updateMutation = useMutation(
    async ({ id, data }: { id: number; data: typeof editFormData }) => {
      const token = Cookies.get("access_token");
      const response = await fetch(`/api/admin/users/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update user");
      }
      return response.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries("admin-users");
        setShowEditModal(false);
        setSelectedUser(null);
        alert("User updated successfully");
      },
      onError: (error: Error) => {
        alert(error.message);
      },
    }
  );

  // Toggle active status mutation
  const toggleActiveMutation = useMutation(
    async ({ id, is_active }: { id: number; is_active: boolean }) => {
      const token = Cookies.get("access_token");
      const response = await fetch(`/api/admin/users/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_active }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update user status");
      }
      return response.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries("admin-users");
      },
      onError: (error: Error) => {
        alert(error.message);
      },
    }
  );

  // Password reset mutation
  const resetPasswordMutation = useMutation(
    async ({ id, password }: { id: number; password: string }) => {
      const token = Cookies.get("access_token");
      const response = await fetch(`/api/admin/users/${id}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ new_password: password }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to reset password");
      }
      return response.json();
    },
    {
      onSuccess: () => {
        setShowPasswordResetModal(false);
        setSelectedUser(null);
        setPasswordResetData({ new_password: "", confirm_password: "" });
        alert("Password reset successfully");
      },
      onError: (error: Error) => {
        alert(error.message);
      },
    }
  );

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "super_admin":
        return "bg-red-100 text-red-800";
      case "admin":
        return "bg-purple-100 text-purple-800";
      case "vendor":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "super_admin":
        return <Shield className="h-4 w-4" />;
      case "admin":
        return <Shield className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.full_name) {
      alert("Please fill in all required fields");
      return;
    }
    createMutation.mutate(formData);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    updateMutation.mutate({ id: selectedUser.id, data: editFormData });
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setEditFormData({
      role: user.role,
      full_name: user.full_name,
      phone: user.phone || "",
    });
    setShowEditModal(true);
  };

  const openPasswordResetModal = (user: User) => {
    setSelectedUser(user);
    setPasswordResetData({ new_password: "", confirm_password: "" });
    setShowPasswordResetModal(true);
  };

  const handlePasswordResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (passwordResetData.new_password.length < 6) {
      alert("Password must be at least 6 characters long");
      return;
    }

    if (passwordResetData.new_password !== passwordResetData.confirm_password) {
      alert("Passwords do not match");
      return;
    }

    resetPasswordMutation.mutate({
      id: selectedUser.id,
      password: passwordResetData.new_password,
    });
  };

  if (authLoading || !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  const users = usersData?.users || [];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="h-8 w-8" />
                User Management
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Create and manage admin users
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <UserPlus className="h-5 w-5" />
              Create User
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="spinner mx-auto" />
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No users found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {user.full_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {user.phone || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(
                            user.role
                          )}`}
                        >
                          {getRoleIcon(user.role)}
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {user.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(user)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Edit user"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => openPasswordResetModal(user)}
                            className="text-yellow-600 hover:text-yellow-900"
                            title="Reset password"
                          >
                            <Key className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() =>
                              toggleActiveMutation.mutate({
                                id: user.id,
                                is_active: !user.is_active,
                              })
                            }
                            className={
                              user.is_active
                                ? "text-red-600 hover:text-red-900"
                                : "text-green-600 hover:text-green-900"
                            }
                            title={user.is_active ? "Deactivate" : "Activate"}
                          >
                            {user.is_active ? (
                              <PowerOff className="h-5 w-5" />
                            ) : (
                              <Power className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Create New User</h2>
            <form onSubmit={handleCreateSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) =>
                      setFormData({ ...formData, full_name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Minimum 6 characters
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex gap-2">
                <button
                  type="submit"
                  disabled={createMutation.isLoading}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {createMutation.isLoading ? "Creating..." : "Create User"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Edit User</h2>
            <form onSubmit={handleEditSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={editFormData.full_name}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, full_name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={editFormData.phone}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={editFormData.role}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, role: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex gap-2">
                <button
                  type="submit"
                  disabled={updateMutation.isLoading}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {updateMutation.isLoading ? "Updating..." : "Update User"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedUser(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordResetModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Reset Password</h2>
            <p className="text-sm text-gray-600 mb-4">
              Reset password for <strong>{selectedUser.full_name}</strong> ({selectedUser.email})
            </p>
            <form onSubmit={handlePasswordResetSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={passwordResetData.new_password}
                    onChange={(e) =>
                      setPasswordResetData({ ...passwordResetData, new_password: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Minimum 6 characters
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={passwordResetData.confirm_password}
                    onChange={(e) =>
                      setPasswordResetData({ ...passwordResetData, confirm_password: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="mt-6 flex gap-2">
                <button
                  type="submit"
                  disabled={resetPasswordMutation.isLoading}
                  className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
                >
                  {resetPasswordMutation.isLoading ? "Resetting..." : "Reset Password"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordResetModal(false);
                    setSelectedUser(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
