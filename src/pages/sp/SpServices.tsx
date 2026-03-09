import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

interface Service {
  id: number;
  name: string;
  pricingType: "flat" | "hourly" | "per_km";
  price: number;
  duration: number;
}

interface Category {
  id: number;
  icon: string;
  name: string;
  active: boolean;
  services: Service[];
}

const initialCategories: Category[] = [
  {
    id: 1, icon: "🔧", name: "Breakdown Assistance", active: true,
    services: [
      { id: 1, name: "On-Site Diagnostic", pricingType: "flat", price: 65, duration: 30 },
      { id: 2, name: "Emergency Repair", pricingType: "hourly", price: 85, duration: 60 },
      { id: 3, name: "Battery Jump Start", pricingType: "flat", price: 45, duration: 20 },
    ],
  },
  {
    id: 2, icon: "🚗", name: "Towing", active: true,
    services: [
      { id: 4, name: "Local Towing (< 20km)", pricingType: "flat", price: 120, duration: 45 },
      { id: 5, name: "Long Distance Towing", pricingType: "per_km", price: 3, duration: 120 },
    ],
  },
  {
    id: 3, icon: "🔄", name: "Tire Change", active: true,
    services: [
      { id: 6, name: "Single Tire Replacement", pricingType: "flat", price: 55, duration: 25 },
      { id: 7, name: "Full Set Rotation", pricingType: "flat", price: 140, duration: 50 },
    ],
  },
  {
    id: 4, icon: "⚡", name: "Electrical Repair", active: false,
    services: [
      { id: 8, name: "Alternator Check", pricingType: "flat", price: 75, duration: 40 },
      { id: 9, name: "Starter Motor Repair", pricingType: "hourly", price: 90, duration: 90 },
      { id: 10, name: "Wiring Diagnostic", pricingType: "hourly", price: 70, duration: 60 },
      { id: 11, name: "Fuse Replacement", pricingType: "flat", price: 35, duration: 15 },
    ],
  },
  {
    id: 5, icon: "🔒", name: "Locksmith", active: true,
    services: [
      { id: 12, name: "Vehicle Lockout", pricingType: "flat", price: 80, duration: 30 },
    ],
  },
];

const pricingTypes = [
  { value: "flat" as const, label: "Flat Rate" },
  { value: "hourly" as const, label: "Hourly" },
  { value: "per_km" as const, label: "Per km" },
];

const initialCities = ["Paris", "Boulogne-Billancourt", "Saint-Denis", "Montreuil", "Vincennes"];

const SpServices = () => {
  const [categories, setCategories] = useState(initialCategories);
  const [selectedId, setSelectedId] = useState(1);
  const [coverageRadius, setCoverageRadius] = useState([35]);
  const [cities, setCities] = useState(initialCities);
  const [newCity, setNewCity] = useState("");
  const [editingServiceId, setEditingServiceId] = useState<number | null>(null);

  const selected = categories.find((c) => c.id === selectedId)!;

  const toggleCategory = (id: number) => {
    setCategories((prev) => prev.map((c) => c.id === id ? { ...c, active: !c.active } : c));
  };

  const updateService = (serviceId: number, field: keyof Service, value: string | number) => {
    setCategories((prev) =>
      prev.map((c) =>
        c.id === selectedId
          ? { ...c, services: c.services.map((s) => s.id === serviceId ? { ...s, [field]: value } : s) }
          : c
      )
    );
  };

  const deleteService = (serviceId: number) => {
    setCategories((prev) =>
      prev.map((c) =>
        c.id === selectedId
          ? { ...c, services: c.services.filter((s) => s.id !== serviceId) }
          : c
      )
    );
  };

  const addService = () => {
    const newId = Date.now();
    setCategories((prev) =>
      prev.map((c) =>
        c.id === selectedId
          ? { ...c, services: [...c.services, { id: newId, name: "New Service", pricingType: "flat", price: 0, duration: 30 }] }
          : c
      )
    );
    setEditingServiceId(newId);
  };

  const addCity = () => {
    if (newCity.trim() && !cities.includes(newCity.trim())) {
      setCities([...cities, newCity.trim()]);
      setNewCity("");
    }
  };

  const removeCity = (city: string) => setCities(cities.filter((c) => c !== city));

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Services & Pricing</h1>
        <p className="text-sm text-muted-foreground">Configure your service offerings and coverage area</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Panel — Categories */}
        <div className="lg:col-span-4 bg-card rounded-xl shadow-sm border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Service Categories</h3>
            <button className="text-xs px-3 py-1.5 rounded-lg border border-input text-muted-foreground hover:border-accent hover:text-accent transition-colors flex items-center gap-1 font-medium">
              <Plus className="h-3 w-3" />
              Add Category
            </button>
          </div>
          <div className="space-y-1">
            {categories.map((cat) => (
              <div
                key={cat.id}
                onClick={() => setSelectedId(cat.id)}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-colors ${
                  selectedId === cat.id
                    ? "bg-accent/10 border-l-[3px] border-accent"
                    : "hover:bg-muted"
                }`}
              >
                <span className="text-lg">{cat.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm truncate ${selectedId === cat.id ? "font-semibold text-foreground" : "text-foreground"}`}>
                    {cat.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{cat.services.length} service{cat.services.length !== 1 ? "s" : ""}</p>
                </div>
                <Switch
                  checked={cat.active}
                  onCheckedChange={() => toggleCategory(cat.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="scale-75"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel — Service Editor */}
        <div className="lg:col-span-8 space-y-5">
          <div className="bg-card rounded-xl shadow-sm border border-border p-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <span className="text-lg">{selected.icon}</span>
                <h3 className="text-base font-semibold text-foreground">{selected.name}</h3>
              </div>
              <Switch checked={selected.active} onCheckedChange={() => toggleCategory(selected.id)} />
            </div>

            {/* Services */}
            <div className="space-y-3">
              {selected.services.map((service) => (
                <div key={service.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    {editingServiceId === service.id ? (
                      <input
                        autoFocus
                        value={service.name}
                        onChange={(e) => updateService(service.id, "name", e.target.value)}
                        onBlur={() => setEditingServiceId(null)}
                        onKeyDown={(e) => e.key === "Enter" && setEditingServiceId(null)}
                        className="w-full h-8 px-2 rounded border border-input bg-card text-sm text-foreground focus:border-accent outline-none"
                      />
                    ) : (
                      <button
                        onClick={() => setEditingServiceId(service.id)}
                        className="text-sm font-medium text-foreground hover:text-accent transition-colors text-left truncate w-full"
                      >
                        {service.name}
                      </button>
                    )}
                  </div>

                  {/* Pricing type */}
                  <div className="flex bg-muted rounded-lg p-0.5 shrink-0">
                    {pricingTypes.map((pt) => (
                      <button
                        key={pt.value}
                        onClick={() => updateService(service.id, "pricingType", pt.value)}
                        className={`text-[10px] font-medium px-2 py-1 rounded-md transition-colors ${
                          service.pricingType === pt.value
                            ? "bg-card text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {pt.label}
                      </button>
                    ))}
                  </div>

                  {/* Price */}
                  <div className="relative w-20 shrink-0">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">€</span>
                    <input
                      type="number"
                      value={service.price}
                      onChange={(e) => updateService(service.id, "price", Number(e.target.value))}
                      className="w-full h-8 pl-6 pr-2 rounded border border-input bg-card text-sm text-foreground text-right focus:border-accent outline-none"
                    />
                  </div>

                  {/* Duration */}
                  <div className="relative w-20 shrink-0">
                    <input
                      type="number"
                      value={service.duration}
                      onChange={(e) => updateService(service.id, "duration", Number(e.target.value))}
                      className="w-full h-8 pl-2 pr-7 rounded border border-input bg-card text-sm text-foreground focus:border-accent outline-none"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">min</span>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => deleteService(service.id)}
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <button onClick={addService} className="mt-3 text-sm text-accent font-medium hover:underline flex items-center gap-1">
              <Plus className="h-3.5 w-3.5" />
              Add Service
            </button>
          </div>

          {/* Coverage Zone */}
          <div className="bg-card rounded-xl shadow-sm border border-border p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Coverage Zone</h3>

            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-muted-foreground">Coverage Radius</label>
                <span className="text-sm font-semibold text-foreground">{coverageRadius[0]} km</span>
              </div>
              <Slider
                value={coverageRadius}
                onValueChange={setCoverageRadius}
                max={100}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>0 km</span>
                <span>100 km</span>
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Covered Cities</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {cities.map((city) => (
                  <span key={city} className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-full bg-accent/10 text-accent">
                    {city}
                    <button onClick={() => removeCity(city)} className="hover:text-destructive transition-colors">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCity()}
                  placeholder="Add a city..."
                  className="h-9 flex-1 px-3 rounded-lg border border-input bg-card text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none"
                />
                <button onClick={addCity} className="h-9 px-3 rounded-lg border border-input text-sm text-muted-foreground hover:border-accent hover:text-accent transition-colors">
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Save */}
          <div className="flex justify-end">
            <button className="h-10 px-6 rounded-lg bg-accent text-accent-foreground font-medium hover:opacity-90 transition-opacity">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpServices;