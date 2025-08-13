'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { toast } from 'react-toastify'
import { Layout } from '@/components/Layout'
import { vendorApi } from '@/lib/api'
import { Building2, MapPin, CreditCard, Send } from 'lucide-react'
import { VendorApplicationCreate } from '@/types'

const schema = yup.object({
  business_name: yup.string().required('Business name is required'),
  business_type: yup.string().required('Business type is required'),
  registration_number: yup.string(),
  tax_id: yup.string(),
  address: yup.string().required('Address is required'),
  city: yup.string().required('City is required'),
  state: yup.string().required('State is required'),
  postal_code: yup.string().required('Postal code is required'),
  country: yup.string().required('Country is required'),
  bank_name: yup.string(),
  account_number: yup.string(),
  routing_number: yup.string(),
})

const businessTypes = [
  'Sole Proprietorship',
  'Partnership',
  'Private Limited Company',
  'Public Limited Company',
  'Limited Liability Partnership',
  'One Person Company',
  'Other'
]

const countries = [
  'India',
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Singapore',
  'Other'
]

const indianStates = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim',
  'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
  'West Bengal', 'Delhi', 'Chandigarh', 'Puducherry'
]

export default function VendorApplicationPage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<VendorApplicationCreate>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      country: 'India'
    }
  })

  const selectedCountry = watch('country')

  const onSubmit = async (data: VendorApplicationCreate) => {
    try {
      setLoading(true)
      const application = await vendorApi.createApplication(data)
      toast.success('Application submitted successfully!')
      router.push(`/vendor/application/${application.application_id}`)
    } catch (error) {
      console.error('Failed to submit application:', error)
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
                    Business Name *
                  </label>
                  <input
                    {...register('business_name')}
                    type="text"
                    id="business_name"
                    className="input-field mt-1"
                    placeholder="Enter your business name"
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

                <div>
                  <label htmlFor="registration_number" className="block text-sm font-medium text-gray-700">
                    Registration Number
                  </label>
                  <input
                    {...register('registration_number')}
                    type="text"
                    id="registration_number"
                    className="input-field mt-1"
                    placeholder="Business registration number"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="tax_id" className="block text-sm font-medium text-gray-700">
                    Tax ID / GST Number
                  </label>
                  <input
                    {...register('tax_id')}
                    type="text"
                    id="tax_id"
                    className="input-field mt-1"
                    placeholder="Tax identification number"
                  />
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
                    State/Province *
                  </label>
                  {selectedCountry === 'India' ? (
                    <select
                      {...register('state')}
                      id="state"
                      className="input-field mt-1"
                    >
                      <option value="">Select state</option>
                      {indianStates.map((state) => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      {...register('state')}
                      type="text"
                      id="state"
                      className="input-field mt-1"
                      placeholder="State/Province"
                    />
                  )}
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
                    placeholder="Postal code"
                  />
                  {errors.postal_code && (
                    <p className="mt-1 text-sm text-red-600">{errors.postal_code.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                    Country *
                  </label>
                  <select
                    {...register('country')}
                    id="country"
                    className="input-field mt-1"
                  >
                    {countries.map((country) => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                  {errors.country && (
                    <p className="mt-1 text-sm text-red-600">{errors.country.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Banking Information */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <CreditCard className="h-5 w-5 text-primary-600" />
                <h3 className="text-lg font-medium text-gray-900">Banking Information (Optional)</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label htmlFor="bank_name" className="block text-sm font-medium text-gray-700">
                    Bank Name
                  </label>
                  <input
                    {...register('bank_name')}
                    type="text"
                    id="bank_name"
                    className="input-field mt-1"
                    placeholder="Bank name"
                  />
                </div>

                <div>
                  <label htmlFor="account_number" className="block text-sm font-medium text-gray-700">
                    Account Number
                  </label>
                  <input
                    {...register('account_number')}
                    type="text"
                    id="account_number"
                    className="input-field mt-1"
                    placeholder="Bank account number"
                  />
                </div>

                <div>
                  <label htmlFor="routing_number" className="block text-sm font-medium text-gray-700">
                    IFSC Code / Routing Number
                  </label>
                  <input
                    {...register('routing_number')}
                    type="text"
                    id="routing_number"
                    className="input-field mt-1"
                    placeholder="IFSC code or routing number"
                  />
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