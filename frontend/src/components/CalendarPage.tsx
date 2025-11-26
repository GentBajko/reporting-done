import { useCallback, useEffect, useState } from "react";
import {
  HiChevronLeft,
  HiChevronRight
} from "react-icons/hi";
import { useApi } from "../hooks/useApi";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import Modal from "./Modal";
import FloatingActionButton from "./common/FloatingActionButton";
import { ToastContainer } from "./common/Toast";

interface BackendDailyAvailability {
  date: string;
  status: string;
  day_of_week: number;
}

interface BackendTask {
  id: string;
  title: string;
  description: string;
  timestamp: number;
  status: string | null;
}

interface BackendEvent {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  event_type: string;
  event_date: number;
  start_time: string | null;
  end_time: string | null;
  created_at: number;
}

interface ViewableUser {
  id: string;
  full_name: string;
  email: string;
  can_edit: boolean;
}

interface BackendEventsResponse {
  items: BackendEvent[];
  total: number;
  page: number;
  per_page: number;
  has_next: boolean;
  has_prev: boolean;
}

interface BackendUserCalendarResponse {
  user_id: string;
  user_name: string;
  year: number;
  month: number;
  availability: BackendDailyAvailability[];
  tasks: BackendTask[];
  can_edit: boolean;
}

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type:
    | "Meeting"
    | "Deadline"
    | "Reminder"
    | "Holiday"
    | "Task"
    | "Office"
    | "Remote"
    | "Off"
    | "OtherEvent";
  description?: string;
  originalType?: string;
  startTime?: string;
  endTime?: string;
}

interface CalendarDay {
  date: Date;
  dateKey: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  events: CalendarEvent[];
}

const daysOfWeekHeaders = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const getEventTypeColor = (type: CalendarEvent["type"]) => {
  switch (type) {
    case "Meeting":
      return "bg-blue-500 text-white";
    case "Deadline":
      return "bg-red-500 text-white";
    case "Reminder":
      return "bg-amber-500 text-white";
    case "Holiday":
      return "bg-emerald-500 text-white";
    case "Task":
      return "bg-purple-500 text-white";
    case "Office":
      return "bg-indigo-500 text-white";
    case "Remote":
      return "bg-teal-500 text-white";
    case "Off":
      return "bg-gray-400 text-white";
    default:
      return "bg-gray-500 text-white";
  }
};

const getEventTypeDot = (type: CalendarEvent["type"]) => {
  switch (type) {
    case "Meeting":
      return "bg-blue-500";
    case "Deadline":
      return "bg-red-500";
    case "Reminder":
      return "bg-amber-500";
    case "Holiday":
      return "bg-emerald-500";
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
  const { user, isLoadingAuth } = useAuth();
  const { request } = useApi();
  const { toasts, addToast, removeToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDisplayDate, setCurrentDisplayDate] = useState(new Date());
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  
  const [viewableUsers, setViewableUsers] = useState<ViewableUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [canEditCalendar, setCanEditCalendar] = useState(true);

  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventDescription, setNewEventDescription] = useState("");
  const [newEventType, setNewEventType] =
    useState<CalendarEvent["type"]>("Meeting");
  const [newEventStartTime, setNewEventStartTime] = useState("");
  const [newEventEndTime, setNewEventEndTime] = useState("");

  const openModal = (presetDate?: string) => {
    if (presetDate) {
      setNewEventDate(presetDate);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setNewEventTitle("");
    setNewEventDate("");
    setNewEventDescription("");
    setNewEventType("Meeting");
    setNewEventStartTime("");
    setNewEventEndTime("");
  };

  useEffect(() => {
    if (isLoadingAuth || !user?.id) return;
    
    const fetchViewableUsers = async () => {
      try {
        const users = await request<ViewableUser[]>("/calendar/viewable-users");
        setViewableUsers(users);
        setSelectedUserId((current) => current || user.id);
      } catch (e: unknown) {
        console.error("Failed to fetch viewable users:", e);
      }
    };
    
    fetchViewableUsers();
  }, [user?.id, isLoadingAuth, request]);

  useEffect(() => {
    if (isLoadingAuth || !user?.id || !selectedUserId) return;

    const fetchCalendarData = async () => {
      setIsLoading(true);
      setError(null);
      const year = currentDisplayDate.getFullYear();
      const month = currentDisplayDate.getMonth() + 1;
      
      const isOwnCalendar = selectedUserId === user.id;
      const eventsEndpoint = isOwnCalendar
        ? `/event/my?year=${year}&month=${month}`
        : `/event/user/${selectedUserId}?year=${year}&month=${month}`;

      try {
        const [calendarData, eventsData] = await Promise.all([
          request<BackendUserCalendarResponse>(
            `/calendar/${selectedUserId}?year=${year}&month=${month}`
          ),
          request<BackendEventsResponse>(eventsEndpoint),
        ]);
        
        setCanEditCalendar(calendarData.can_edit);

        const fetchedEvents: CalendarEvent[] = [];

        calendarData.availability.forEach((avail) => {
          let eventType: CalendarEvent["type"] = "OtherEvent";
          if (avail.status === "Office") eventType = "Office";
          else if (avail.status === "Remote") eventType = "Remote";
          else if (avail.status === "Off") eventType = "Off";

          if (eventType !== "OtherEvent" && eventType !== "Remote") {
            fetchedEvents.push({
              id: `avail-${avail.date}-${selectedUserId}`,
              title: `${avail.status} Day`,
              date: avail.date,
              type: eventType,
              originalType: avail.status,
            });
          }
        });

        calendarData.tasks.forEach((task) => {
          fetchedEvents.push({
            id: `task-${task.id}`,
            title: task.title,
            date: new Date(task.timestamp * 1000).toISOString().split("T")[0],
            type: "Task",
            description: task.description,
          });
        });

        eventsData.items.forEach((evt) => {
          fetchedEvents.push({
            id: `event-${evt.id}`,
            title: evt.title,
            date: new Date(evt.event_date * 1000).toISOString().split("T")[0],
            type: evt.event_type as CalendarEvent["type"],
            description: evt.description || undefined,
            startTime: evt.start_time || undefined,
            endTime: evt.end_time || undefined,
          });
        });

        setEvents(
          fetchedEvents.sort((a, b) => {
            const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
            if (dateCompare !== 0) return dateCompare;
            
            if (a.startTime && b.startTime) {
              return a.startTime.localeCompare(b.startTime);
            }
            if (a.startTime) return -1;
            if (b.startTime) return 1;
            return 0;
          })
        );
      } catch (e: unknown) {
        console.error("Failed to fetch calendar data:", e);
        setError(e instanceof Error ? e.message : "Failed to load calendar data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCalendarData();
  }, [user?.id, isLoadingAuth, currentDisplayDate, refreshKey, selectedUserId, request]);

  const getMonthCalendar = useCallback((): CalendarDay[] => {
    const year = currentDisplayDate.getFullYear();
    const month = currentDisplayDate.getMonth();
    const today = new Date();
    const todayKey = today.toISOString().split("T")[0];

    const firstDayOfMonth = new Date(year, month, 1);
    const daysInMonth: CalendarDay[] = [];

    const dayOfWeek = firstDayOfMonth.getDay();
    const diff =
      firstDayOfMonth.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1);
    const startDate = new Date(year, month, diff);

    for (let i = 0; i < 42; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      const dateKey = day.toISOString().split("T")[0];
      const dayEvents = events.filter((e) => e.date === dateKey);

      daysInMonth.push({
        date: new Date(day),
        dateKey,
        isCurrentMonth: day.getMonth() === month,
        isToday: dateKey === todayKey,
        isWeekend: day.getDay() === 0 || day.getDay() === 6,
        events: dayEvents,
      });
    }
    return daysInMonth;
  }, [currentDisplayDate, events]);

  const calendarDays = getMonthCalendar();

  const changeMonth = (offset: number) => {
    setCurrentDisplayDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + offset);
      return newDate;
    });
    setSelectedDay(null);
  };

  const goToToday = () => {
    setCurrentDisplayDate(new Date());
    setSelectedDay(null);
  };

  const handleAddEvent = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user?.id) return;

    if (newEventType === "Task") {
      addToast(
        "Please use the Tasks page to create new tasks with full details.",
        "info"
      );
      closeModal();
      return;
    }

    if (newEventType === "Office" || newEventType === "Remote") {
      try {
        await request(`/availability/${user.id}/day`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: newEventDate,
            status: newEventType,
          }),
        });
        setRefreshKey((k) => k + 1);
        addToast(`${newEventType} day saved successfully!`, "success");
      } catch (e: unknown) {
        addToast("Failed to update availability: " + (e instanceof Error ? e.message : "Unknown error"), "error");
      }
      closeModal();
      return;
    }

    try {
      await request("/event/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newEventTitle,
          description: newEventDescription || null,
          event_type: newEventType,
          event_date: newEventDate,
          start_time: newEventStartTime || null,
          end_time: newEventEndTime || null,
        }),
      });
      setRefreshKey((k) => k + 1);
      addToast(`${newEventType} event created successfully!`, "success");
    } catch (e: unknown) {
      addToast("Failed to create event: " + (e instanceof Error ? e.message : "Unknown error"), "error");
    }
    closeModal();
  };

  const handleDayClick = (day: CalendarDay) => {
    if (!day.isCurrentMonth) return;
    setSelectedDay(day);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header moved to App layout */}
      
      <div className="bg-[#002F41] flex-none">
        <div className="flex justify-between items-center p-2">
          <div className="flex items-center space-x-2">
             <button
                onClick={() => changeMonth(-1)}
                className="p-1.5 rounded hover:bg-gray-700 transition text-white"
                aria-label="Previous month"
              >
                <HiChevronLeft className="h-5 w-5" />
              </button>
              <h2 className="text-md font-semibold text-white">
                {currentDisplayDate.toLocaleString("default", {
                  month: "long",
                  year: "numeric",
                })}
              </h2>
              <button
                onClick={() => changeMonth(1)}
                className="p-1.5 rounded hover:bg-gray-700 transition text-white"
                aria-label="Next month"
              >
                <HiChevronRight className="h-5 w-5" />
              </button>
              <button
                onClick={goToToday}
                className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded text-white transition ml-2"
              >
                Today
              </button>
          </div>
          
          {viewableUsers.length > 1 && (
            <div className="flex items-center space-x-2">
              <label htmlFor="userSelect" className="text-xs text-gray-300">
                Viewing:
              </label>
              <select
                id="userSelect"
                value={selectedUserId || ""}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="text-xs px-2 py-1 border border-gray-600 rounded bg-gray-700 text-white focus:outline-none focus:ring-1 focus:ring-[#71c9ed]"
              >
                {viewableUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} {u.id === user?.id ? "(You)" : ""} {!u.can_edit && u.id !== user?.id ? "(View only)" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        
        {/* Grid Header */}
        <div className="grid grid-cols-7 gap-px bg-[#002F41]">
            {daysOfWeekHeaders.map((day) => (
            <div
                key={day}
                className="text-center py-1 text-[10px] font-semibold text-gray-300 uppercase bg-[#002F41]"
            >
                {day}
            </div>
            ))}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#002F41]"></div>
            <span className="ml-3 text-gray-600">Loading calendar...</span>
          </div>
        )}

        {error && (
          <p className="text-red-600 bg-red-100 p-3 text-center m-2">
            Error: {error}
          </p>
        )}

        {!isLoading && !error && (
          <>
            <div className="grid grid-cols-7 gap-px border-b border-gray-200 bg-gray-200">
                {calendarDays.map((day) => {
                const hasEvents = day.events.length > 0;
                const isSelected =
                    selectedDay?.dateKey === day.dateKey && day.isCurrentMonth;

                return (
                    <div
                    key={day.dateKey}
                    onClick={() => handleDayClick(day)}
                    className={`
                        min-h-[80px] md:min-h-[100px] p-1 relative cursor-pointer transition-all duration-150 bg-white flex flex-col
                        ${!day.isCurrentMonth ? "bg-gray-50 text-gray-400" : ""}
                        ${day.isWeekend && day.isCurrentMonth ? "bg-gray-50/30" : ""}
                        ${day.isToday ? "ring-1 ring-inset ring-[#002F41]" : ""}
                        ${isSelected ? "bg-indigo-50" : ""}
                        ${day.isCurrentMonth ? "hover:bg-gray-50" : ""}
                    `}
                    >
                    <span
                        className={`
                        inline-flex items-center justify-center w-5 h-5 text-[10px] rounded-full mb-1
                        ${day.isToday ? "bg-[#002F41] text-white font-bold" : ""}
                        ${!day.isCurrentMonth ? "text-gray-400" : "text-gray-700"}
                        `}
                    >
                        {day.date.getDate()}
                    </span>

                    {day.isCurrentMonth && hasEvents && (
                        <div className="flex-1 overflow-hidden space-y-0.5">
                        {day.events.slice(0, 3).map((evt) => (
                            <div
                            key={evt.id}
                            className={`text-[9px] px-1 py-0.5 rounded truncate ${getEventTypeColor(
                                evt.type
                            )}`}
                            title={evt.title}
                            >
                            {evt.title}
                            </div>
                        ))}
                        {day.events.length > 3 && (
                            <div className="text-[9px] text-gray-500 px-1">
                            +{day.events.length - 3} more
                            </div>
                        )}
                        </div>
                    )}
                    </div>
                );
                })}
            </div>

            <div className="p-2 bg-white border-b border-gray-200 flex flex-wrap gap-2 justify-center">
                {[
                    "Meeting",
                    "Deadline",
                    "Reminder",
                    "Holiday",
                    "Task",
                    "Office",
                ].map((type) => (
                    <div key={type} className="flex items-center gap-1 text-[10px]">
                    <div
                        className={`w-2 h-2 rounded-full ${getEventTypeDot(
                        type as CalendarEvent["type"]
                        )}`}
                    />
                    <span className="text-gray-600">{type}</span>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-2">
                {selectedDay && selectedDay.isCurrentMonth && (
                <div className="bg-white border border-gray-200 p-3">
                    <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-semibold text-gray-800">
                        {selectedDay.date.toLocaleDateString("default", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                        })}
                    </h3>
                    </div>

                    {selectedDay.events.length === 0 ? (
                    <p className="text-gray-500 text-center py-2 text-xs">
                        No events.
                    </p>
                    ) : (
                    <ul className="space-y-1">
                        {selectedDay.events
                          .sort((a, b) => {
                            if (a.startTime && b.startTime) {
                              return a.startTime.localeCompare(b.startTime);
                            }
                            if (a.startTime) return -1;
                            if (b.startTime) return 1;
                            return 0;
                          })
                          .map((evt) => (
                        <li
                            key={evt.id}
                            className="flex items-start gap-2 p-1.5 rounded border border-gray-100 bg-gray-50"
                        >
                            <div
                            className={`w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0 ${getEventTypeDot(
                                evt.type
                            )}`}
                            />
                            <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                                <h4 className="font-medium text-gray-800 truncate text-xs">
                                {evt.startTime && (
                                  <span className="text-gray-500 mr-1">
                                    {evt.startTime}{evt.endTime && ` - ${evt.endTime}`}
                                  </span>
                                )}
                                {evt.title}
                                </h4>
                                <span
                                className={`text-[9px] px-1 py-0 rounded-full ${getEventTypeColor(
                                    evt.type
                                )}`}
                                >
                                {evt.type}
                                </span>
                            </div>
                            {evt.description && (
                                <p className="text-[10px] text-gray-600 mt-0.5 truncate">
                                {evt.description}
                                </p>
                            )}
                            </div>
                        </li>
                        ))}
                    </ul>
                    )}
                </div>
                )}

                <div className="bg-white border border-gray-200 p-3">
                <h2 className="text-sm font-semibold text-gray-800 mb-2">
                    Upcoming
                </h2>
                {events.length === 0 ? (
                    <p className="text-gray-500 text-center py-2 text-xs">
                    No events scheduled.
                    </p>
                ) : (
                    <ul className="divide-y divide-gray-100">
                    {events.slice(0, 5).map((evt) => (
                        <li
                        key={evt.id}
                        className="py-1.5 flex items-start gap-2 hover:bg-gray-50 px-1 rounded transition"
                        >
                        <div
                            className={`w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0 ${getEventTypeDot(
                            evt.type
                            )}`}
                        />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                            <h4 className="font-medium text-gray-800 truncate text-xs">
                                {evt.title}
                            </h4>
                            <span className="text-[10px] text-gray-500 whitespace-nowrap">
                                {new Date(evt.date).toLocaleDateString("default", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                                })}
                                {evt.startTime && ` ${evt.startTime}`}
                            </span>
                            </div>
                        </div>
                        </li>
                    ))}
                    </ul>
                )}
                </div>
            </div>
          </>
        )}
      </div>
      
      {canEditCalendar && (
        <FloatingActionButton onClick={() => openModal()} title="Add Event" />
      )}

      <Modal isOpen={isModalOpen} onClose={closeModal} title="Add New Event">
        <form onSubmit={handleAddEvent} className="space-y-4">
          <div>
            <label
              htmlFor="eventType"
              className="block text-sm font-medium text-gray-700"
            >
              Event Type
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
              htmlFor="eventTitle"
              className="block text-sm font-medium text-gray-700"
            >
              Title
            </label>
            <input
              type="text"
              name="eventTitle"
              id="eventTitle"
              value={newEventTitle}
              onChange={(e) => setNewEventTitle(e.target.value)}
              required
              placeholder="Enter event title"
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="eventStartTime"
                className="block text-sm font-medium text-gray-700"
              >
                Start Time (Optional)
              </label>
              <input
                type="time"
                name="eventStartTime"
                id="eventStartTime"
                value={newEventStartTime}
                onChange={(e) => setNewEventStartTime(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white text-gray-900"
              />
            </div>
            <div>
              <label
                htmlFor="eventEndTime"
                className="block text-sm font-medium text-gray-700"
              >
                End Time (Optional)
              </label>
              <input
                type="time"
                name="eventEndTime"
                id="eventEndTime"
                value={newEventEndTime}
                onChange={(e) => setNewEventEndTime(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white text-gray-900"
              />
            </div>
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
              placeholder="Add a description..."
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white text-gray-900"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t">
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

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default CalendarPage;
