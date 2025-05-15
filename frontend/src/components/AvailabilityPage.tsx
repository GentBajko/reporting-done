import { useCallback, useEffect, useState } from "react";
import {
  HiCalendar,
  HiChevronLeft,
  HiChevronRight,
  HiInformationCircle,
} from "react-icons/hi";

// Mock current user role - replace with actual auth context or prop
const USER_ROLE: "admin" | "user" = "admin"; // or "user"
const CURRENT_USER_ID: string = "usr-self"; // Replace with actual user ID from auth

const daysOfWeekHeaders = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface Day {
  date: Date;
  isCurrentMonth: boolean;
  isOfficeDay: boolean;
  isWeekend: boolean;
}

const AvailabilityPage = () => {
  const [selectedUser, setSelectedUser] = useState<string>(CURRENT_USER_ID);
  const [usersList, setUsersList] = useState<{ id: string; name: string }[]>(
    []
  );
  const [currentDate, setCurrentDate] = useState(new Date()); // For month navigation
  const [officeDays, setOfficeDays] = useState<Set<string>>(new Set()); // Stores "YYYY-MM-DD" strings
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const minOfficeDaysPerWeek = 2;

  // --- Mock User & Availability Data ---
  useEffect(() => {
    setIsLoading(true);
    setError(null);

    if (USER_ROLE === "admin") {
      setTimeout(() => {
        setUsersList([
          { id: "usr-self", name: "My Availability (Self)" },
          { id: "usr-1", name: "Alice Wonderland" },
          { id: "usr-2", name: "Bob The Builder" },
        ]);
      }, 300);
    }

    // Simulate fetching availability for the selected user and current month
    // In a real app, this would depend on selectedUser and currentDate (for month/year)
    console.log(
      `Mock fetch for user: ${selectedUser}, month: ${
        currentDate.getMonth() + 1
      }`
    );
    setTimeout(() => {
      // Example: Load some mock office days if it's Alice for the current month
      if (selectedUser === "usr-1") {
        const today = new Date(currentDate);
        const mockDays = new Set<string>();
        // Add first Monday and Tuesday of the current month as office days for Alice
        let d = new Date(today.getFullYear(), today.getMonth(), 1);
        let mondays = 0;
        while (d.getMonth() === today.getMonth() && mondays < 2) {
          if (d.getDay() === 1) {
            // Monday (0=Sun, 1=Mon, ...)
            mockDays.add(d.toISOString().split("T")[0]);
            const tues = new Date(d);
            tues.setDate(d.getDate() + 1);
            if (tues.getMonth() === today.getMonth()) {
              mockDays.add(tues.toISOString().split("T")[0]);
            }
            mondays++;
          }
          d.setDate(d.getDate() + 1);
        }
        setOfficeDays(mockDays);
      } else {
        setOfficeDays(new Set()); // Default to no office days
      }
      setIsLoading(false);
    }, 700);
  }, [selectedUser, currentDate.getFullYear(), currentDate.getMonth()]); // Re-fetch on user or month change

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
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = [];

    // Adjust start day to be Monday
    let dayOfWeek = firstDayOfMonth.getDay(); // 0 (Sun) to 6 (Sat)
    let diff =
      firstDayOfMonth.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1); // if Sunday (0), treat as 7th day for offset

    const startDate = new Date(firstDayOfMonth.setDate(diff));

    for (let i = 0; i < 42; i++) {
      // Max 6 weeks * 7 days
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
    const weeks: Record<number, number> = {}; // weekNumber: officeDayCount

    for (let day = 1; day <= numDaysInMonth; day++) {
      const d = new Date(year, month, day);
      const dateKey = d.toISOString().split("T")[0];
      if (officeDays.has(dateKey) && !(d.getDay() === 0 || d.getDay() === 6)) {
        // Is an office day and not a weekend
        const weekNumber = Math.ceil(
          (d.getDate() + ((new Date(year, month, 1).getDay() + 6) % 7) - 1) / 7
        );
        weeks[weekNumber] = (weeks[weekNumber] || 0) + 1;
      }
    }

    const errors: string[] = [];
    for (const week in weeks) {
      // Check only weeks that have at least one workday selected as office, or all weeks if none selected
      if (weeks[week] < minOfficeDaysPerWeek) {
        // Check if the week has enough workdays to meet the minimum.
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
          // Only error if the week actually has enough potential workdays
          errors.push(
            `Week ${week} has only ${weeks[week]} office day(s) selected. Minimum is ${minOfficeDaysPerWeek}.`
          );
        }
      }
    }
    // If no office days are selected at all across the month, and there are weeks with sufficient workdays.
    if (officeDays.size === 0) {
      let hasPotentialWeek = false;
      for (let w = 1; w <= 5; w++) {
        // Check up to 5 weeks
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
      alert("Validation Error:\n" + validation.errors.join("\n"));
      return;
    }

    setIsLoading(true);
    setError(null);
    console.log(
      `Mock saving availability for user: ${selectedUser}, month: ${
        currentDate.getMonth() + 1
      }-${currentDate.getFullYear()}, office days:`,
      Array.from(officeDays)
    );
    // TODO: Replace with actual API call
    // Backend would receive the set of "YYYY-MM-DD" strings for office days
    // It might need to calculate "remote days" if the API expects that.
    setTimeout(() => {
      setIsLoading(false);
      alert("Availability saved successfully! (mock)");
    }, 1500);
  };

  const officeDaysInCurrentMonth = Array.from(officeDays).filter((d) => {
    const date = new Date(d);
    return (
      date.getFullYear() === currentDate.getFullYear() &&
      date.getMonth() === currentDate.getMonth()
    );
  }).length;

  return (
    <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 flex items-center">
          <HiCalendar className="mr-3 h-7 w-7 text-[#002F41]" />
          Monthly Office Availability
        </h1>
        {USER_ROLE === "admin" && (
          <div className="w-full sm:w-auto">
            <label
              htmlFor="user-select"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              View/Edit For:
            </label>
            <select
              id="user-select"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
            >
              {usersList.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="bg-white shadow-xl rounded-lg p-6 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => changeMonth(-1)}
            className="p-2 rounded-md hover:bg-gray-200 transition text-[#002F41]"
            aria-label="Previous month"
          >
            <HiChevronLeft className="h-6 w-6" />
          </button>
          <h2 className="text-xl font-semibold text-gray-700">
            {currentDate.toLocaleString("default", {
              month: "long",
              year: "numeric",
            })}
          </h2>
          <button
            onClick={() => changeMonth(1)}
            className="p-2 rounded-md hover:bg-gray-200 transition text-[#002F41]"
            aria-label="Next month"
          >
            <HiChevronRight className="h-6 w-6" />
          </button>
        </div>

        {isLoading && (
          <p className="text-center text-gray-600 py-8">
            Loading availability...
          </p>
        )}
        {error && (
          <p className="text-red-600 bg-red-100 p-3 rounded-md text-center">
            Error: {error}
          </p>
        )}

        {!isLoading && !error && (
          <>
            <div className="grid grid-cols-7 gap-px border-l border-t border-gray-200 bg-gray-200">
              {daysOfWeekHeaders.map((day) => (
                <div
                  key={day}
                  className="text-center py-2 text-xs font-medium text-gray-500 uppercase bg-gray-50 border-r border-b"
                >
                  {day}
                </div>
              ))}
              {calendarDays.map(
                ({ date, isCurrentMonth, isOfficeDay, isWeekend }, index) => {
                  const dateKey = date.toISOString().split("T")[0];
                  let cellClasses =
                    "py-2 min-h-[80px] md:min-h-[100px] relative group transition-colors duration-150 ease-in-out bg-white border-r border-b border-gray-200";
                  if (!isCurrentMonth) {
                    cellClasses += " bg-gray-50 text-gray-400";
                  } else if (isWeekend) {
                    cellClasses += " bg-gray-100";
                  }

                  let dayNumberClasses =
                    "absolute top-1.5 left-1.5 text-xs md:text-sm";
                  if (!isCurrentMonth) dayNumberClasses += " text-gray-400";
                  else if (isOfficeDay)
                    dayNumberClasses += " font-semibold text-white";
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
                      {isCurrentMonth && isOfficeDay && !isWeekend && (
                        <div className="absolute inset-0 bg-indigo-500 opacity-80 flex items-center justify-center rounded-sm">
                          <span className="text-xs font-semibold text-white hidden group-hover:inline">
                            Office
                          </span>
                        </div>
                      )}
                      {isCurrentMonth && isOfficeDay && (
                        <span className="absolute bottom-1 right-1 text-[10px] bg-indigo-500 text-white px-1.5 py-0.5 rounded-full">
                          Office
                        </span>
                      )}
                      {isCurrentMonth && !isOfficeDay && !isWeekend && (
                        <span className="absolute bottom-1 right-1 text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">
                          Remote
                        </span>
                      )}
                    </div>
                  );
                }
              )}
            </div>
            <div className="mt-6 p-4 border border-blue-300 bg-blue-50 rounded-md">
              <div className="flex items-start">
                <HiInformationCircle className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-700">
                    Click on a day to mark it as an "Office" day. Unselected
                    workdays are "Remote".
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    A minimum of{" "}
                    <strong>{minOfficeDaysPerWeek} office days per week</strong>{" "}
                    (for non-weekend days) is encouraged.
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Selected office days in{" "}
                    {currentDate.toLocaleString("default", { month: "long" })}:{" "}
                    <span className="font-bold">
                      {officeDaysInCurrentMonth}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="bg-[#002F41] hover:bg-[#004057] text-white font-semibold py-2.5 px-6 rounded-lg transition duration-150 focus:outline-none focus:ring-2 focus:ring-[#005A7D] focus:ring-opacity-50 disabled:bg-gray-400"
              >
                {isLoading ? "Saving..." : "Save Monthly Availability"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AvailabilityPage;
