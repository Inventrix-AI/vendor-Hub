'use client';

import React, { useState, useEffect } from 'react';
import { Download, Loader2, FileCheck, AlertCircle, Award } from 'lucide-react';
import { toast } from 'react-toastify';

interface Certificate {
  id: number;
  certificate_number: string;
  certificate_type: string;
  vendor_id: string;
  issued_at: string;
  valid_until: string;
  status: string;
}

interface MultipleCertificatesDownloadProps {
  applicationId: string;
  vendorId?: string;
  status: string;
  className?: string;
}

// Certificate type display names
const getCertificateTypeName = (type: string): string => {
  const names: Record<string, string> = {
    'mp': 'MP Certificate',
    'mahila_ekta': 'Mahila Ekta Certificate',
    'bhopal': 'Bhopal Certificate',
    'jabalpur': 'Jabalpur Certificate',
    'gwalior': 'Gwalior Certificate',
    'indore': 'Indore Certificate',
    'mandsour': 'Mandsour Certificate',
    'rewa': 'Rewa Certificate',
    'ujjain': 'Ujjain Certificate',
  };
  return names[type] || type;
};

export function MultipleCertificatesDownload({
  applicationId,
  vendorId,
  status,
  className = ''
}: MultipleCertificatesDownloadProps) {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isApproved = status.toLowerCase() === 'approved';

  // Fetch certificates on mount
  useEffect(() => {
    if (isApproved) {
      fetchCertificates();
    } else {
      setIsLoading(false);
    }
  }, [applicationId, isApproved]);

  const fetchCertificates = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/certificates/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ applicationId }),
      });

      const data = await response.json();

      if (response.ok && data.certificates) {
        setCertificates(data.certificates);
      }
    } catch (error) {
      console.error('Error fetching certificates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateCertificates = async () => {
    try {
      setIsGenerating(true);
      const response = await fetch('/api/certificates/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ applicationId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate certificates');
      }

      setCertificates(data.certificates);
      toast.success(data.message || 'Certificates generated successfully!');
    } catch (error) {
      console.error('Certificate generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate certificates');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadCertificate = async (cert: Certificate) => {
    try {
      setDownloadingId(cert.id);
      const response = await fetch(`/api/certificates/${cert.id}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to download certificate');
      }

      // Create blob from response
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const certType = cert.certificate_type || 'mp';
      const certTypeLabel = certType === 'mp' ? 'MP' :
                           certType === 'mahila_ekta' ? 'MahilaEkta' :
                           certType.charAt(0).toUpperCase() + certType.slice(1);
      a.download = `${certTypeLabel}-Certificate-${vendorId || applicationId}.pdf`;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`${getCertificateTypeName(cert.certificate_type)} downloaded successfully!`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to download certificate');
    } finally {
      setDownloadingId(null);
    }
  };

  if (!isApproved) {
    return (
      <div className={`card bg-gray-50 border-gray-200 ${className}`}>
        <div className="flex items-center space-x-3 text-gray-500">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm">Certificates available after application approval</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`card ${className}`}>
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
          <span className="ml-2 text-sm text-gray-600">Loading certificates...</span>
        </div>
      </div>
    );
  }

  if (certificates.length === 0) {
    return (
      <div className={`card ${className}`}>
        <div className="text-center py-4">
          <Award className="mx-auto h-12 w-12 text-gray-400 mb-3" />
          <p className="text-sm text-gray-600 mb-4">No certificates generated yet</p>
          <button
            onClick={generateCertificates}
            disabled={isGenerating}
            className="btn-primary inline-flex items-center"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Award className="w-4 h-4 mr-2" />
                Generate Certificates
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`card ${className}`}>
      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
        <Award className="h-5 w-5 mr-2 text-green-600" />
        Your Certificates
      </h3>
      <div className="space-y-3">
        {certificates.map((cert) => (
          <div
            key={cert.id}
            className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-green-300 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {getCertificateTypeName(cert.certificate_type)}
                </p>
                <p className="text-xs text-gray-500">
                  {cert.certificate_number}
                </p>
              </div>
            </div>
            <button
              onClick={() => downloadCertificate(cert)}
              disabled={downloadingId === cert.id}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
            >
              {downloadingId === cert.id ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
