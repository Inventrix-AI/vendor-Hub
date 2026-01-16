'use client';

import React, { useState } from 'react';
import { Download, Loader2, FileCheck, AlertCircle, CreditCard } from 'lucide-react';
import { toast } from 'react-toastify';

interface IDCardDownloadButtonProps {
  applicationId: string;
  certificateId?: number;
  vendorId?: string;
  status: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Legacy interface for backward compatibility
interface CertificateDownloadButtonProps extends IDCardDownloadButtonProps {}

export function IDCardDownloadButton({
  applicationId,
  certificateId,
  vendorId,
  status,
  variant = 'primary',
  size = 'md',
  className = ''
}: IDCardDownloadButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [localCertificateId, setLocalCertificateId] = useState<number | undefined>(certificateId);

  const isApproved = status.toLowerCase() === 'approved';

  // Generate ID card record if not exists
  const generateIDCard = async (): Promise<number | null> => {
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
        throw new Error(data.error || 'Failed to generate ID card');
      }

      setLocalCertificateId(data.certificate.id);
      return data.certificate.id;
    } catch (error) {
      console.error('ID card generation error:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  // Download ID card
  const downloadIDCard = async (certId: number) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/certificates/${certId}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to download ID card');
      }

      // Create blob from response
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `IDCard-${vendorId || applicationId}.png`;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('ID Card downloaded successfully!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to download ID card');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClick = async () => {
    if (!isApproved) {
      toast.warning('ID Card can only be downloaded for approved applications');
      return;
    }

    try {
      let certId = localCertificateId;

      // Generate ID card record if not exists
      if (!certId) {
        certId = await generateIDCard();
        if (!certId) {
          toast.error('Failed to generate ID card');
          return;
        }
      }

      // Download the ID card
      await downloadIDCard(certId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    }
  };

  // Size styles
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  // Variant styles
  const variantStyles = {
    primary: isApproved
      ? 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
      : 'bg-gray-300 text-gray-500 cursor-not-allowed',
    secondary: isApproved
      ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
      : 'bg-gray-300 text-gray-500 cursor-not-allowed',
    outline: isApproved
      ? 'border-2 border-green-600 text-green-600 hover:bg-green-50 focus:ring-green-500'
      : 'border-2 border-gray-300 text-gray-400 cursor-not-allowed',
  };

  const isProcessing = isLoading || isGenerating;

  return (
    <button
      onClick={handleClick}
      disabled={!isApproved || isProcessing}
      className={`
        inline-flex items-center justify-center
        font-medium rounded-lg
        focus:outline-none focus:ring-2 focus:ring-offset-2
        transition-colors duration-200
        disabled:opacity-50
        ${sizeStyles[size]}
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {isProcessing ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          {isGenerating ? 'Generating...' : 'Downloading...'}
        </>
      ) : isApproved ? (
        <>
          <CreditCard className="w-4 h-4 mr-2" />
          Download ID Card
        </>
      ) : (
        <>
          <AlertCircle className="w-4 h-4 mr-2" />
          Not Available
        </>
      )}
    </button>
  );
}

// Legacy export for backward compatibility
export function CertificateDownloadButton(props: CertificateDownloadButtonProps) {
  return <IDCardDownloadButton {...props} />;
}

// ID Card status badge component
export function IDCardStatusBadge({
  status,
  validUntil
}: {
  status: string;
  validUntil?: Date | string;
}) {
  const isExpired = validUntil ? new Date(validUntil) < new Date() : false;
  const displayStatus = isExpired ? 'expired' : status;

  const statusStyles: Record<string, string> = {
    active: 'bg-green-100 text-green-800 border-green-200',
    expired: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    revoked: 'bg-red-100 text-red-800 border-red-200',
  };

  const statusIcons: Record<string, React.ReactNode> = {
    active: <FileCheck className="w-3 h-3" />,
    expired: <AlertCircle className="w-3 h-3" />,
    revoked: <AlertCircle className="w-3 h-3" />,
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1 px-2 py-1 text-xs font-medium
        rounded-full border
        ${statusStyles[displayStatus] || statusStyles.active}
      `}
    >
      {statusIcons[displayStatus]}
      {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
    </span>
  );
}

// Legacy export for backward compatibility
export function CertificateStatusBadge(props: { status: string; validUntil?: Date | string }) {
  return <IDCardStatusBadge {...props} />;
}
