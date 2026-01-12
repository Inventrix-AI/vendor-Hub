'use client';

import React from 'react';
import { useQuery } from 'react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Building2,
  MapPin,
  Calendar,
  ArrowLeft,
  Shield
} from 'lucide-react';

interface CertificateVerification {
  valid: boolean;
  status: string;
  message: string;
  certificate: {
    certificate_number: string;
    vendor_id: string;
    vendor_name: string;
    business_name: string;
    business_type: string;
    city: string;
    state: string;
    issued_at: string;
    valid_until: string;
  };
  revoked_at?: string;
}

export default function CertificateVerificationPage() {
  const params = useParams();
  const certificateNumber = params.id as string;

  const { data, isLoading, error } = useQuery<CertificateVerification>(
    ['verify-certificate', certificateNumber],
    async () => {
      const response = await fetch(`/api/certificates/verify/${certificateNumber}`);
      return response.json();
    },
    { enabled: !!certificateNumber }
  );

  const getStatusIcon = () => {
    if (!data) return null;

    if (data.valid) {
      return <CheckCircle className="h-16 w-16 text-green-500" />;
    } else if (data.status === 'expired') {
      return <AlertTriangle className="h-16 w-16 text-yellow-500" />;
    } else {
      return <XCircle className="h-16 w-16 text-red-500" />;
    }
  };

  const getStatusColor = () => {
    if (!data) return 'bg-gray-50 border-gray-200';

    if (data.valid) {
      return 'bg-green-50 border-green-200';
    } else if (data.status === 'expired') {
      return 'bg-yellow-50 border-yellow-200';
    } else {
      return 'bg-red-50 border-red-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-lg font-bold text-gray-900">PVESMP</h1>
                <p className="text-xs text-gray-500">Certificate Verification</p>
              </div>
            </div>
            <Link
              href="/"
              className="flex items-center text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12">
        {isLoading ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Verifying certificate...</p>
          </div>
        ) : error || !data ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto" />
            <h2 className="mt-4 text-xl font-bold text-gray-900">Verification Failed</h2>
            <p className="mt-2 text-gray-600">
              Unable to verify the certificate. Please check the certificate number and try again.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Status Card */}
            <div className={`rounded-xl shadow-lg p-8 border-2 ${getStatusColor()}`}>
              <div className="text-center">
                {getStatusIcon()}
                <h2 className="mt-4 text-2xl font-bold text-gray-900">
                  {data.valid ? 'Certificate Valid' : 'Certificate Invalid'}
                </h2>
                <p className="mt-2 text-gray-600">{data.message}</p>
              </div>
            </div>

            {/* Certificate Details */}
            {data.certificate && (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                  <h3 className="text-lg font-semibold text-white">Certificate Details</h3>
                </div>

                <div className="p-6 space-y-6">
                  {/* Certificate Number */}
                  <div className="text-center pb-4 border-b border-gray-200">
                    <p className="text-sm text-gray-500">Certificate Number</p>
                    <p className="text-xl font-mono font-bold text-gray-900">
                      {data.certificate.certificate_number}
                    </p>
                  </div>

                  {/* Vendor Details */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <Building2 className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">Vendor Name</p>
                          <p className="font-medium text-gray-900">
                            {data.certificate.vendor_name}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <Building2 className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">Business Name</p>
                          <p className="font-medium text-gray-900">
                            {data.certificate.business_name}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">Location</p>
                          <p className="font-medium text-gray-900">
                            {data.certificate.city}, {data.certificate.state}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-500">Vendor ID</p>
                        <p className="font-mono font-medium text-gray-900">
                          {data.certificate.vendor_id}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500">Business Type</p>
                        <p className="font-medium text-gray-900">
                          {data.certificate.business_type}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Validity Dates */}
                  <div className="pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-start space-x-3">
                        <Calendar className="h-5 w-5 text-green-500 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">Issue Date</p>
                          <p className="font-medium text-gray-900">
                            {formatDate(data.certificate.issued_at)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <Calendar className={`h-5 w-5 mt-0.5 ${data.valid ? 'text-blue-500' : 'text-red-500'}`} />
                        <div>
                          <p className="text-sm text-gray-500">Valid Until</p>
                          <p className={`font-medium ${data.valid ? 'text-gray-900' : 'text-red-600'}`}>
                            {formatDate(data.certificate.valid_until)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Revocation Notice */}
                  {data.status === 'revoked' && data.revoked_at && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700">
                        <strong>Revoked on:</strong> {formatDate(data.revoked_at)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Footer Note */}
            <div className="text-center text-sm text-gray-500">
              <p>
                This verification was performed on {new Date().toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
              <p className="mt-1">
                For any queries, please contact the Street Vendors Association office.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-sm text-gray-500">
          <p>Pathari Visthapit Evam Sahayata Manch Parivar</p>
          <p className="mt-1">Street Vendors Association</p>
        </div>
      </footer>
    </div>
  );
}
