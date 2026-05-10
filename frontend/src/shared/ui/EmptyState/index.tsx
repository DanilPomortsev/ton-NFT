type EmptyStateProps = {
  title: string;
  description?: string;
};

export const EmptyState = ({ title, description }: EmptyStateProps) => {
  return (
    <div className="state">
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
    </div>
  );
};
