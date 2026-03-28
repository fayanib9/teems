type PageHeaderProps = {
  title: string
  description?: string
  actions?: React.ReactNode
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">{title}</h1>
        {description && <p className="text-sm text-text-secondary mt-1">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 w-full sm:w-auto [&>*]:flex-1 sm:[&>*]:flex-initial">{actions}</div>}
    </div>
  )
}
