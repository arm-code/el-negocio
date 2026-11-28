import { PageHeader } from '@/components/admin/page-header'
import { NotificationsCard } from '@/components/notifications/notifications-card'

export default function AvisosPage() {
  return (
    <div className="max-w-xl space-y-6">
      <PageHeader title="Avisos" description="Se activan en cada celular o computadora donde quieras recibirlos." />
      <NotificationsCard />
    </div>
  )
}
