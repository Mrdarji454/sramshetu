import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "../../components/ui/Card";
import { SectionHeading } from "../../components/ui/SectionHeading";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import {
  Zap,
  Droplets,
  Hammer,
  Wrench,
  Flame,
  Truck,
  Paintbrush,
  Tractor,
  Clock,
  ShieldCheck,
  Users,
  ArrowRight,
  CheckCircle2,
  X,
} from "lucide-react";
import { SERVICE_CATEGORIES } from "../../data/mockData";
import { BookingWizardModal } from "../bookings/BookingWizardModal";

const iconMap = {
  Zap,
  Droplets,
  Hammer,
  Wrench,
  Flame,
  Truck,
  Paintbrush,
  Tractor,
};

export function ServicesSection() {
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [bookingModalService, setBookingModalService] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const filterTabs = [
    "All",
    "Home & Site",
    "Technical",
    "Civil & Infra",
    "Industrial",
    "Rural & Agro",
  ];

  const filteredServices =
    selectedFilter === "All"
      ? SERVICE_CATEGORIES
      : SERVICE_CATEGORIES.filter((s) => s.categoryGroup === selectedFilter);

  const handleOpenBooking = (service) => {
    setBookingModalService(service);
    setBookingSuccess(false);
  };

  const handleConfirmMockBooking = (e) => {
    e.preventDefault();
    setBookingSuccess(true);
    setTimeout(() => {
      setTimeout(() => {
        setBookingModalService(null);
        setBookingSuccess(false);
      }, 1800);
    }, 400);
  };

  return (
    <section id="services" className="py-16 sm:py-24 bg-slate-50/60 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          badgeText="Verified Trade Registry"
          badgeVariant="gov"
          title="Essential Skilled Services with"
          titleAccent="Transparent Floor Rates"
          description="Every trade adheres to statutory minimum floor wages determined jointly by state cooperative federations and skill councils. No price gouging or exploitative undercutting."
        />

        {/* Interactive Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {filterTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedFilter(tab)}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
                selectedFilter === tab
                  ? "bg-brand-navy-900 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Service Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredServices.map((service) => {
            const IconComponent = iconMap[service.icon] || Wrench;
            return (
              <Card
                key={service.id}
                hoverEffect
                className="flex flex-col h-full bg-white group"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 rounded-xl bg-brand-navy-50 text-brand-navy-900 group-hover:bg-brand-saffron-50 group-hover:text-brand-saffron-600 transition-colors flex items-center justify-center border border-slate-200/60">
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <Badge variant="saffron" size="sm">
                      {service.badge}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-brand-navy-900 group-hover:text-brand-saffron-700 transition-colors">
                      {service.name}
                    </h3>
                    <p className="text-xs font-semibold text-slate-400 mt-0.5 font-sans">
                      {service.hindiName}
                    </p>
                  </div>
                </CardHeader>

                <CardContent className="py-0 flex-1">
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 mb-4">
                    {service.description}
                  </p>

                  {/* Floor Wage Box */}
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 mb-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">
                        Cooperative Floor Rate
                      </span>
                      <span className="font-extrabold text-brand-navy-900">
                        {service.floorRate}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                      <span>Full Day (8 hrs standard)</span>
                      <span className="font-semibold text-slate-700">
                        {service.dailyRate}
                      </span>
                    </div>
                  </div>

                  {/* Guild & Worker Count Metrics */}
                  <div className="space-y-1.5 text-[11px] text-slate-500">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>Available Guild Artisans</span>
                      </span>
                      <span className="font-semibold text-slate-800">
                        {service.verifiedWorkers.toLocaleString()}+
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Average Dispatch Time</span>
                      </span>
                      <span className="font-semibold text-emerald-700">
                        {service.typicalResponseTime}
                      </span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="pt-4 mt-4 border-t border-slate-100">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-between group/btn hover:border-brand-saffron-500 hover:text-brand-saffron-700"
                    iconRight={ArrowRight}
                    onClick={() => handleOpenBooking(service)}
                  >
                    <span>Request Service</span>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Bottom Banner on Floor Wage Guarantee */}
        <div className="mt-12 p-4 sm:p-5 rounded-xl bg-amber-50/80 border border-amber-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-800 flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-amber-950 text-sm block">
                Statutory Floor Wage Guarantee
              </span>
              <p className="text-amber-800 mt-0.5">
                All rates on ShramSetu strictly prevent cut-throat wage
                undercutting, safeguarding worker livelihoods while guaranteeing
                fair, transparent quotes to clients.
              </p>
            </div>
          </div>
          <a
            href="#how-it-works"
            className="flex-shrink-0 font-bold text-amber-900 hover:underline inline-flex items-center gap-1"
          >
            <span>Learn How Escrow Works</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Complete ShramSetu Booking Wizard Modal */}
      {bookingModalService && (
        <BookingWizardModal
          isOpen={Boolean(bookingModalService)}
          onClose={() => setBookingModalService(null)}
          initialService={bookingModalService}
        />
      )}
    </section>
  );
}
