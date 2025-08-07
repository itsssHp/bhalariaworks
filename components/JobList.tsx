'use client'

import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, getDocs } from 'firebase/firestore'
import { format } from 'date-fns'

export default function JobList() {
  const [jobs, setJobs] = useState<any[]>([])

  useEffect(() => {
    const fetchJobs = async () => {
      const snapshot = await getDocs(collection(db, 'jobs'))
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setJobs(data)
    }

    fetchJobs()
  }, [])

  if (jobs.length === 0) {
    return <p className="text-gray-500 text-sm">No job postings found.</p>
  }

  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <div key={job.id} className="border border-blue-200 rounded-md bg-blue-50 p-4 shadow-sm">
          <h3 className="text-lg font-semibold text-blue-700">{job.title}</h3>
          <p className="text-sm text-gray-600 mb-1">📌 {job.department} — {job.location}</p>
          <p className="text-sm text-gray-800 mb-1">{job.description}</p>
          <p className="text-xs text-gray-500">
            Posted by <span className="font-medium text-gray-700">{job.postedBy}</span> on{' '}
            {job.createdAt?.toDate ? format(job.createdAt.toDate(), 'PPP') : 'N/A'}
          </p>
        </div>
      ))}
    </div>
  )
}
