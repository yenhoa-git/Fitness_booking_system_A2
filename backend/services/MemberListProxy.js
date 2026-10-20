const ClassMemberService = require('./ClassMemberService');

// NFR03: Proxy pattern (protection proxy)
// Stands in front of ClassMemberService and only lets admins reach it.
class MemberListProxy {
    constructor(service = new ClassMemberService()) {
        this.service = service;
    }

    async getMembers(user, classId) {
        if (!user || user.role !== 'admin') {
            const error = new Error('Admin access is required');
            error.statusCode = 403;
            throw error;
        }

        return this.service.getMembers(classId);
    }
}

module.exports = MemberListProxy;
