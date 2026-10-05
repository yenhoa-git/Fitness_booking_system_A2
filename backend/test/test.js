const chai = require('chai');
const chaiHttp = require('chai-http');
const http = require('http');
const app = require('../server');
const connectDB = require('../config/db');
const mongoose = require('mongoose');
const sinon = require('sinon');
const Class = require('../models/Class');
const { createClass, updateClass, getClasses, cancelClass } = require('../controllers/classController');
const { expect } = chai;

chai.use(chaiHttp);
let server;
let port;


// A valid class body - createClass and updateClass validate all 7 fields first
const validClassBody = () => ({
  title: 'Morning Yoga',
  instructor: 'Anna Lee',
  description: 'Beginner friendly yoga session',
  date: '2026-12-31T09:00:00.000Z',
  duration: '60 minutes',
  location: 'Studio A',
  capacity: 20,
});


describe('CreateClass Function Test', () => {

  it('should create a new class successfully', async () => {
    // Mock request data
    const req = {
      user: { id: new mongoose.Types.ObjectId() },
      body: validClassBody()
    };

    // Mock class that would be created
    const createdClass = { _id: new mongoose.Types.ObjectId(), ...req.body, attendees: [] };

    // Stub Class.create to return the createdClass
    const createStub = sinon.stub(Class, 'create').resolves(createdClass);

    // Mock response object
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.spy()
    };

    // Call function
    await createClass(req, res);

    // Assertions
    expect(createStub.calledOnceWith({ ...req.body, capacity: Number(req.body.capacity) })).to.be.true;
    expect(res.status.calledWith(201)).to.be.true;
    expect(res.json.calledWithMatch({ title: 'Morning Yoga', attendeeCount: 0, remainingCapacity: 20 })).to.be.true;

    // Restore stubbed methods
    createStub.restore();
  });

  it('should return 400 if a required field is missing', async () => {
    // Stub Class.create so we can check it is never called
    const createStub = sinon.stub(Class, 'create');

    // Mock request data without a title
    const body = validClassBody();
    delete body.title;
    const req = { user: { id: new mongoose.Types.ObjectId() }, body };

    // Mock response object
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.spy()
    };

    // Call function
    await createClass(req, res);

    // Assertions
    expect(createStub.called).to.be.false;
    expect(res.status.calledWith(400)).to.be.true;
    expect(res.json.calledWith({ message: 'title is required' })).to.be.true;

    // Restore stubbed methods
    createStub.restore();
  });

  it('should return 500 if an error occurs', async () => {
    // Stub Class.create to throw an error
    const createStub = sinon.stub(Class, 'create').throws(new Error('DB Error'));

    // Mock request data
    const req = {
      user: { id: new mongoose.Types.ObjectId() },
      body: validClassBody()
    };

    // Mock response object
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.spy()
    };

    // Call function
    await createClass(req, res);

    // Assertions
    expect(res.status.calledWith(500)).to.be.true;
    expect(res.json.calledWithMatch({ message: 'DB Error' })).to.be.true;

    // Restore stubbed methods
    createStub.restore();
  });

});


describe('UpdateClass Function Test', () => {

  it('should update class successfully', async () => {
    // Mock class data
    const classId = new mongoose.Types.ObjectId();
    const existingClass = {
      _id: classId,
      ...validClassBody(),
      title: 'Old Yoga',
      attendees: [],
      save: sinon.stub().resolvesThis(), // Mock save method
    };
    // Stub Class.findById to return mock class
    const findByIdStub = sinon.stub(Class, 'findById').resolves(existingClass);

    // Mock request & response
    const req = {
      params: { id: classId },
      user: { id: new mongoose.Types.ObjectId() },
      body: { ...validClassBody(), title: 'Updated Yoga', capacity: 25 }
    };
    const res = {
      json: sinon.spy(),
      status: sinon.stub().returnsThis()
    };

    // Call function
    await updateClass(req, res);

    // Assertions
    expect(existingClass.title).to.equal('Updated Yoga');
    expect(existingClass.capacity).to.equal(25);
    expect(existingClass.save.calledOnce).to.be.true;
    expect(res.status.called).to.be.false; // No error status should be set
    expect(res.json.calledOnce).to.be.true;

    // Restore stubbed methods
    findByIdStub.restore();
  });

  it('should return 404 if class is not found', async () => {
    const findByIdStub = sinon.stub(Class, 'findById').resolves(null);

    const req = {
      params: { id: new mongoose.Types.ObjectId() },
      user: { id: new mongoose.Types.ObjectId() },
      body: validClassBody()
    };
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.spy()
    };

    await updateClass(req, res);

    expect(res.status.calledWith(404)).to.be.true;
    expect(res.json.calledWith({ message: 'Class not found' })).to.be.true;

    findByIdStub.restore();
  });

  it('should return 500 on error', async () => {
    const findByIdStub = sinon.stub(Class, 'findById').throws(new Error('DB Error'));

    const req = {
      params: { id: new mongoose.Types.ObjectId() },
      user: { id: new mongoose.Types.ObjectId() },
      body: validClassBody()
    };
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.spy()
    };

    await updateClass(req, res);

    expect(res.status.calledWith(500)).to.be.true;
    expect(res.json.calledWithMatch({ message: 'DB Error' })).to.be.true;

    findByIdStub.restore();
  });

});


describe('GetClasses Function Test', () => {

  it('should return classes and mark the ones the user has booked', async () => {
    // Mock user ID
    const userId = new mongoose.Types.ObjectId();

    // Mock class data (user has booked the first class only)
    const classes = [
      { _id: new mongoose.Types.ObjectId(), ...validClassBody(), title: 'Class 1', capacity: 10, attendees: [userId] },
      { _id: new mongoose.Types.ObjectId(), ...validClassBody(), title: 'Class 2', capacity: 10, attendees: [] }
    ];

    // getClasses calls Class.find(query).sort(...), so find returns an object with a sort stub
    const sortStub = sinon.stub().resolves(classes);
    const findStub = sinon.stub(Class, 'find').returns({ sort: sortStub });

    // Mock request & response
    const req = { query: {}, user: { id: userId } };
    const res = {
      json: sinon.spy(),
      status: sinon.stub().returnsThis()
    };

    // Call function
    await getClasses(req, res);

    // Assertions
    expect(findStub.calledOnceWith({})).to.be.true;
    expect(sortStub.calledOnceWith({ date: 1 })).to.be.true;
    expect(res.json.calledOnce).to.be.true;
    const result = res.json.firstCall.args[0];
    expect(result).to.have.lengthOf(2);
    expect(result[0].isBooked).to.be.true;
    expect(result[0].remainingCapacity).to.equal(9);
    expect(result[1].isBooked).to.be.false;
    expect(res.status.called).to.be.false; // No error status should be set

    // Restore stubbed methods
    findStub.restore();
  });

  it('should return 500 on error', async () => {
    // Stub Class.find to throw an error
    const findStub = sinon.stub(Class, 'find').throws(new Error('DB Error'));

    // Mock request & response
    const req = { query: {}, user: { id: new mongoose.Types.ObjectId() } };
    const res = {
      json: sinon.spy(),
      status: sinon.stub().returnsThis()
    };

    // Call function
    await getClasses(req, res);

    // Assertions
    expect(res.status.calledWith(500)).to.be.true;
    expect(res.json.calledWithMatch({ message: 'DB Error' })).to.be.true;

    // Restore stubbed methods
    findStub.restore();
  });

});


describe('CancelClass Function Test', () => {

  it('should cancel (delete) a class successfully', async () => {
    // Mock request data
    const req = { params: { id: new mongoose.Types.ObjectId().toString() } };

    // Stub Class.findByIdAndDelete to return the deleted class
    const deleteStub = sinon.stub(Class, 'findByIdAndDelete').resolves({ _id: req.params.id });

    // Mock response object
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.spy()
    };

    // Call function
    await cancelClass(req, res);

    // Assertions
    expect(deleteStub.calledOnceWith(req.params.id)).to.be.true;
    expect(res.json.calledWith({ message: 'Class cancelled successfully' })).to.be.true;

    // Restore stubbed methods
    deleteStub.restore();
  });

  it('should return 404 if class is not found', async () => {
    // Stub Class.findByIdAndDelete to return null
    const deleteStub = sinon.stub(Class, 'findByIdAndDelete').resolves(null);

    // Mock request data
    const req = { params: { id: new mongoose.Types.ObjectId().toString() } };

    // Mock response object
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.spy()
    };

    // Call function
    await cancelClass(req, res);

    // Assertions
    expect(deleteStub.calledOnceWith(req.params.id)).to.be.true;
    expect(res.status.calledWith(404)).to.be.true;
    expect(res.json.calledWith({ message: 'Class not found' })).to.be.true;

    // Restore stubbed methods
    deleteStub.restore();
  });

  it('should return 500 if an error occurs', async () => {
    // Stub Class.findByIdAndDelete to throw an error
    const deleteStub = sinon.stub(Class, 'findByIdAndDelete').throws(new Error('DB Error'));

    // Mock request data
    const req = { params: { id: new mongoose.Types.ObjectId().toString() } };

    // Mock response object
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.spy()
    };

    // Call function
    await cancelClass(req, res);

    // Assertions
    expect(res.status.calledWith(500)).to.be.true;
    expect(res.json.calledWithMatch({ message: 'DB Error' })).to.be.true;

    // Restore stubbed methods
    deleteStub.restore();
  });

});