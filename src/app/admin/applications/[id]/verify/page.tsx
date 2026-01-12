'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function VerifyRedirectPage() {
  const router = useRouter()
  const params = useParams()
  const applicationId = params.id as string

  useEffect(() => {
    // Redirect to the first step (personal verification)
    router.replace(`/admin/applications/${applicationId}/verify/personal`)
  }, [applicationId, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  )
}
