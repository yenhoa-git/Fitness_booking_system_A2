
# Zerow Fitness Class Booking System

**Prerequisite:** Please install the following software and create account in following web tools** **

* **Nodejs [**[https://nodejs.org/en](https://nodejs.org/en)]** **
* **Git [**[https://git-scm.com/](https://git-scm.com/)]** **
* **VS code editor** [[https://code.visualstudio.com/](https://code.visualstudio.com/)]** **
* **MongoDB Account** [[https://account.mongodb.com/account/login](https://account.mongodb.com/account/login)]** - In tutorial, we have also showed how can you create account and database: follow step number 2.**
* **GitHub Account** [[https://github.com/signup?source=login](https://github.com/signup?source=login)]** **

---

## Live deployment
Public URL: http://54.66.23.209/

## Features
- Member: register, login, view schedule, view detail, book, cancel booking
- Admin: login by role, create, edit, cancel classes, view members booked in a class

## Architecture
React frontend → Nginx → Express API → MongoDB Atlas
GitHub Actions CI/CD (self-hosted runner on EC2)
ALB with 2 EC2 instances

## Local setup
1. npm install
2. npm install --prefix backend
3. npm install --prefix frontend
4. npm run seed:admin --prefix backend
5. npm run dev or npm test

## Creadentials - Admin
Email: admin@zerowgym.com
Password: ZerowAdmin2026!

## Environment variables
MONGO_URI
JWT_SECRET
PORT

## EC2 manual deployment
Document the commands and configuration steps.

## Known limitations
- No email/push notifications when an Admin cancels a class
- No password-reset implementation
- No waitlist
- No HTTPS/domain name in the assessment deployment
- Authentication session is not persisted after a browser refresh