import { getSession } from '@/lib/auth'
import { ToolsClient } from './tools-client'

export default async function ToolsPage() {
  const session = await getSession()
  if (!session) return null

  return <ToolsClient />
}
