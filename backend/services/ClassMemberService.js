const Class = require('../models/Class');

// FR03: Encapsulation (OOP)
// Hides the database details (findById + populate) behind one simple method.
class ClassMemberService {
    async getMembers(classId) {
        const fitnessClass = await Class.findById(classId).populate('attendees', 'name email');

        if (!fitnessClass) {
            return null;
        }

        const members = fitnessClass.attendees.map((attendee) => ({
            _id: attendee._id,
            name: attendee.name,
            email: attendee.email,
        }));

        return {
            classId: fitnessClass._id,
            title: fitnessClass.title,
            memberCount: members.length,
            members,
        };
    }
}

module.exports = ClassMemberService;
