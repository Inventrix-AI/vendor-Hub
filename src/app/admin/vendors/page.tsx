"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { Layout } from "@/components/Layout";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { Users, Search, Key, Power, PowerOff, ShieldAlert } from "lucide-react";
import Cookies from "js-cookie";

interface Vendor {
  id: number;
  email: string;
  full_name: string;
  phone: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
}

export default function VendorManagement() {
  const { loading: authLoading, isAuthorized } = useAuthGuard({
    requiredRole: ["admin", "super_admin"],
  });

  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [passwordResetData, setPasswordResetData] = useState({
    admin_password: "",
    new_password: "",
    confirm_password: "",
  });

  // Fetch all vendor users
  const { data: vendorsData, isLoading } = useQuery<{ vendors: Vendor[] }>(
    ["admin-vendors", statusFilter, searchTerm],
    async () => {
      const token = Cookies.get("access_token");
      const response = await fetch("/api/admin/vendors", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch vendors");
      const data = await response.json();

      // Client-side filtering
      let vendors = data.vendors || [];

      // Filter by status
      if (statusFilter === "active") {
        vendors = vendors.filter((v: Vendor) => v.is_active);
      } else if (statusFilter === "inactive") {
        vendors = vendors.filter((v: Vendor) => !v.is_active);
      }

      // Filter by search term
      if (searchTerm) {
        vendors = vendors.filter((v: Vendor) =>
          v.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          v.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      return { vendors };
    },
    {
      enabled: isAuthorized && !authLoading,
      keepPreviousData: true,
    }
  );

  // Password reset mutation
  const resetPasswordMutation = useMutation(
    async ({ id, adminPassword, newPassword }: { id: number; adminPassword: string; newPassword: string }) => {
      const token = Cookies.get("access_token");
      const response = await fetch(`/api/admin/vendors/${id}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          admin_password: adminPassword,
          new_password: newPassword
        }),
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
        setSelectedVendor(null);
        setPasswordResetData({ admin_password: "", new_password: "", confirm_password: "" });
        alert("Vendor password reset successfully");
      },
      onError: (error: Error) => {
        alert(error.message);
      },
    }
  );

  // Toggle vendor active status
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
        throw new Error(error.error || "Failed to update vendor status");
      }
      return response.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries("admin-vendors");
      },
      onError: (error: Error) => {
        alert(error.message);
      },
    }
  );

  const openPasswordResetModal = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setPasswordResetData({ admin_password: "", new_password: "", confirm_password: "" });
    setShowPasswordResetModal(true);
  };

  const handlePasswordResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendor) return;

    if (!passwordResetData.admin_password) {
      alert("Please enter your admin password for verification");
      return;
    }

    if (passwordResetData.new_password.length < 6) {
      alert("New password must be at least 6 characters long");
      return;
    }

    if (passwordResetData.new_password !== passwordResetData.confirm_password) {
      alert("Passwords do not match");
      return;
    }

    resetPasswordMutation.mutate({
      id: selectedVendor.id,
      adminPassword: passwordResetData.admin_password,
      newPassword: passwordResetData.new_password,
    });
  };

  if (authLoading || !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  const vendors = vendorsData?.vendors || [];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="h-8 w-8" />
                Vendor Management
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Manage vendor accounts and reset passwords securely
              </p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>

        {/* Vendors Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="spinner mx-auto" />
            </div>
          ) : vendors.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No vendors found
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
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {vendors.map((vendor) => (
                    <tr key={vendor.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {vendor.full_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{vendor.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {vendor.phone || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            vendor.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {vendor.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(vendor.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openPasswordResetModal(vendor)}
                            className="text-yellow-600 hover:text-yellow-900"
                            title="Reset vendor password"
                          >
                            <Key className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() =>
                              toggleActiveMutation.mutate({
                                id: vendor.id,
                                is_active: !vendor.is_active,
                              })
                            }
                            className={
                              vendor.is_active
                                ? "text-red-600 hover:text-red-900"
                                : "text-green-600 hover:text-green-900"
                            }
                            title={vendor.is_active ? "Deactivate" : "Activate"}
                          >
                            {vendor.is_active ? (
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

      {/* Password Reset Modal with Admin Verification */}
      {showPasswordResetModal && selectedVendor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert className="h-6 w-6 text-yellow-600" />
              <h2 className="text-2xl font-bold">Reset Vendor Password</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Resetting password for <strong>{selectedVendor.full_name}</strong> ({selectedVendor.email})
            </p>
            <form onSubmit={handlePasswordResetSubmit}>
              <div className="space-y-4">
                {/* Admin Password Verification */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Admin Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordResetData.admin_password}
                    onChange={(e) =>
                      setPasswordResetData({ ...passwordResetData, admin_password: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500"
                    placeholder="Enter your password to verify"
                  />
                  <p className="mt-1 text-xs text-yellow-700">
                    🔒 Verify your identity before resetting vendor password
                  </p>
                </div>

                {/* New Vendor Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Vendor Password *
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

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password *
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
                  {resetPasswordMutation.isLoading ? "Resetting..." : "Reset Vendor Password"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordResetModal(false);
                    setSelectedVendor(null);
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
