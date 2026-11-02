
interface ErrorMessageProps {
  message?: string;
}

export default function ErrorMessage({
  message = "Unable to load data. Please check your backend connection.",
}: ErrorMessageProps) {
  return (
    <div className="error-message">
      <strong>Something went wrong</strong>
      <p>{message}</p>
    </div>
  );
}
