const bcrypt = require('bcrypt');

class ProfileFacade {
    constructor(user) {
        this.user = user;
    }

    async changePassword(oldPassword, newPassword) {
        const passwordMatches = await bcrypt.compare(oldPassword, this.user.password);

        if (!passwordMatches) {
            throw new Error('Current password is incorrect');
        }

        this.user.password = newPassword;
        await this.user.save();
    }
}

module.exports = ProfileFacade;
