import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../axiosConfig";

const toDateInput = (date) => {
  const offsetDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000,
  );
  return offsetDate.toISOString().slice(0, 10);
};

const formatClassTime = (date) =>
  new Date(date).toLocaleString("en-AU", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const MyBookings = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(toDateInput(new Date()));
  const [bookings, setBookings] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const loadBookings = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setMessage("");
    try {
      const response = await axiosInstance.get("/api/classes", {
        params: { mine: "true", date: selectedDate },
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
  }, [user, selectedDate]);

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

  return (
    <main className="max-w-5xl mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold text-slate-800">My Bookings</h1>
      <p className="text-slate-600 mt-1">
        Choose a day to see the classes you have booked.
      </p>

      <section className="mt-6 bg-white p-4 rounded shadow-sm">
        <label className="font-medium text-slate-700">
          Date
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="mt-1 w-full p-2 border rounded"
          />
        </label>
      </section>

      {message && (
        <p className="mt-4 p-3 rounded bg-blue-50 text-blue-800">{message}</p>
      )}
      {loading && <p className="mt-4">Loading bookings...</p>}

      <section className="mt-6">
        <h2 className="text-xl font-semibold mb-3">Booked classes</h2>
        {!loading && bookings.length === 0 && (
          <p className="text-slate-600">You have no bookings on this date.</p>
        )}
        <div className="space-y-3">
          {bookings.map((fitnessClass) => {
            const past = new Date(fitnessClass.date) <= new Date();
            return (
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
                  <div className="flex gap-3 items-center">
                    <strong>{fitnessClass.title}</strong>
                    <span
                      className={past ? "text-slate-500" : "text-green-700"}
                    >
                      {past ? "Past" : "Upcoming"}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">
                    {formatClassTime(fitnessClass.date)} ·{" "}
                    {fitnessClass.duration}
                  </p>
                  <p className="text-sm text-slate-600">
                    {fitnessClass.location} · Instructor{" "}
                    {fitnessClass.instructor}
                  </p>
                </div>
                {!past &&
                  (fitnessClass.canCancel ? (
                    <button
                      type="button"
                      onClick={() => handleCancel(fitnessClass)}
                      className="bg-red-600 text-white px-3 py-2 rounded"
                    >
                      Cancel booking
                    </button>
                  ) : (
                    <p className="text-sm text-slate-500">
                      Cancellation closed
                    </p>
                  ))}
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
};

export default MyBookings;
