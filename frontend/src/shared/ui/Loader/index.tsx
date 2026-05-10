type LoaderProps = {
  label?: string;
};

export const Loader = ({ label = 'Loading...' }: LoaderProps) => {
  return (
    <div className="state state-loading">
      <div className="spinner" aria-hidden />
      <p>{label}</p>
    </div>
  );
};
