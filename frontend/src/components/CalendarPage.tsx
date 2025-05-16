import { useEffect, useState } from "react";
import { HiPlus } from "react-icons/hi";
import { useAuth } from "../contexts/AuthContext"; // Added useAuth
import Modal from "./Modal"; // Adjust path if necessary

// Backend response models (simplified for frontend context)
interface BackendDailyAvailability {
  date: string; // YYYY-MM-DD
  status: string; // e.g., "Office", "Remote", "Off"
  day_of_week: number;
}

interface BackendTask {
  id: string;
  title: string;
  description: string;
  timestamp: number; // Unix timestamp for creation date
  status: string | null;
  // Add other relevant fields like project_name if needed for display
}

interface BackendUserCalendarResponse {
  user_id: string;
  user_name: string;
  year: number;
  month: number;
  availability: BackendDailyAvailability[];
  tasks: BackendTask[];
}

interface CalendarEvent {
  id: string;
  title: string;
  date: string; // ISO string for fullcalendar or YYYY-MM-DD for list view
  type:
    | "Meeting"
    | "Deadline"
    | "Reminder"
    | "Holiday"
    | "Task"
    | "Office"
    | "Remote"
    | "Off"
    | "OtherEvent"; // Expanded types
  description?: string;
  originalType?: string; // To store original status from availability if needed
}

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
    case "Task":
      return "bg-purple-500";
    case "Office":
      return "bg-indigo-500";
    case "Remote":
      return "bg-teal-500";
    case "Off":
      return "bg-gray-400";
    default:
      return "bg-gray-500";
  }
};

const CalendarPage = () => {
  const { user, isLoadingAuth } = useAuth(); // Get current user
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDisplayDate, setCurrentDisplayDate] = useState(new Date()); // For month/year navigation

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

  // Fetch calendar data (tasks and availability)
  useEffect(() => {
    if (isLoadingAuth || !user?.id) return; // Wait for auth and user ID

    const fetchCalendarData = async () => {
      setIsLoading(true);
      setError(null);
      const year = currentDisplayDate.getFullYear();
      const month = currentDisplayDate.getMonth() + 1; // Backend expects 1-indexed month

      try {
        const response = await fetch(
          `/calendar/${user.id}?year=${year}&month=${month}`
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: BackendUserCalendarResponse = await response.json();

        const fetchedEvents: CalendarEvent[] = [];

        // Transform availability data
        data.availability.forEach((avail) => {
          let eventType: CalendarEvent["type"] = "OtherEvent";
          if (avail.status === "Office") eventType = "Office";
          else if (avail.status === "Remote") eventType = "Remote";
          else if (avail.status === "Off") eventType = "Off";
          // else if (avail.status === "Holiday") eventType = "Holiday"; // if backend sends Holiday status

          // Only add if it's a recognized status to avoid cluttering with default "Remote"
          if (eventType !== "OtherEvent" && eventType !== "Remote") {
            fetchedEvents.push({
              id: `avail-${avail.date}-${user.id}`,
              title: `${avail.status} Day`,
              date: avail.date, // YYYY-MM-DD format
              type: eventType,
              originalType: avail.status,
            });
          }
        });

        // Transform task data
        data.tasks.forEach((task) => {
          fetchedEvents.push({
            id: `task-${task.id}`,
            title: task.title,
            // Use task.timestamp (creation) as the date for now.
            // Ideally, tasks would have a due_date for calendar display.
            date: new Date(task.timestamp * 1000).toISOString().split("T")[0], // Convert to YYYY-MM-DD
            type: "Task",
            description: task.description,
          });
        });

        setEvents(
          fetchedEvents.sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          )
        );
      } catch (e: any) {
        console.error("Failed to fetch calendar data:", e);
        setError(e.message || "Failed to load calendar data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCalendarData();
  }, [user?.id, isLoadingAuth, currentDisplayDate]);

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
