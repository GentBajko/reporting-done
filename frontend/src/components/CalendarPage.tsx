import { useState } from "react";
import { HiPlus } from "react-icons/hi";
import Modal from "./Modal"; // Adjust path if necessary

interface CalendarEvent {
  id: string;
  title: string;
  date: string; // ISO string or a Date object, manage accordingly
  type: "Meeting" | "Deadline" | "Reminder" | "Holiday";
  description?: string;
}

const mockEventsData: CalendarEvent[] = [
  {
    id: "evt-1",
    title: "Team Sync Meeting",
    date: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString(), // 2 days from now
    type: "Meeting",
    description: "Discuss weekly progress and blockers.",
  },
  {
    id: "evt-2",
    title: "Project Alpha Deadline",
    date: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString(), // 1 week from now
    type: "Deadline",
  },
  {
    id: "evt-3",
    title: "Client Call - Project Beta",
    date: new Date(new Date().setDate(new Date().getDate() + 3)).toISOString(), // 3 days from now
    type: "Meeting",
    description: "Feedback session with Client Y.",
  },
  {
    id: "evt-4",
    title: "Submit Q3 Report",
    date: new Date(new Date().setDate(new Date().getDate() + 10)).toISOString(), // 10 days from now
    type: "Reminder",
  },
];

const getEventTypeClass = (type: CalendarEvent["type"]) => {
  switch (type) {
    case "Meeting":
      return "bg-blue-500";
    case "Deadline":
      return "bg-red-500";
    case "Reminder":
      return "bg-yellow-500";
    case "Holiday":
      return "bg-green-500";
    default:
      return "bg-gray-500";
  }
};

const CalendarPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>(mockEventsData);

  // Form state for new event
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventDescription, setNewEventDescription] = useState("");
  const [newEventType, setNewEventType] =
    useState<CalendarEvent["type"]>("Meeting");

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    setNewEventTitle("");
    setNewEventDate("");
    setNewEventDescription("");
    setNewEventType("Meeting");
  };

  const handleAddEvent = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const newEvent: CalendarEvent = {
      id: String(Date.now()),
      title: newEventTitle,
      date: new Date(newEventDate).toISOString(), // Ensure date is stored consistently
      type: newEventType,
      description: newEventDescription,
    };
    setEvents(
      [newEvent, ...events].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      )
    );
    closeModal();
    alert("Event created! (mock)");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        {/* Title is in the header, so we might not need it here or it could be more specific */}
        <button
          onClick={openModal}
          className="bg-[#002F41] hover:bg-[#004057] text-white font-semibold py-2 px-4 rounded inline-flex items-center transition duration-150"
        >
          <HiPlus className="mr-2 h-5 w-5" />
          Add Event
        </button>
      </div>

      {/* Placeholder for a full calendar view component */}
      <div className="bg-white shadow-md rounded-lg p-6 min-h-[400px] flex items-center justify-center text-gray-400">
        <p className="text-lg">Full Calendar View Component (Placeholder)</p>
      </div>

      {/* List view of upcoming events for now */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-700">Upcoming Events</h2>
        {events.length === 0 ? (
          <div className="bg-white shadow-md rounded-lg p-6 text-center text-gray-500">
            <p>No events scheduled. Add some!</p>
          </div>
        ) : (
          <ul className="bg-white shadow-md rounded-lg divide-y divide-gray-200">
            {events.map((eventItem) => (
              <li
                key={eventItem.id}
                className="p-4 hover:bg-gray-50 flex items-start space-x-3"
              >
                <div
                  className={`mt-1 w-3 h-3 rounded-full ${getEventTypeClass(
                    eventItem.type
                  )} flex-shrink-0`}
                ></div>
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-800">
                      {eventItem.title}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {new Date(eventItem.date).toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">{eventItem.type}</p>
                  {eventItem.description && (
                    <p className="text-xs text-gray-500 mt-1">
                      {eventItem.description}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title="Add New Event">
        <form onSubmit={handleAddEvent} className="space-y-4">
          <div>
            <label
              htmlFor="eventTitle"
              className="block text-sm font-medium text-gray-700"
            >
              Event Title
            </label>
            <input
              type="text"
              name="eventTitle"
              id="eventTitle"
              value={newEventTitle}
              onChange={(e) => setNewEventTitle(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white text-gray-900"
            />
          </div>
          <div>
            <label
              htmlFor="eventDate"
              className="block text-sm font-medium text-gray-700"
            >
              Date
            </label>
            <input
              type="date"
              name="eventDate"
              id="eventDate"
              value={newEventDate}
              onChange={(e) => setNewEventDate(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white text-gray-900"
            />
          </div>
          <div>
            <label
              htmlFor="eventType"
              className="block text-sm font-medium text-gray-700"
            >
              Type
            </label>
            <select
              name="eventType"
              id="eventType"
              value={newEventType}
              onChange={(e) =>
                setNewEventType(e.target.value as CalendarEvent["type"])
              }
              className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
            >
              <option value="Meeting">Meeting</option>
              <option value="Deadline">Deadline</option>
              <option value="Reminder">Reminder</option>
              <option value="Holiday">Holiday</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="eventDescription"
              className="block text-sm font-medium text-gray-700"
            >
              Description (Optional)
            </label>
            <textarea
              name="eventDescription"
              id="eventDescription"
              value={newEventDescription}
              onChange={(e) => setNewEventDescription(e.target.value)}
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white text-gray-900"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition duration-150"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-[#002F41] hover:bg-[#004057] rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#002F41] transition duration-150"
            >
              Add Event
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CalendarPage;
