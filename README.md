# 🚀 RiwiFlow

RiwiFlow is a task management application based on a Kanban board system.

This project was developed as a SPA-style web application using HTML, TailwindCSS, JavaScript, and JSON Server.

---

# 📌 Features

## 🔐 Authentication

- Login system using json-server
- Session storage with localStorage
- Route protection
- Role validation

---

# 👥 Roles

## Admin

Admin users can:

- View all tasks
- Create tasks
- Edit all tasks
- Change task status
- Assign tasks to coders

---

## Coder

Coder users can:

- View all tasks
- Edit only assigned tasks
- Change task status
- Edit task description

Coder users cannot:

- Create tasks
- Edit tasks assigned to other users
- Delete tasks

---

# 📋 Kanban Workflow

Tasks are organized into 4 columns:

- Todo
- In Progress
- In Review
- Done

---

# 🛠️ Technologies Used

- HTML5
- TailwindCSS
- Vanilla JavaScript
- JSON Server

---

# 📂 Project Structure

```txt
RiwiFlow/
│
├── login.html
├── board.html
├── app.js
├── db.json
└── README.md
⚙️ Installation
1. Clone the repository
git clone https://github.com/your-user/riwiflow.git
2. Install JSON Server
npm install -g json-server
3. Run JSON Server
json-server --watch db.json --port 3000
4. Open the project

Open:

login.html

in your browser.

🔑 Test Users
Admin User
Email: admin@riwi.com
Password: 123456
Coder User
Email: coder@riwi.com
Password: 123456
🗄️ Database Structure
{
  "users": [
    {
      "id": 1,
      "name": "Admin User",
      "email": "admin@riwi.com",
      "password": "123456",
      "role": "admin"
    },
    {
      "id": 2,
      "name": "Coder User",
      "email": "coder@riwi.com",
      "password": "123456",
      "role": "coder"
    }
  ],

  "tasks": [
    {
      "id": 1,
      "title": "Create Login",
      "description": "Build authentication page",
      "status": "todo",
      "userId": 2
    }
  ]
}
✅ Functional Requirements Implemented
Authentication
Session persistence
Role management
Kanban board
Task creation
Task editing
Status management
JSON Server integration
API REST consumption
Route protection
📸 Evidence

The project includes:

Login functionality
Admin permissions
Coder restrictions
Dynamic Kanban board
Persistent data using JSON Server
👨‍💻 Authors

Developed by:

Luis David Gómez Díaz
Julio Ariza
María José