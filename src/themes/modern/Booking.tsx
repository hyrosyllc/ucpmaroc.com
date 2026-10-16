import React from "react";
import { BookingWidget } from "@/features/booking/BookingWidget";
import { SectionHeading } from "./components/SectionHeading";

const Booking: React.FC<any> = ({ data = {}, isPreview, portfolioId }) => {
  if (!portfolioId) return null;
  return (
    <section className="py-16 md:py-24 px-6">
      <SectionHeading title={data.title} subtitle={data.subtitle} />
      <BookingWidget portfolioId={portfolioId} isPreview={isPreview} serviceId={data.serviceId || null} />
    </section>
  );
};

export default Booking;
