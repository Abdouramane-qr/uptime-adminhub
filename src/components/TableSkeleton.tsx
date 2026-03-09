const TableSkeleton = ({ columns = 7, rows = 5 }: { columns?: number; rows?: number }) => {
  return (
    <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="px-4 py-3">
                  <div className="h-3 w-20 rounded skeleton-shimmer" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, ri) => (
              <tr key={ri} className="border-b border-border last:border-0">
                {Array.from({ length: columns }).map((_, ci) => (
                  <td key={ci} className="px-4 py-3">
                    <div className={`h-4 rounded skeleton-shimmer ${ci === 0 ? "w-24" : ci === columns - 1 ? "w-16" : "w-32"}`} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableSkeleton;