**Task Manager Application Overview:The task manager application is designed to help users efficiently manage their tasks and responsibilities by providing a user-friendly interface for creating, viewing, updating, and deleting tasks. It includes essential features such as secure user authentication, allowing individuals to sign up and log in to their accounts, as well as profile management to update personal information. With built-in validation such as input field validation and email validation, the application ensures a seamless user experience while enhancing productivity and organization in both personal and professional settings. **

**This apps **contain** the following features:**

* Signup
* Login
* Logout
* Update profile
* Add tasks
* View tasks
* Update tasks
* Delete tasks

**This **app**lication** is**almost **a** precompiled** app**. However, students will develop some features,**such as adding tasks, viewing tasks, updating tasks, and **deleting** tasks**. **Students** will interact with GitHub when they develop the features.**

---

**Prerequisite:** Please install the following software and create account in following web tools** **

* **Nodejs [**[https://nodejs.org/en](https://nodejs.org/en)]** **
* **Git [**[https://git-scm.com/](https://git-scm.com/)]** **
* **VS code editor** [[https://code.visualstudio.com/](https://code.visualstudio.com/)]** **
* **MongoDB Account** [[https://account.mongodb.com/account/login](https://account.mongodb.com/account/login)]** - In tutorial, we have also showed how can you create account and database: follow step number 2.**
* **GitHub Account** [[https://github.com/signup?source=login](https://github.com/signup?source=login)]** **

---

# Zerow Fitness Class Booking System

## Live deployment
Public URL: http://3.107.194.166

## Features
- Member: register, login, view schedule, view detail, book, cancel booking
- Admin: login by role, create, edit, cancel classes

## Architecture
React frontend → Nginx → Express API → MongoDB Atlas

## Local setup
1. npm install
2. npm install --prefix backend
3. npm install --prefix frontend
4. npm run seed:admin --prefix backend
5. npm run dev

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