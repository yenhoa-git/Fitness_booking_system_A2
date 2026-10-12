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

const Schedule = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(toDateInput(new Date()));
  const [search, setSearch] = useState("");
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const loadClasses = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setMessage("");
    try {
      const response = await axiosInstance.get("/api/classes", {
        params: { date: selectedDate, search },
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setClasses(response.data);
      setSelectedClass(
        (current) =>
          response.data.find((item) => item._id === current?._id) || null,
      );
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not load classes.");
    } finally {
      setLoading(false);
    }
  }, [search, selectedDate, user]);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]); // Reload the schedule when a member chooses a day or filters classes.

  const replaceClass = (updatedClass) => {
    setClasses((current) =>
      current.map((item) =>
        item._id === updatedClass._id ? updatedClass : item,
      ),
    );
    setSelectedClass(updatedClass);
  };

  const handleBooking = async (action) => {
    if (!selectedClass) return;
    setMessage("");
    try {
      const response =
        action === "book"
          ? await axiosInstance.post(
              `/api/classes/${selectedClass._id}/book`,
              {},
              { headers: { Authorization: `Bearer ${user.token}` } },
            )
          : await axiosInstance.delete(
              `/api/classes/${selectedClass._id}/book`,
              { headers: { Authorization: `Bearer ${user.token}` } },
            );
      replaceClass(response.data);
      setMessage(
        action === "book"
          ? "Class booked successfully."
          : "Booking cancelled successfully.",
      );
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Your booking could not be updated.",
      );
    }
  };

  if (!user)
    return (
      <div className="max-w-xl mx-auto p-6">
        Please log in to view the class schedule.
      </div>
    );

  return (
    <main className="max-w-5xl mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold text-slate-800">
        Fitness class schedule
      </h1>
      <p className="text-slate-600 mt-1">
        Choose a day, then select a class to view its details.
      </p>

      <section className="mt-6 grid gap-3 md:grid-cols-2 bg-white p-4 rounded shadow-sm">
        <label className="font-medium text-slate-700">
          Date
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="mt-1 w-full p-2 border rounded"
          />
        </label>
        <label className="font-medium text-slate-700">
          Filter by class name
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && loadClasses()}
            placeholder="e.g. Yoga"
            className="mt-1 w-full p-2 border rounded"
          />
        </label>
      </section>

      {message && (
        <p className="mt-4 p-3 rounded bg-blue-50 text-blue-800">{message}</p>
      )}
      {loading && <p className="mt-4">Loading classes...</p>}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="text-xl font-semibold mb-3">Available classes</h2>
          {!loading && classes.length === 0 && (
            <p className="text-slate-600">
              No classes are scheduled for this date.
            </p>
          )}
          <div className="space-y-3">
            {classes.map((fitnessClass) => (
              <button
                type="button"
                key={fitnessClass._id}
                onClick={() => setSelectedClass(fitnessClass)}
                className="w-full text-left bg-white border rounded p-4 hover:border-blue-500"
              >
                <div className="flex justify-between gap-3">
                  <strong>{fitnessClass.title}</strong>
                  <span
                    className={
                      fitnessClass.isFull ? "text-red-600" : "text-green-700"
                    }
                  >
                    {fitnessClass.remainingCapacity} spots left
                  </span>
                </div>
                <p className="text-sm text-slate-600 mt-1">
                  {formatClassTime(fitnessClass.date)} · {fitnessClass.location}
                </p>
              </button>
            ))}
          </div>
        </section>

        <section className="bg-white rounded shadow-sm p-5 h-fit">
          <h2 className="text-xl font-semibold">Class details</h2>
          {!selectedClass && (
            <p className="mt-3 text-slate-600">Select a class from the list.</p>
          )}
          {selectedClass && (
            <>
              {selectedClass.imageUrl && (
                <img
                  src={selectedClass.imageUrl}
                  alt={selectedClass.title}
                  className="mt-4 w-full h-44 object-cover rounded"
                />
              )}
              <h3 className="text-2xl font-bold mt-4">{selectedClass.title}</h3>
              <p className="mt-2 text-slate-700">{selectedClass.description}</p>
              <dl className="mt-4 space-y-2 text-sm">
                <div>
                  <dt className="font-semibold inline">Instructor: </dt>
                  <dd className="inline">{selectedClass.instructor}</dd>
                </div>
                <div>
                  <dt className="font-semibold inline">Time: </dt>
                  <dd className="inline">
                    {formatClassTime(selectedClass.date)}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold inline">Duration: </dt>
                  <dd className="inline">{selectedClass.duration}</dd>
                </div>
                <div>
                  <dt className="font-semibold inline">Location: </dt>
                  <dd className="inline">{selectedClass.location}</dd>
                </div>
              </dl>
              {user.role === "member" && (
                <div className="mt-5">
                  {selectedClass.isBooked && selectedClass.canCancel ? (
                    <button
                      type="button"
                      onClick={() => handleBooking("cancel")}
                      className="bg-red-600 text-white px-4 py-2 rounded"
                    >
                      Cancel booking
                    </button>
                  ) : selectedClass.isBooked ? (
                    <p className="text-green-700 font-medium">
                      Booked (cancellation is closed for this class)
                    </p>
                  ) : (
                    !selectedClass.isFull && (
                      <button
                        type="button"
                        onClick={() => handleBooking("book")}
                        className="bg-blue-600 text-white px-4 py-2 rounded"
                      >
                        Book class
                      </button>
                    )
                  )}
                  {selectedClass.isFull && !selectedClass.isBooked && (
                    <p className="text-red-600 font-medium">
                      This class is full.
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
};

export default Schedule;
