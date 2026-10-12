const chai = require("chai");
const sinon = require("sinon");
const mongoose = require("mongoose");
const Class = require("../models/Class");
const { cancelBooking } = require("../controllers/classController");
const { expect } = chai;

describe("CancelBooking Function Test", () => {
  const userId = new mongoose.Types.ObjectId();
  const classId = new mongoose.Types.ObjectId();
  const hoursFromNow = (hours) => new Date(Date.now() + hours * 60 * 60 * 1000);

  const mockReq = () => ({ params: { id: classId }, user: { _id: userId } });
  const mockRes = () => ({
    status: sinon.stub().returnsThis(),
    json: sinon.spy(),
  });

  afterEach(() => {
    sinon.restore();
  });

  it("should cancel the booking when the class is more than 2 hours away", async () => {
    const existingClass = { date: hoursFromNow(3) };
    const updatedClass = {
      toObject: () => ({
        date: existingClass.date,
        capacity: 10,
        attendees: [],
      }),
    };
    sinon.stub(Class, "findById").resolves(existingClass);
    const updateStub = sinon
      .stub(Class, "findOneAndUpdate")
      .resolves(updatedClass);
    const req = mockReq();
    const res = mockRes();

    await cancelBooking(req, res);

    expect(updateStub.calledOnce).to.be.true;
    expect(res.status.called).to.be.false;
    expect(res.json.calledOnce).to.be.true;
    expect(res.json.firstCall.args[0].isBooked).to.equal(false);
  });

  it("should return 400 when the class starts within 2 hours", async () => {
    sinon.stub(Class, "findById").resolves({ date: hoursFromNow(1) });
    const updateStub = sinon.stub(Class, "findOneAndUpdate");
    const req = mockReq();
    const res = mockRes();

    await cancelBooking(req, res);

    expect(res.status.calledWith(400)).to.be.true;
    expect(res.json.calledWithMatch({ message: sinon.match("2 hours") })).to.be
      .true;
    expect(updateStub.called).to.be.false;
  });

  it("should return 400 when the class has already started", async () => {
    sinon.stub(Class, "findById").resolves({ date: hoursFromNow(-1) });
    const updateStub = sinon.stub(Class, "findOneAndUpdate");
    const req = mockReq();
    const res = mockRes();

    await cancelBooking(req, res);

    expect(res.status.calledWith(400)).to.be.true;
    expect(res.json.calledWithMatch({ message: sinon.match("has started") })).to
      .be.true;
    expect(updateStub.called).to.be.false;
  });

  it("should return 404 if the class is not found", async () => {
    sinon.stub(Class, "findById").resolves(null);
    const req = mockReq();
    const res = mockRes();

    await cancelBooking(req, res);

    expect(res.status.calledWith(404)).to.be.true;
    expect(res.json.calledWith({ message: "Class not found" })).to.be.true;
  });

  it("should return 400 if the member has not booked the class", async () => {
    sinon.stub(Class, "findById").resolves({ date: hoursFromNow(3) });
    sinon.stub(Class, "findOneAndUpdate").resolves(null);
    const req = mockReq();
    const res = mockRes();

    await cancelBooking(req, res);

    expect(res.status.calledWith(400)).to.be.true;
    expect(
      res.json.calledWith({
        message: "You do not have a booking for this class",
      }),
    ).to.be.true;
  });

  it("should return 500 if an error occurs", async () => {
    sinon.stub(Class, "findById").throws(new Error("DB Error"));
    const req = mockReq();
    const res = mockRes();

    await cancelBooking(req, res);

    expect(res.status.calledWith(500)).to.be.true;
    expect(res.json.calledWithMatch({ message: "DB Error" })).to.be.true;
  });
});
