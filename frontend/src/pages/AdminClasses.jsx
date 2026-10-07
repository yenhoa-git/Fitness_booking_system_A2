import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../axiosConfig";

const emptyForm = () => ({
  title: "",
  instructor: "",
  description: "",
  imageUrl: "",
  date: "",
  time: "",
  duration: "60 minutes",
  location: "",
  capacity: 10,
});
const toLocalDateTime = (value) => {
  const date = new Date(value);
  const local = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000,
  ).toISOString();
  return { date: local.slice(0, 10), time: local.slice(11, 16) };
};

const AdminClasses = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [form, setForm] = useState(emptyForm());
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");

  const token = user?.token;
  const headers = { Authorization: `Bearer ${token}` };
  const loadClasses = useCallback(async () => {
    try {
      const response = await axiosInstance.get("/api/classes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClasses(response.data);
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not load classes.");
    }
  }, [token]);

  useEffect(() => {
    if (user?.role === "admin") loadClasses();
  }, [user?.role, loadClasses]);

  const updateForm = (event) =>
    setForm({ ...form, [event.target.name]: event.target.value });
  const resetForm = () => {
    setForm(emptyForm());
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    const payload = {
      ...form,
      date: `${form.date}T${form.time}:00`,
      capacity: Number(form.capacity),
    };
    delete payload.time;
    try {
      const response = editingId
        ? await axiosInstance.put(`/api/classes/${editingId}`, payload, {
            headers,
          })
        : await axiosInstance.post("/api/classes", payload, { headers });
      setClasses((current) =>
        editingId
          ? current.map((item) =>
              item._id === editingId ? response.data : item,
            )
          : [...current, response.data],
      );
      setMessage(
        editingId
          ? "Class updated successfully."
          : "Class created successfully.",
      );
      resetForm();
    } catch (error) {
      setMessage(
        error.response?.data?.message || "The class could not be saved.",
      );
    }
  };

  const startEditing = (fitnessClass) => {
    const dateTime = toLocalDateTime(fitnessClass.date);
    setEditingId(fitnessClass._id);
    setForm({ ...fitnessClass, ...dateTime, capacity: fitnessClass.capacity });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelClass = async (id) => {
    if (
      !window.confirm("Cancel this class? Existing bookings will be removed.")
    )
      return;
    try {
      await axiosInstance.delete(`/api/classes/${id}`, { headers });
      setClasses((current) => current.filter((item) => item._id !== id));
      if (editingId === id) resetForm();
      setMessage("Class cancelled successfully.");
    } catch (error) {
      setMessage(
        error.response?.data?.message || "The class could not be cancelled.",
      );
    }
  };

  if (user?.role !== "admin")
    return (
      <main className="max-w-3xl mx-auto p-6">Admin access is required.</main>
    );

  return (
    <main className="max-w-5xl mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold text-slate-800">
        Manage fitness classes
      </h1>
      <p className="mt-1 text-slate-600">
        Create a class or edit and cancel an existing class.
      </p>
      {message && (
        <p className="mt-4 p-3 rounded bg-blue-50 text-blue-800">{message}</p>
      )}

      <form
        onSubmit={handleSubmit}
        className="mt-6 bg-white rounded shadow-sm p-5 grid gap-4 md:grid-cols-2"
      >
        <h2 className="md:col-span-2 text-xl font-semibold">
          {editingId ? "Edit class" : "Create a new class"}
        </h2>
        <label>
          Class name
          <input
            required
            name="title"
            value={form.title}
            onChange={updateForm}
            className="mt-1 w-full border rounded p-2"
          />
        </label>
        <label>
          Instructor
          <input
            required
            name="instructor"
            value={form.instructor}
            onChange={updateForm}
            className="mt-1 w-full border rounded p-2"
          />
        </label>
        <label>
          Date
          <input
            required
            type="date"
            name="date"
            value={form.date}
            onChange={updateForm}
            className="mt-1 w-full border rounded p-2"
          />
        </label>
        <label>
          Time
          <input
            required
            type="time"
            name="time"
            value={form.time}
            onChange={updateForm}
            className="mt-1 w-full border rounded p-2"
          />
        </label>
        <label>
          Duration
          <input
            required
            name="duration"
            value={form.duration}
            onChange={updateForm}
            placeholder="e.g. 60 minutes"
            className="mt-1 w-full border rounded p-2"
          />
        </label>
        <label>
          Location
          <input
            required
            name="location"
            value={form.location}
            onChange={updateForm}
            className="mt-1 w-full border rounded p-2"
          />
        </label>
        <label>
          Capacity
          <input
            required
            min="1"
            type="number"
            name="capacity"
            value={form.capacity}
            onChange={updateForm}
            className="mt-1 w-full border rounded p-2"
          />
        </label>
        <label>
          Image URL (optional)
          <input
            type="url"
            name="imageUrl"
            value={form.imageUrl || ""}
            onChange={updateForm}
            className="mt-1 w-full border rounded p-2"
          />
        </label>
        <label className="md:col-span-2">
          Description
          <textarea
            required
            name="description"
            value={form.description}
            onChange={updateForm}
            rows="3"
            className="mt-1 w-full border rounded p-2"
          />
        </label>
        <div className="md:col-span-2 flex gap-3">
          <button className="bg-blue-600 text-white px-4 py-2 rounded">
            {editingId ? "Save changes" : "Create class"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="border px-4 py-2 rounded"
            >
              Cancel edit
            </button>
          )}
        </div>
      </form>

      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-3">Scheduled classes</h2>
        <div className="space-y-3">
          {classes.map((fitnessClass) => (
            <article
              key={fitnessClass._id}
              className="bg-white rounded border p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <h3 className="font-bold">{fitnessClass.title}</h3>
                <p className="text-sm text-slate-600">
                  {new Date(fitnessClass.date).toLocaleString("en-AU")} ·{" "}
                  {fitnessClass.instructor} · {fitnessClass.attendeeCount}/
                  {fitnessClass.capacity} booked
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => startEditing(fitnessClass)}
                  className="bg-amber-500 text-white px-3 py-2 rounded"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => cancelClass(fitnessClass._id)}
                  className="bg-red-600 text-white px-3 py-2 rounded"
                >
                  Cancel class
                </button>
              </div>
            </article>
          ))}
          {!classes.length && (
            <p className="text-slate-600">No classes have been created yet.</p>
          )}
        </div>
      </section>
    </main>
  );
};

export default AdminClasses;
