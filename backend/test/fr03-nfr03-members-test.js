const chai = require("chai");
const sinon = require("sinon");
const mongoose = require("mongoose");
const Class = require("../models/Class");
const ClassMemberService = require("../services/ClassMemberService");
const MemberListProxy = require("../services/MemberListProxy");
const { getClassMembers } = require("../controllers/classController");
const { adminOnly } = require("../middleware/authMiddleware");
const { expect } = chai;

const adminUser = () => ({ _id: new mongoose.Types.ObjectId(), role: "admin" });
const memberUser = () => ({ _id: new mongoose.Types.ObjectId(), role: "member" });

const mockRes = () => ({
  status: sinon.stub().returnsThis(),
  json: sinon.spy(),
});

// Class.findById(id).populate(...) is a chain, so findById returns an object with a populate stub
const stubFindByIdPopulate = (result) => {
  const populateStub = sinon.stub().resolves(result);
  const findByIdStub = sinon.stub(Class, "findById").returns({ populate: populateStub });
  return { findByIdStub, populateStub };
};

const sampleClass = (classId) => ({
  _id: classId,
  title: "Morning Yoga",
  attendees: [
    { _id: new mongoose.Types.ObjectId(), name: "Alice Member", email: "alice@test.com" },
    { _id: new mongoose.Types.ObjectId(), name: "Bob Member", email: "bob@test.com" },
  ],
});

describe("FR03 ClassMemberService (Encapsulation)", () => {
  afterEach(() => sinon.restore());

  it("should return the class title and its members using populate", async () => {
    const classId = new mongoose.Types.ObjectId();
    const { findByIdStub, populateStub } = stubFindByIdPopulate(sampleClass(classId));

    const result = await new ClassMemberService().getMembers(classId);

    expect(findByIdStub.calledOnceWith(classId)).to.be.true;
    expect(populateStub.calledOnceWith("attendees", "name email")).to.be.true;
    expect(result.title).to.equal("Morning Yoga");
    expect(result.memberCount).to.equal(2);
    expect(result.members).to.have.lengthOf(2);
    expect(result.members[0]).to.include({ name: "Alice Member", email: "alice@test.com" });
  });

  it("should return null if the class does not exist", async () => {
    stubFindByIdPopulate(null);

    const result = await new ClassMemberService().getMembers(new mongoose.Types.ObjectId());

    expect(result).to.be.null;
  });
});

describe("NFR03 MemberListProxy (Proxy pattern)", () => {
  afterEach(() => sinon.restore());

  it("should pass the request to the real service when the user is an admin", async () => {
    const fakeService = { getMembers: sinon.stub().resolves({ title: "Morning Yoga", members: [] }) };
    const classId = new mongoose.Types.ObjectId();

    const result = await new MemberListProxy(fakeService).getMembers(adminUser(), classId);

    expect(fakeService.getMembers.calledOnceWith(classId)).to.be.true;
    expect(result.title).to.equal("Morning Yoga");
  });

  it("should block a non-admin with a 403 error and never call the real service", async () => {
    const fakeService = { getMembers: sinon.stub() };

    let error;
    try {
      await new MemberListProxy(fakeService).getMembers(memberUser(), new mongoose.Types.ObjectId());
    } catch (err) {
      error = err;
    }

    expect(error).to.exist;
    expect(error.statusCode).to.equal(403);
    expect(fakeService.getMembers.called).to.be.false;
  });

  it("should block a request with no user with a 403 error", async () => {
    const fakeService = { getMembers: sinon.stub() };

    let error;
    try {
      await new MemberListProxy(fakeService).getMembers(undefined, new mongoose.Types.ObjectId());
    } catch (err) {
      error = err;
    }

    expect(error).to.exist;
    expect(error.statusCode).to.equal(403);
    expect(fakeService.getMembers.called).to.be.false;
  });
});

describe("FR03 / NFR03 getClassMembers Controller Test", () => {
  afterEach(() => sinon.restore());

  it("should return 200 and the members list for an admin", async () => {
    const classId = new mongoose.Types.ObjectId();
    stubFindByIdPopulate(sampleClass(classId));
    const req = { params: { id: classId }, user: adminUser() };
    const res = mockRes();

    await getClassMembers(req, res);

    expect(res.status.calledWith(200)).to.be.true;
    const body = res.json.firstCall.args[0];
    expect(body.memberCount).to.equal(2);
    expect(body.members).to.have.lengthOf(2);
  });

  it("should return 404 if the class is not found", async () => {
    stubFindByIdPopulate(null);
    const req = { params: { id: new mongoose.Types.ObjectId() }, user: adminUser() };
    const res = mockRes();

    await getClassMembers(req, res);

    expect(res.status.calledWith(404)).to.be.true;
    expect(res.json.calledWithMatch({ message: "Class not found" })).to.be.true;
  });

  it("should return 403 for a non-admin user (NFR03)", async () => {
    const { findByIdStub } = stubFindByIdPopulate(sampleClass(new mongoose.Types.ObjectId()));
    const req = { params: { id: new mongoose.Types.ObjectId() }, user: memberUser() };
    const res = mockRes();

    await getClassMembers(req, res);

    expect(res.status.calledWith(403)).to.be.true;
    expect(findByIdStub.called).to.be.false; // database never touched
  });

  it("should return 500 if a database error occurs", async () => {
    sinon.stub(Class, "findById").throws(new Error("DB Error"));
    const req = { params: { id: new mongoose.Types.ObjectId() }, user: adminUser() };
    const res = mockRes();

    await getClassMembers(req, res);

    expect(res.status.calledWith(500)).to.be.true;
    expect(res.json.calledWithMatch({ message: "DB Error" })).to.be.true;
  });
});

describe("NFR03 adminOnly Middleware Test", () => {
  it("should call next() for an admin", () => {
    const req = { user: adminUser() };
    const res = mockRes();
    const next = sinon.spy();

    adminOnly(req, res, next);

    expect(next.calledOnce).to.be.true;
    expect(res.status.called).to.be.false;
  });

  it("should return 403 for a member and not call next()", () => {
    const req = { user: memberUser() };
    const res = mockRes();
    const next = sinon.spy();

    adminOnly(req, res, next);

    expect(next.called).to.be.false;
    expect(res.status.calledWith(403)).to.be.true;
    expect(res.json.calledWithMatch({ message: "Admin access is required" })).to.be.true;
  });
});
