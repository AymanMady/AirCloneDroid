"use client";

export default function PageTitle({
  icon,
  iconBg = "bg-plum-plate",
  title,
  subtitle,
  actions,
}: {
  icon: string; // pe-7s-* class
  iconBg?: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="app-page-title">
      <div className="page-title-wrapper">
        <div className="page-title-heading">
          <div className="page-title-icon">
            <i className={`${icon} icon-gradient ${iconBg}`} />
          </div>
          <div>
            {title}
            {subtitle && <div className="page-title-subheading">{subtitle}</div>}
          </div>
        </div>
        {actions && <div className="page-title-actions">{actions}</div>}
      </div>
    </div>
  );
}
