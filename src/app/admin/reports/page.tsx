'use client'

import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { Layout } from '@/components/Layout'
import { adminApi } from '@/lib/api'
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Download,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  FileText
} from 'lucide-react'

interface AnalyticsData {
  totalApplications: number
  pendingApplications: number
  approvedApplications: number
  rejectedApplications: number
  applicationTrends: { date: string; count: number }[]
  businessTypeBreakdown: { type: string; count: number }[]
  approvalRate: number
  averageProcessingTime: number
  monthlyRevenue: number
}

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState('30d')
  
  const { data: dashboardStats, isLoading: statsLoading } = useQuery(
    'admin-dashboard-stats',
    () => adminApi.getDashboardStats()
  )

  // Mock analytics data - in production, this would come from API
  const analyticsData: AnalyticsData = {
    totalApplications: dashboardStats?.total_applications || 0,
    pendingApplications: dashboardStats?.pending_applications || 0,
    approvedApplications: dashboardStats?.approved_applications || 0,
    rejectedApplications: dashboardStats?.rejected_applications || 0,
    applicationTrends: [
      { date: '2024-01-01', count: 12 },
      { date: '2024-01-08', count: 19 },
      { date: '2024-01-15', count: 15 },
      { date: '2024-01-22', count: 22 },
      { date: '2024-01-29', count: 18 }
    ],
    businessTypeBreakdown: [
      { type: 'Technology', count: 25 },
      { type: 'Manufacturing', count: 18 },
      { type: 'Healthcare', count: 12 },
      { type: 'Finance', count: 8 },
      { type: 'Others', count: 15 }
    ],
    approvalRate: 78.5,
    averageProcessingTime: 3.2,
    monthlyRevenue: 125000
  }

  const exportReport = (format: 'csv' | 'pdf') => {
    // Mock export functionality
    const data = {
      reportType: 'Vendor Onboarding Analytics',
      dateRange,
      generatedAt: new Date().toISOString(),
      ...analyticsData
    }
    
    const filename = `vendor_report_${dateRange}_${new Date().toISOString().split('T')[0]}.${format}`
    
    if (format === 'csv') {
      const csvContent = generateCSVReport(data)
      downloadFile(csvContent, filename, 'text/csv')
    } else {
      // For PDF, would integrate with a PDF library
      alert('PDF export would be implemented with a PDF library like jsPDF')
    }
  }

  const generateCSVReport = (data: any) => {
    const headers = ['Metric', 'Value']
    const rows = [
      ['Total Applications', data.totalApplications],
      ['Pending Applications', data.pendingApplications],
      ['Approved Applications', data.approvedApplications],
      ['Rejected Applications', data.rejectedApplications],
      ['Approval Rate (%)', data.approvalRate],
      ['Average Processing Time (days)', data.averageProcessingTime],
      ['Monthly Revenue (₹)', data.monthlyRevenue]
    ]
    
    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
  }

  if (statsLoading) {
    return (
      <Layout title="Reports & Analytics">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Reports & Analytics">
      <div className="space-y-6">
        {/* Header with Controls */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-1">Vendor onboarding insights and metrics</p>
          </div>
          
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => exportReport('csv')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </button>
              
              <button
                onClick={() => exportReport('pdf')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <FileText className="w-4 h-4 mr-2" />
                Export PDF
              </button>
            </div>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-100">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Applications</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsData.totalApplications}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-yellow-100">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsData.pendingApplications}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approval Rate</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsData.approvalRate}%</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-purple-100">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                <p className="text-2xl font-bold text-gray-900">₹{analyticsData.monthlyRevenue.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Application Trends */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Application Trends</h3>
              <TrendingUp className="h-5 w-5 text-gray-500" />
            </div>
            
            <div className="space-y-3">
              {analyticsData.applicationTrends.map((trend, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {new Date(trend.date).toLocaleDateString()}
                  </span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(trend.count / 25) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{trend.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Business Type Breakdown */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Business Types</h3>
              <BarChart3 className="h-5 w-5 text-gray-500" />
            </div>
            
            <div className="space-y-3">
              {analyticsData.businessTypeBreakdown.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{item.type}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${(item.count / 25) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Processing Metrics */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Processing Metrics</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">
                {analyticsData.approvedApplications}
              </div>
              <p className="text-sm text-gray-600">Approved</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600 mb-1">
                {analyticsData.rejectedApplications}
              </div>
              <p className="text-sm text-gray-600">Rejected</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {analyticsData.averageProcessingTime}
              </div>
              <p className="text-sm text-gray-600">Avg Processing Days</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}