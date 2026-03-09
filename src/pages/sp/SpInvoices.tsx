import { useState } from "react";
import { format } from "date-fns";
import {
  Search,
  Download,
  FileDown,
  Send,
  CalendarIcon,
  DollarSign,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import EmptyState from "@/components/EmptyState";

type InvoiceStatus = "paid" | "pending" | "overdue";

interface Invoice {
  id: string;
  client: string;
  jobs: number;
  amount: number;
  issued: string;
  due: string;
  status: InvoiceStatus;
}

const invoices: Invoice[] = [
  { id: "INV-2026-0089", client: "Metro Fleet Solutions", jobs: 5, amount: 2840, issued: "Feb 28, 2026", due: "Mar 15, 2026", status: "pending" },
  { id: "INV-2026-0088", client: "GreenHaul Logistics", jobs: 3, amount: 1560, issued: "Feb 25, 2026", due: "Mar 10, 2026", status: "paid" },
  { id: "INV-2026-0087", client: "CityDrive Fleet", jobs: 7, amount: 4120, issued: "Feb 20, 2026", due: "Mar 5, 2026", status: "paid" },
  { id: "INV-2026-0086", client: "TransEurope Carriers", jobs: 2, amount: 980, issued: "Feb 15, 2026", due: "Feb 28, 2026", status: "overdue" },
  { id: "INV-2026-0085", client: "Metro Fleet Solutions", jobs: 4, amount: 3200, issued: "Feb 10, 2026", due: "Feb 25, 2026", status: "paid" },
  { id: "INV-2026-0084", client: "GreenHaul Logistics", jobs: 6, amount: 3640, issued: "Feb 5, 2026", due: "Feb 20, 2026", status: "paid" },
  { id: "INV-2026-0083", client: "CityDrive Fleet", jobs: 1, amount: 660, issued: "Jan 30, 2026", due: "Feb 14, 2026", status: "overdue" },
  { id: "INV-2026-0082", client: "TransEurope Carriers", jobs: 8, amount: 4980, issued: "Jan 25, 2026", due: "Feb 10, 2026", status: "paid" },
  { id: "INV-2026-0081", client: "Metro Fleet Solutions", jobs: 3, amount: 1360, issued: "Jan 20, 2026", due: "Feb 5, 2026", status: "pending" },
  { id: "INV-2026-0080", client: "GreenHaul Logistics", jobs: 2, amount: 840, issued: "Jan 15, 2026", due: "Jan 30, 2026", status: "paid" },
];

const statusStyles: Record<InvoiceStatus, { dot: string; bg: string; text: string }> = {
  paid: { dot: "bg-success", bg: "bg-success/10", text: "text-success" },
  pending: { dot: "bg-accent", bg: "bg-accent/10", text: "text-accent" },
  overdue: { dot: "bg-destructive", bg: "bg-destructive/10", text: "text-destructive" },
};

const summaryCards = [
  { title: "Paid", amount: "$18,340", color: "text-success", bg: "bg-success/10", icon: DollarSign },
  { title: "Pending", amount: "$4,200", color: "text-accent", bg: "bg-accent/10", icon: DollarSign },
  { title: "Overdue", amount: "$1,640", color: "text-destructive", bg: "bg-destructive/10", icon: DollarSign },
];

const SpInvoices = () => {
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();

  const filtered = invoices.filter((inv) => {
    const matchSearch = inv.id.toLowerCase().includes(search.toLowerCase()) || inv.client.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Top */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">Invoices</h1>
          <span className="bg-accent/15 text-accent text-xs font-semibold px-2.5 py-1 rounded-full">Total: $24,180</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoices..."
              className="h-9 pl-9 pr-4 rounded-lg border border-input bg-card text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none w-52"
            />
          </div>
          <DatePicker label="From" date={dateFrom} onChange={setDateFrom} />
          <DatePicker label="To" date={dateTo} onChange={setDateTo} />
          <button className="h-9 px-4 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {summaryCards.map((card) => (
          <div key={card.title} className="bg-card rounded-xl shadow-sm border border-border p-5 flex items-center gap-4">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${card.bg}`}>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{card.title}</p>
              <p className={`text-xl font-bold ${card.color}`}>{card.amount}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState title="No invoices found" description="Try adjusting your search or date range" actionLabel="Clear filters" onAction={() => setSearch("")} />
      ) : (
        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {["Invoice #", "Client", "Jobs", "Amount", "Issued", "Due Date", "Status", "Actions"].map((h) => (
                    <th key={h} className="text-left text-xs font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv) => (
                  <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-primary">{inv.id}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{inv.client}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{inv.jobs}</td>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">${inv.amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">{inv.issued}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">{inv.due}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full capitalize ${statusStyles[inv.status].bg} ${statusStyles[inv.status].text}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${statusStyles[inv.status].dot}`} />
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" title="Download PDF">
                          <FileDown className="h-4 w-4" />
                        </button>
                        {inv.status !== "paid" && (
                          <button className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-accent/10 hover:text-accent transition-colors" title="Send Reminder">
                            <Send className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const DatePicker = ({ label, date, onChange }: { label: string; date?: Date; onChange: (d?: Date) => void }) => (
  <Popover>
    <PopoverTrigger asChild>
      <button className={cn("h-9 px-3 rounded-lg border border-input bg-card text-sm flex items-center gap-2", date ? "text-foreground" : "text-muted-foreground")}>
        <CalendarIcon className="h-3.5 w-3.5" />
        {date ? format(date, "MMM d, yyyy") : label}
      </button>
    </PopoverTrigger>
    <PopoverContent className="w-auto p-0" align="start">
      <Calendar mode="single" selected={date} onSelect={onChange} initialFocus className={cn("p-3 pointer-events-auto")} />
    </PopoverContent>
  </Popover>
);

export default SpInvoices;