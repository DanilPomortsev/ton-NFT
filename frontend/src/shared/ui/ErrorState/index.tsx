import { Button } from '@/shared/ui/Button';

type ErrorStateProps = {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
};

export const ErrorState = ({ title, description, action }: ErrorStateProps) => {
  return (
    <div className="state state-error">
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      {action ? (
        <Button type="button" onClick={action.onClick}>
          {action.label}
        </Button>
      ) : null}
    </div>
  );
};
