import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../axiosConfig";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const pad = (number) => String(number).padStart(2, "0");

// Local-time YYYY-MM-DD key, used to group bookings by calendar day.
const toDateKey = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

// Monday of the week containing the given date.
const startOfWeek = (date) => {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return start;
};

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const formatHeading = (date) =>
  `${DAY_LABELS[(date.getDay() + 6) % 7]} ${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;

const formatTime = (date) =>
  new Date(date).toLocaleTimeString("en-AU", {
    hour: "numeric",
    minute: "2-digit",
  });

const isPast = (fitnessClass) => new Date(fitnessClass.date) <= new Date();

const MyBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const loadBookings = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await axiosInstance.get("/api/classes", {
        params: { mine: "true" },
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setBookings(response.data);
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Could not load your bookings.",
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const handleCancel = async (fitnessClass) => {
    if (!window.confirm(`Cancel your booking for ${fitnessClass.title}?`))
      return;
    setMessage("");
    try {
      await axiosInstance.delete(`/api/classes/${fitnessClass._id}/book`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setBookings((current) =>
        current.filter((item) => item._id !== fitnessClass._id),
      );
      setMessage("Booking cancelled successfully.");
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Your booking could not be cancelled.",
      );
    }
  };

  if (!user)
    return (
      <div className="max-w-xl mx-auto p-6">
        Please log in to view your bookings.
      </div>
    );
  if (user.role !== "member")
    return (
      <div className="max-w-xl mx-auto p-6">Only members have bookings.</div>
    );

  const weekStart = startOfWeek(selectedDate);
  const weekDays = DAY_LABELS.map((label, index) => ({
    label,
    date: addDays(weekStart, index),
  }));
  const bookedDayKeys = new Set(
    bookings.map((item) => toDateKey(new Date(item.date))),
  );
  const selectedKey = toDateKey(selectedDate);
  const dayBookings = bookings.filter(
    (item) => toDateKey(new Date(item.date)) === selectedKey,
  );

  return (
    <main className="max-w-2xl mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold text-slate-800">My Bookings</h1>

      <section className="mt-6 bg-white p-4 rounded shadow-sm">
        <div className="flex items-center justify-between">
          <button
            type="button"
            aria-label="Previous week"
            onClick={() => setSelectedDate(addDays(selectedDate, -7))}
            className="px-3 py-1 rounded hover:bg-slate-100"
          >
            &lt;
          </button>
          <h2 className="font-semibold text-slate-700">
            {selectedDate.toLocaleString("en-AU", {
              month: "long",
              year: "numeric",
            })}
          </h2>
          <button
            type="button"
            aria-label="Next week"
            onClick={() => setSelectedDate(addDays(selectedDate, 7))}
            className="px-3 py-1 rounded hover:bg-slate-100"
          >
            &gt;
          </button>
        </div>

        <div className="mt-4 grid grid-cols-7 text-center">
          {weekDays.map(({ label, date }) => {
            const key = toDateKey(date);
            const isSelected = key === selectedKey;
            return (
              <button
                type="button"
                key={key}
                onClick={() => setSelectedDate(date)}
                className="py-1"
              >
                <div className="text-xs text-slate-500">{label}</div>
                <div
                  className={`mx-auto mt-1 w-9 h-9 flex items-center justify-center rounded-full ${isSelected ? "bg-blue-600 text-white" : "hover:bg-slate-100"}`}
                >
                  {pad(date.getDate())}
                </div>
                <div
                  className={`mx-auto mt-1 w-1.5 h-1.5 rounded-full ${bookedDayKeys.has(key) ? "bg-red-500" : "bg-transparent"}`}
                />
              </button>
            );
          })}
        </div>
      </section>

      {message && (
        <p className="mt-4 p-3 rounded bg-blue-50 text-blue-800">{message}</p>
      )}
      {loading && <p className="mt-4">Loading bookings...</p>}

      <h2 className="mt-6 mb-3 font-semibold text-slate-700">
        {formatHeading(selectedDate)}
      </h2>
      {!loading && dayBookings.length === 0 && (
        <p className="text-slate-600">You have no bookings on this day.</p>
      )}

      <div className="space-y-3">
        {dayBookings.map((fitnessClass) => (
          <article
            key={fitnessClass._id}
            className="bg-white border rounded p-4 flex items-center gap-4"
          >
            {fitnessClass.imageUrl && (
              <img
                src={fitnessClass.imageUrl}
                alt={fitnessClass.title}
                className="w-16 h-16 object-cover rounded"
              />
            )}
            <div className="flex-1">
              <strong className="text-lg">{fitnessClass.title}</strong>
              <p className="text-sm text-slate-600">
                {fitnessClass.location} · Instructor {fitnessClass.instructor}
              </p>
              <p className="text-sm text-slate-600">
                {formatTime(fitnessClass.date)} · {fitnessClass.duration}
              </p>
            </div>
            <div className="text-right">
              {isPast(fitnessClass) && (
                <span className="text-xs px-2 py-1 rounded bg-slate-200 text-slate-600">
                  Past
                </span>
              )}
              {!isPast(fitnessClass) && (
                <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800">
                  Upcoming
                </span>
              )}
              {!isPast(fitnessClass) &&
                (fitnessClass.canCancel ? (
                  <button
                    type="button"
                    onClick={() => handleCancel(fitnessClass)}
                    className="block mt-2 bg-red-600 text-white px-3 py-2 rounded text-sm"
                  >
                    Cancel Booking
                  </button>
                ) : (
                  <p className="mt-2 text-xs text-slate-500">
                    Cancellation closed
                  </p>
                ))}
            </div>
          </article>
        ))}
      </div>

      <Link
        to="/schedule"
        className="mt-8 block text-center bg-blue-600 text-white p-3 rounded hover:bg-blue-700"
      >
        View class calendar
      </Link>
    </main>
  );
};

export default MyBookings;
