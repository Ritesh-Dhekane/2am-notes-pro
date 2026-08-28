import { useParams } from 'react-router-dom'

export default function Subject() {
  const { subjectId } = useParams()

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">{subjectId}</h1>
      <p className="mt-2 text-sm text-gray-500">Subject content placeholder</p>
    </div>
  )
}
