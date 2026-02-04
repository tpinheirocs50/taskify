# Taskify 📋

> A modern, full-stack task management application built with Laravel and React.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Laravel](https://img.shields.io/badge/laravel-%3E%3D12.0-red.svg)
![React](https://img.shields.io/badge/react-%3E%3D19.0-61dafb.svg)
![TypeScript](https://img.shields.io/badge/typescript-%3E%3D5.7-blue.svg)

## Overview

Taskify is a comprehensive task management solution designed to help individuals and teams organize their work efficiently. With an intuitive interface and powerful features, you can manage tasks, track clients, generate invoices, and monitor your productivity through an interactive dashboard.

## ✨ Features

- **📝 Task Management**: Create, organize, and prioritize tasks with due dates, status tracking, and descriptions
- **👥 Client Management**: Maintain a centralized database of your clients with detailed information
- **💰 Invoice Management**: Generate and track invoices to manage your billing and revenue
- **📊 Analytics Dashboard**: Get insights into your productivity with comprehensive charts and metrics
- **📅 Calendar View**: Visualize your tasks and deadlines on an interactive calendar
- **🔐 User Authentication**: Secure authentication with two-factor authentication support
- **🌙 Dark Mode**: Built-in dark mode support for comfortable usage at any time
- **⚡ Real-time Updates**: Seamless updates using Inertia.js for a smooth user experience

## 🛠 Tech Stack

### Backend
- **Laravel 12**: Modern PHP framework for building robust APIs
- **Laravel Fortify**: Authentication scaffold with login, registration, and 2FA support
- **Laravel Sanctum**: Token-based API authentication
- **Inertia.js**: Server-side routing with client-side rendering

### Frontend
- **React 19**: Modern JavaScript library for building user interfaces
- **TypeScript**: Type-safe JavaScript for better development experience
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **Radix UI**: Unstyled, accessible UI components
- **Recharts**: Composable charting library for data visualization
- **Lucide React**: Beautiful, consistent SVG icons

### Development Tools
- **Vite**: Next-generation frontend build tool
- **ESLint**: Code linting for JavaScript/TypeScript
- **Prettier**: Code formatter with Tailwind CSS support
- **Pest**: Modern PHP testing framework
- **Docker**: Containerization support with Docker Compose

## 📦 Installation

### Prerequisites
- PHP 8.2+
- Node.js 18+
- Composer
- Docker (optional)

### Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/taskify.git
cd taskify
```

2. **Install dependencies**
```bash
composer install
npm install
```

3. **Setup environment**
```bash
cp .env.example .env
php artisan key:generate
```

4. **Start containers (database, etc.)**
```bash
docker compose up -d
```

5. **Update .env to match docker-compose.yml**

Make sure your database connection values in `.env` match the service names, ports, and credentials defined in `docker-compose.yml`.

6. **Database setup**
```bash
php artisan migrate
```

7. **Link storage**
```bash
php artisan storage:link
```
7. **Run the project**
```bash
composer run dev
```

The application will be available at `http://localhost:8000`

## 📋 Project Structure

```
taskify/
├── app/                          # Laravel backend
│   ├── Models/                   # Database models (Task, Client, Invoice, User)
│   ├── Http/Controllers/         # API controllers
│   └── Actions/                  # Business logic
├── resources/js/                 # React frontend
│   ├── pages/                    # Page components
│   │   ├── welcome.tsx          # Landing page
│   │   ├── dashboard.tsx        # Main dashboard
│   │   ├── tasks/               # Task management pages
│   │   ├── clients/             # Client management pages
│   │   ├── invoices/            # Invoice management pages
│   │   ├── calendar/            # Calendar view
│   │   ├── settings/            # Settings pages
│   │   └── auth/                # Authentication pages
│   ├── components/              # Reusable components
│   ├── layouts/                 # Layout wrappers
│   └── hooks/                   # Custom React hooks
├── database/                     # Database files
│   ├── migrations/              # Database schema migrations
│   └── factories/               # Test data factories
└── routes/                      # API and web routes
```

## 🎨 UI/UX Highlights

- **Modern Design**: Clean, minimalist interface with a neutral color palette
- **Responsive Layout**: Fully responsive design that works on all devices
- **Intuitive Navigation**: Easy-to-use navigation with clear visual hierarchy
- **Accessibility**: Built with accessibility in mind using semantic HTML and ARIA labels
- **Smooth Animations**: Subtle animations and transitions for a polished feel

## 🔐 Security

- Two-factor authentication support
- CSRF protection on all forms
- Password hashing with bcrypt
- Rate limiting on API endpoints
- Secure session management

## 📝 Contributing

Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to contribute to this project.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👨‍💻 Authors

Created with ❤️ by Marcelo, Mario, and Tiago

---

**Made with Laravel & React** ⚡
