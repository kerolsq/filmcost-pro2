interface PageHeaderProps {
  title: string;
  eyebrow?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, eyebrow, action }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-xs font-bold uppercase tracking-wide text-accent">{eyebrow}</p>
        ) : null}
        <h1 className="mt-1 text-2xl font-bold leading-tight text-ink sm:text-3xl">{title}</h1>
      </div>
      {action ? <div className="w-full shrink-0 sm:w-auto">{action}</div> : null}
    </header>
  );
}
