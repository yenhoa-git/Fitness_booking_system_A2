const chai = require("chai");
const sinon = require("sinon");
const mongoose = require("mongoose");
const Class = require("../models/Class");
const { getClasses } = require("../controllers/classController");
const { expect } = chai;

describe("GetClasses Function Test (My Bookings)", () => {
  const userId = new mongoose.Types.ObjectId();
  const otherUserId = new mongoose.Types.ObjectId();

  const mockReq = (query = {}) => ({
    query,
    user: { _id: userId, id: userId.toString() },
  });
  const mockRes = () => ({
    status: sinon.stub().returnsThis(),
    json: sinon.spy(),
  });

  const stubFind = (classes) => {
    const findStub = sinon
      .stub(Class, "find")
      .returns({ sort: sinon.stub().resolves(classes) });
    return findStub;
  };

  afterEach(() => {
    sinon.restore();
  });

  it("should only look for classes the user booked when mine is true", async () => {
    const bookedClass = {
      title: "Yoga",
      capacity: 10,
      attendees: [userId],
      date: new Date(),
    };
    const findStub = stubFind([bookedClass]);
    const req = mockReq({ mine: "true" });
    const res = mockRes();

    await getClasses(req, res);

    expect(findStub.calledOnce).to.be.true;
    expect(findStub.firstCall.args[0].attendees).to.equal(userId);
    expect(res.status.called).to.be.false;
    expect(res.json.calledOnce).to.be.true;
    expect(res.json.firstCall.args[0]).to.have.lengthOf(1);
    expect(res.json.firstCall.args[0][0].isBooked).to.be.true;
  });

  it("should not filter by attendees when mine is not sent", async () => {
    const otherClass = {
      title: "Pilates",
      capacity: 10,
      attendees: [otherUserId],
      date: new Date(),
    };
    const findStub = stubFind([otherClass]);
    const req = mockReq();
    const res = mockRes();

    await getClasses(req, res);

    expect(findStub.firstCall.args[0]).to.not.have.property("attendees");
    expect(res.json.firstCall.args[0][0].isBooked).to.be.false;
  });

  it("should use both the booking filter and the date filter together", async () => {
    const findStub = stubFind([]);
    const req = mockReq({ mine: "true", date: "2026-10-12" });
    const res = mockRes();

    await getClasses(req, res);

    const query = findStub.firstCall.args[0];
    expect(query.attendees).to.equal(userId);
    expect(query).to.have.property("date");
    expect(res.json.calledWith([])).to.be.true;
  });

  it("should return 500 if an error occurs", async () => {
    sinon.stub(Class, "find").throws(new Error("DB Error"));
    const req = mockReq({ mine: "true" });
    const res = mockRes();

    await getClasses(req, res);

    expect(res.status.calledWith(500)).to.be.true;
    expect(res.json.calledWithMatch({ message: "DB Error" })).to.be.true;
  });
});
