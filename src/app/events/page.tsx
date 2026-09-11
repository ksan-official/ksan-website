import { EventsExperience } from "@/components/EventsExperience";
import { ksanEvents } from "@/lib/events";

export default function EventsPage() {
  return <EventsExperience initialEvents={ksanEvents} />;
}
