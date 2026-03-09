import { CheckCircle2, Clock, MapPin, Users, Tag, MessageCircle } from "lucide-react";

const steps = [
  { label: "Account Created", done: true },
  { label: "Add Technicians", done: true },
  { label: "Set Services & Pricing", done: true },
  { label: "Awaiting Admin Approval", done: false, current: true },
];

const SpOnboarding = () => {
  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-start justify-center py-8 animate-fade-in">
      <div className="w-full max-w-[680px] space-y-6">

        {/* Progress Stepper */}
        <div className="bg-card rounded-xl shadow-sm border border-border p-6">
          <div className="flex items-center justify-between">
            {steps.map((step, i) => (
              <div key={i} className="flex items-center flex-1 last:flex-initial">
                <div className="flex flex-col items-center text-center">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                    step.done
                      ? "bg-success text-success-foreground"
                      : step.current
                        ? "bg-accent/15 border-2 border-accent"
                        : "bg-muted"
                  }`}>
                    {step.done ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : step.current ? (
                      <span className="h-2.5 w-2.5 rounded-full bg-accent animate-pulse" />
                    ) : (
                      <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
                    )}
                  </div>
                  <p className={`text-[10px] mt-2 max-w-[80px] leading-tight ${
                    step.done ? "text-success font-medium" : step.current ? "text-accent font-semibold" : "text-muted-foreground"
                  }`}>
                    {step.label}
                  </p>
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 mt-[-1.25rem] ${
                    step.done ? "bg-success" : "bg-border"
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Status Card */}
        <div className="bg-card rounded-xl shadow-md border border-border border-l-4 border-l-accent p-6">
          <div className="flex items-start gap-3 mb-3">
            <div className="h-10 w-10 rounded-xl bg-accent/15 flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Your application is under review</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Submitted on Feb 26, 2026 · Est. review time: 24–48h
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            Our admin team is currently reviewing your service provider application.
            You'll receive an email notification once your account has been approved.
            Once approved, you'll be able to receive intervention requests from fleet
            managers in your coverage area.
          </p>
          <a href="#" className="inline-flex items-center gap-1.5 text-sm text-accent font-medium hover:underline">
            <MessageCircle className="h-4 w-4" />
            Contact Support
          </a>
        </div>

        {/* Submission Summary */}
        <div className="bg-card rounded-xl shadow-sm border border-border p-6 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">What you submitted</h3>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">3 Technicians added</p>
              <p className="text-xs text-muted-foreground">Jean Dupont, Marie Laurent, Pierre Martin</p>
            </div>
            <div className="flex -space-x-2">
              {["JD", "ML", "PM"].map((init, i) => (
                <div key={i} className="h-7 w-7 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center border-2 border-card">
                  {init}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
            <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center">
              <Tag className="h-4 w-4 text-accent" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">4 Service categories configured</p>
              <p className="text-xs text-muted-foreground">Breakdown Assistance, Towing, Tire Change, Locksmith</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
            <div className="h-9 w-9 rounded-lg bg-success/10 flex items-center justify-center">
              <MapPin className="h-4 w-4 text-success" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Coverage zone: Paris + suburbs</p>
              <p className="text-xs text-muted-foreground">35 km radius · 5 cities covered</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpOnboarding;