'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { toast } from 'react-toastify'
import { Layout } from '@/components/Layout'
import { vendorApi } from '@/lib/api'
import { Building2, MapPin, Send } from 'lucide-react'
import { VendorApplicationCreate } from '@/types'

const schema = yup.object({
  business_name: yup.string().required('Shop name is required'),
  business_type: yup.string().required('Business type is required'),
  address: yup.string().required('Address is required'),
  city: yup.string().required('City is required'),
  state: yup.string().required('State is required'),
  postal_code: yup.string().required('Postal code is required'),
})

const businessTypes = [
  'Street Food Vendor',
  'Fruit & Vegetable Seller', 
  'Clothing & Accessories',
  'Electronics & Mobile Accessories',
  'Household Items',
  'Handicrafts & Art',
  'Books & Stationery',
  'Other'
]


export default function VendorApplicationPage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VendorApplicationCreate>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      state: 'Madhya Pradesh'
    }
  })

  const onSubmit = async (data: VendorApplicationCreate) => {
    try {
      setLoading(true)
      // Add default values for the simplified form
      const applicationData = {
        ...data,
        company_name: data.business_name,
        phone: '', // Will be added later
        contact_email: '', // Will be generated or added later
        business_description: '',
        country: 'India'
      }
      
      const application = await vendorApi.createApplication(applicationData)
      toast.success('Application submitted successfully!')
      router.push(`/vendor/application/${application.application_id}`)
    } catch (error) {
      console.error('Failed to submit application:', error)
      toast.error('Failed to submit application. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout title="Submit Vendor Application">
      <div className="max-w-3xl mx-auto">
        <div className="card">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Business Information */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Building2 className="h-5 w-5 text-primary-600" />
                <h3 className="text-lg font-medium text-gray-900">Business Information</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label htmlFor="business_name" className="block text-sm font-medium text-gray-700">
                    Shop Name *
                  </label>
                  <input
                    {...register('business_name')}
                    type="text"
                    id="business_name"
                    className="input-field mt-1"
                    placeholder="Enter your shop/business name"
                  />
                  {errors.business_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.business_name.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="business_type" className="block text-sm font-medium text-gray-700">
                    Business Type *
                  </label>
                  <select
                    {...register('business_type')}
                    id="business_type"
                    className="input-field mt-1"
                  >
                    <option value="">Select business type</option>
                    {businessTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  {errors.business_type && (
                    <p className="mt-1 text-sm text-red-600">{errors.business_type.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <MapPin className="h-5 w-5 text-primary-600" />
                <h3 className="text-lg font-medium text-gray-900">Address Information</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Street Address *
                  </label>
                  <textarea
                    {...register('address')}
                    id="address"
                    rows={3}
                    className="input-field mt-1"
                    placeholder="Enter complete address"
                  />
                  {errors.address && (
                    <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                    City *
                  </label>
                  <input
                    {...register('city')}
                    type="text"
                    id="city"
                    className="input-field mt-1"
                    placeholder="City"
                  />
                  {errors.city && (
                    <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                    State *
                  </label>
                  <input
                    {...register('state')}
                    type="text"
                    id="state"
                    value="Madhya Pradesh"
                    className="input-field mt-1 bg-gray-50"
                    readOnly
                  />
                  {errors.state && (
                    <p className="mt-1 text-sm text-red-600">{errors.state.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700">
                    Postal Code *
                  </label>
                  <input
                    {...register('postal_code')}
                    type="text"
                    id="postal_code"
                    className="input-field mt-1"
                    placeholder="Enter 6-digit pincode"
                    maxLength={6}
                  />
                  {errors.postal_code && (
                    <p className="mt-1 text-sm text-red-600">{errors.postal_code.message}</p>
                  )}
                </div>
              </div>
            </div>


            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center space-x-2"
              >
                {loading ? (
                  <div className="spinner" />
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Submit Application</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  )
}