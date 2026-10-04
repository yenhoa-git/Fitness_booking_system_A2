const Class = require("../models/Class");

const requiredFields = [
  "title",
  "instructor",
  "description",
  "date",
  "duration",
  "location",
  "capacity",
];

const validateClass = (data) => {
  const missingField = requiredFields.find(
    (field) =>
      data[field] === undefined || data[field] === null || data[field] === "",
  );
  if (missingField) return `${missingField} is required`;

  const capacity = Number(data.capacity);
  if (!Number.isInteger(capacity) || capacity < 1)
    return "Capacity must be a whole number greater than 0";
  if (Number.isNaN(new Date(data.date).getTime()))
    return "Please provide a valid date and time";
  return null;
};

const classResponse = (fitnessClass, userId) => {
  const item = fitnessClass.toObject ? fitnessClass.toObject() : fitnessClass;
  const attendeeIds = item.attendees.map((attendee) =>
    attendee._id ? attendee._id.toString() : attendee.toString(),
  );
  const isBooked = userId ? attendeeIds.includes(userId.toString()) : false;

  return {
    ...item,
    attendeeCount: attendeeIds.length,
    remainingCapacity: Math.max(item.capacity - attendeeIds.length, 0),
    isFull: attendeeIds.length >= item.capacity,
    isBooked,
    canCancel: isBooked && new Date(item.date) > new Date(),
  };
};

const getClasses = async (req, res) => {
  try {
    const query = {};
    if (req.query.date) {
      const start = new Date(`${req.query.date}T00:00:00`);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      query.date = { $gte: start, $lt: end };
    }
    if (req.query.search)
      query.title = { $regex: req.query.search, $options: "i" };
    if (req.query.mine === "true") query.attendees = req.user._id;

    const classes = await Class.find(query).sort({ date: 1 });
    res.json(
      classes.map((fitnessClass) => classResponse(fitnessClass, req.user.id)),
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getClassById = async (req, res) => {
  try {
    const fitnessClass = await Class.findById(req.params.id);
    if (!fitnessClass)
      return res.status(404).json({ message: "Class not found" });
    res.json(classResponse(fitnessClass, req.user.id));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createClass = async (req, res) => {
  const validationError = validateClass(req.body);
  if (validationError)
    return res.status(400).json({ message: validationError });

  try {
    const fitnessClass = await Class.create({
      ...req.body,
      capacity: Number(req.body.capacity),
    });
    res.status(201).json(classResponse(fitnessClass, req.user.id));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateClass = async (req, res) => {
  const validationError = validateClass(req.body);
  if (validationError)
    return res.status(400).json({ message: validationError });

  try {
    const fitnessClass = await Class.findById(req.params.id);
    if (!fitnessClass)
      return res.status(404).json({ message: "Class not found" });
    if (Number(req.body.capacity) < fitnessClass.attendees.length) {
      return res
        .status(400)
        .json({
          message:
            "Capacity cannot be lower than the current number of bookings",
        });
    }

    Object.assign(fitnessClass, {
      ...req.body,
      capacity: Number(req.body.capacity),
    });
    const updatedClass = await fitnessClass.save();
    res.json(classResponse(updatedClass, req.user.id));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const cancelClass = async (req, res) => {
  try {
    const fitnessClass = await Class.findByIdAndDelete(req.params.id);
    if (!fitnessClass)
      return res.status(404).json({ message: "Class not found" });
    res.json({ message: "Class cancelled successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const bookClass = async (req, res) => {
  try {
    const userId = req.user._id;
    const bookedClass = await Class.findOneAndUpdate(
      {
        _id: req.params.id,
        attendees: { $ne: userId },
        $expr: { $lt: [{ $size: "$attendees" }, "$capacity"] },
      },
      { $addToSet: { attendees: userId } },
      { new: true },
    );

    if (bookedClass) return res.json(classResponse(bookedClass, userId));

    const existingClass = await Class.findById(req.params.id);
    if (!existingClass)
      return res.status(404).json({ message: "Class not found" });
    if (existingClass.attendees.some((attendee) => attendee.equals(userId))) {
      return res
        .status(400)
        .json({ message: "You have already booked this class" });
    }
    return res.status(400).json({ message: "This class is already full" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const cancelBooking = async (req, res) => {
  try {
    const existingClass = await Class.findById(req.params.id);
    if (!existingClass)
      return res.status(404).json({ message: "Class not found" });
    if (existingClass.date <= new Date()) {
      return res
        .status(400)
        .json({
          message: "Bookings cannot be cancelled after the class has started",
        });
    }

    const updatedClass = await Class.findOneAndUpdate(
      { _id: req.params.id, attendees: req.user._id },
      { $pull: { attendees: req.user._id } },
      { new: true },
    );
    if (!updatedClass)
      return res
        .status(400)
        .json({ message: "You do not have a booking for this class" });
    return res.json(classResponse(updatedClass, req.user._id));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getClasses,
  getClassById,
  createClass,
  updateClass,
  cancelClass,
  bookClass,
  cancelBooking,
};
