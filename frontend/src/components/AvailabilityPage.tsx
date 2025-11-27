import { useCallback, useEffect, useState } from "react";
import {
  HiChevronLeft,
  HiChevronRight,
  HiCheck,
} from "react-icons/hi";
import { useAuth } from "../hooks/useAuth";
import { ToastContainer } from "./common/Toast";
import { useToast } from "../hooks/useToast";
import FloatingActionButton from "./common/FloatingActionButton";

const daysOfWeekHeaders = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface Day {
  date: Date;
  isCurrentMonth: boolean;
  isOfficeDay: boolean;
  isWeekend: boolean;
}

const AvailabilityPage = () => {
  const { user, isAdmin } = useAuth();
  const { toasts, addToast, removeToast } = useToast();
  const [selectedUserId, setSelectedUserId] = useState<string>(user?.id || "");
  const [usersForSelector, setUsersForSelector] = useState<
    { id: string; full_name: string }[]
  >([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [officeDays, setOfficeDays] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const minOfficeDaysPerWeek = 2;

  useEffect(() => {
    if (isAdmin) {
      const fetchUsers = async () => {
        try {
          const response = await fetch("/user/?limit=100", {
            headers: { Accept: "application/json" },
          });
          if (!response.ok)
            throw new Error("Failed to fetch users for selector");
          const data = await response.json();
          const users: Array<{ id: string; full_name?: string; username?: string; email?: string }> = data.items || (Array.isArray(data) ? data : []);
          setUsersForSelector(
            users.map((u) => ({
              id: u.id,
              full_name: u.full_name || u.username || u.email || "",
            }))
          );
          if (user?.id) setSelectedUserId(user.id);
        } catch (err: unknown) {
          console.error("Error fetching users for selector:", err);
        }
      };
      fetchUsers();
    } else {
      if (user?.id) setSelectedUserId(user.id);
    }
  }, [isAdmin, user?.id]);

  useEffect(() => {
    if (!selectedUserId) return;

    const fetchAvailability = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        const response = await fetch(
          `/calendar/${selectedUserId}?year=${year}&month=${month}`
        );
        if (!response.ok) {
          if (response.status === 404) {
            setOfficeDays(new Set());
            console.log(
              "No availability data found for this user/month, starting fresh."
            );
          } else {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
        } else {
          const data = await response.json();
          if (data && data.availability && Array.isArray(data.availability)) {
            const newOfficeDays = new Set<string>();
            data.availability.forEach(
              (dayInfo: { date: string; status: string }) => {
                if (
                  dayInfo.status &&
                  dayInfo.status.toLowerCase() === "office"
                ) {
                  newOfficeDays.add(dayInfo.date);
                }
              }
            );
            setOfficeDays(newOfficeDays);
          } else {
            setOfficeDays(new Set());
            console.warn(
              "Unexpected data structure from availability API or no availability data.",
              data
            );
          }
        }
      } catch (err: unknown) {
        console.error("Error fetching availability:", err);
        setError(err instanceof Error ? err.message : "Could not load availability data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailability();
  }, [selectedUserId, currentDate.getFullYear(), currentDate.getMonth()]);

  const handleDayClick = (dateKey: string) => {
    setOfficeDays((prev) => {
      const newSelection = new Set(prev);
      if (newSelection.has(dateKey)) {
        newSelection.delete(dateKey);
      } else {
        newSelection.add(dateKey);
      }
      return newSelection;
    });
  };

  const getMonthCalendar = useCallback((): Day[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const daysInMonth = [];

    let dayOfWeek = firstDayOfMonth.getDay();
    let diff =
      firstDayOfMonth.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1);

    const startDate = new Date(firstDayOfMonth.setDate(diff));

    for (let i = 0; i < 42; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      const dateKey = day.toISOString().split("T")[0];
      daysInMonth.push({
        date: new Date(day),
        isCurrentMonth: day.getMonth() === month,
        isOfficeDay: officeDays.has(dateKey),
        isWeekend: day.getDay() === 0 || day.getDay() === 6,
      });
    }
    return daysInMonth;
  }, [currentDate, officeDays]);

  const calendarDays = getMonthCalendar();

  const changeMonth = (offset: number) => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + offset);
      return newDate;
    });
  };

  const validateWeeklyOfficeDays = (): {
    isValid: boolean;
    errors: string[];
  } => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const numDaysInMonth = new Date(year, month + 1, 0).getDate();
    const weeks: Record<number, number> = {};

    for (let day = 1; day <= numDaysInMonth; day++) {
      const d = new Date(year, month, day);
      const dateKey = d.toISOString().split("T")[0];
      if (officeDays.has(dateKey) && !(d.getDay() === 0 || d.getDay() === 6)) {
        const weekNumber = Math.ceil(
          (d.getDate() + ((new Date(year, month, 1).getDay() + 6) % 7) - 1) / 7
        );
        weeks[weekNumber] = (weeks[weekNumber] || 0) + 1;
      }
    }

    const errors: string[] = [];
    for (const week in weeks) {
      if (weeks[week] < minOfficeDaysPerWeek) {
        let workdaysInWeek = 0;
        const firstDayOfWeek =
          (parseInt(week) - 1) * 7 +
          1 -
          ((new Date(year, month, 1).getDay() + 6) % 7);
        for (let i = 0; i < 7; i++) {
          const dayOfMonth = firstDayOfWeek + i;
          if (dayOfMonth > 0 && dayOfMonth <= numDaysInMonth) {
            const d = new Date(year, month, dayOfMonth);
            if (!(d.getDay() === 0 || d.getDay() === 6)) workdaysInWeek++;
          }
        }
        if (workdaysInWeek >= minOfficeDaysPerWeek) {
          errors.push(
            `Week ${week} has only ${weeks[week]} office day(s) selected. Minimum is ${minOfficeDaysPerWeek}.`
          );
        }
      }
    }

    if (officeDays.size === 0) {
      let hasPotentialWeek = false;
      for (let w = 1; w <= 5; w++) {
        let workdaysInPotentialWeek = 0;
        const firstDayOfWeek =
          (w - 1) * 7 + 1 - ((new Date(year, month, 1).getDay() + 6) % 7);
        for (let i = 0; i < 7; i++) {
          const dayOfMonth = firstDayOfWeek + i;
          if (dayOfMonth > 0 && dayOfMonth <= numDaysInMonth) {
            const d = new Date(year, month, dayOfMonth);
            if (!(d.getDay() === 0 || d.getDay() === 6))
              workdaysInPotentialWeek++;
          }
        }
        if (workdaysInPotentialWeek >= minOfficeDaysPerWeek)
          hasPotentialWeek = true;
      }
      if (hasPotentialWeek)
        errors.push(
          `Please select at least ${minOfficeDaysPerWeek} office days per week for applicable weeks.`
        );
    }

    return { isValid: errors.length === 0, errors };
  };

  const handleSubmit = async () => {
    const validation = validateWeeklyOfficeDays();
    if (!validation.isValid) {
      addToast(validation.errors[0], "error");
      return;
    }

    if (!selectedUserId) {
      addToast("No user selected to save availability for.", "error");
      return;
    }
    setIsSaving(true);
    setError(null);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    const payload = {
      office_dates: Array.from(officeDays),
    };

    try {
      const response = await fetch(
        `/calendar/${selectedUserId}?year=${year}&month=${month}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ detail: "Save failed. Unknown error." }));
        throw new Error(
          errorData.detail || `HTTP error! Status: ${response.status}`
        );
      }

      addToast("Availability saved successfully!", "success");
    } catch (err: unknown) {
      console.error("Error saving availability:", err);
      const message = err instanceof Error ? err.message : "Could not save availability.";
      setError(message);
      addToast(message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const officeDaysInCurrentMonth = Array.from(officeDays).filter((d) => {
    const date = new Date(d);
    return (
      date.getFullYear() === currentDate.getFullYear() &&
      date.getMonth() === currentDate.getMonth()
    );
  }).length;

  return (
    <div className="flex flex-col h-full bg-gray-50">
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
                {currentDate.toLocaleString("default", {
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
          </div>

        {isAdmin && usersForSelector.length > 0 && (
            <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-300 hidden sm:inline">User:</span>
            <select
              id="userSelector"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
                className="block w-40 pl-2 pr-8 py-1 text-xs border-gray-600 bg-gray-700 text-white focus:outline-none focus:ring-[#71c9ed] focus:border-[#71c9ed] rounded-md"
            >
              {usersForSelector.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

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

      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <p className="text-center text-gray-600 py-8 text-sm">
            Loading availability...
          </p>
        )}
        {error && (
          <p className="text-red-600 bg-red-100 p-3 text-center m-2">
            Error: {error}
          </p>
        )}

        {!isLoading && !error && (
          <>
            <div className="grid grid-cols-7 gap-px border-b border-gray-200 bg-gray-200">
              {calendarDays.map(
                ({ date, isCurrentMonth, isOfficeDay, isWeekend }, index) => {
                  const dateKey = date.toISOString().split("T")[0];
                  let cellClasses =
                    "min-h-[80px] md:min-h-[100px] relative group transition-colors duration-150 ease-in-out bg-white flex flex-col";
                  if (!isCurrentMonth) {
                    cellClasses += " bg-gray-50 text-gray-400";
                  } else if (isWeekend) {
                    cellClasses += " bg-gray-50/50";
                  }

                  let dayNumberClasses =
                    "p-1 text-xs";
                  if (!isCurrentMonth) dayNumberClasses += " text-gray-400";
                  else if (isOfficeDay)
                    dayNumberClasses += " font-bold text-[#002F41]";
                  else dayNumberClasses += " text-gray-700";

                  return (
                    <div
                      key={dateKey}
                      className={`${cellClasses} ${
                        isCurrentMonth && !isWeekend
                          ? "cursor-pointer hover:bg-indigo-50"
                          : ""
                      }`}
                      onClick={() =>
                        isCurrentMonth && !isWeekend && handleDayClick(dateKey)
                      }
                    >
                      <span className={dayNumberClasses}>{date.getDate()}</span>
                      
                      <div className="flex-1 flex items-center justify-center">
                      {isCurrentMonth && isOfficeDay && !isWeekend && (
                            <div className="w-full h-full bg-indigo-100 opacity-50 flex items-center justify-center">
                                <span className="text-xs font-semibold text-indigo-700">Office</span>
                        </div>
                      )}
                      {isCurrentMonth && !isOfficeDay && !isWeekend && (
                            <div className="flex items-center justify-center">
                                <span className="text-[10px] text-purple-400">Remote</span>
                            </div>
                      )}
                      </div>
                    </div>
                  );
                }
              )}
            </div>

            <div className="p-3 border-t border-gray-200 bg-white text-xs flex justify-between items-center">
                <div>
                    <p className="text-gray-600">
                        <span className="font-bold">{officeDaysInCurrentMonth}</span> office days selected.
                        <span className="text-gray-400 ml-2">(Min: {minOfficeDaysPerWeek}/week)</span>
                  </p>
                </div>
            </div>
          </>
        )}
      </div>

      <FloatingActionButton 
        onClick={handleSubmit} 
        title="Save Availability" 
        icon={HiCheck}
      />

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default AvailabilityPage;
