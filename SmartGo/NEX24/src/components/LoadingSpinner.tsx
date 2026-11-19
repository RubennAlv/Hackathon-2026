export default function LoadingSpinner({ label = "Cargando" }: { label?: string }) {
  return (
    <div className="route-loader" role="status" aria-live="polite">
      <div className="route-loader-mark">
        <div className="loading-spinner">
          {Array.from({ length: 10 }, (_, index) => <span key={index} />)}
        </div>
      </div>
      <p>{label}</p>
    </div>
  );
}
