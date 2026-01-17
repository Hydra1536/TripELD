# TripELD Trip Planner

A cutting-edge Electronic Logging Device (ELD) trip planning application that revolutionizes route optimization and compliance for commercial drivers. Built with modern web technologies, TripELD provides real-time route planning, Hours of Service (HOS) calculations, and interactive visualizations to ensure safe and efficient trucking operations.

## ✨ Features

### 🚛 Advanced Route Planning
- **Intelligent Routing**: Optimized route calculations with real-time traffic and road conditions
- **Multi-stop Planning**: Support for complex routes with multiple pickup and delivery points
- **Distance Calculations**: Accurate mileage tracking with Haversine distance formulas

### 📊 ELD Compliance & Logging
- **HOS Calculator**: Automated Hours of Service calculations per FMCSA regulations
- **Daily Logs**: Visual ELD logs with activity breakdowns (Driving, On Duty, Off Duty, Sleeper Berth)
- **Compliance Tracking**: Real-time monitoring of duty status and rest requirements

### 🗺️ Interactive Mapping
- **Leaflet Integration**: High-performance interactive maps with custom markers
- **Route Visualization**: Animated polylines showing complete trip routes
- **Stop Markers**: Clearly marked start/drop-off locations, fuel stops, and rest areas
- **Custom Popups**: Glassmorphism-styled information popups with detailed stop information

### 🎨 Exceptional User Experience
- **Glassmorphism Design**: Modern, translucent UI with backdrop blur effects
- **Dark Mode**: Seamless light/dark theme switching
- **Particle Animations**: Futuristic floating particle background effects
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Loading States**: Skeleton screens and progress indicators for smooth interactions

### 🔧 Technical Excellence
- **RESTful API**: Django REST Framework backend with comprehensive endpoints
- **Real-time Updates**: Asynchronous data processing and live map updates
- **Error Handling**: Robust error management with user-friendly notifications
- **Performance Optimized**: Lazy loading, code splitting, and efficient rendering

## 🛠️ Tech Stack

### Backend
- **Django** - High-level Python web framework
- **Django REST Framework** - Powerful API toolkit
- **SQLite** - Lightweight database for development
- **Python** - Core programming language

### Frontend
- **React** - Component-based UI library
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **Leaflet** - Interactive maps library
- **React Leaflet** - React components for Leaflet maps

### Key Dependencies
- **Axios** - HTTP client for API requests
- **Leaflet** - Open-source JavaScript library for mobile-friendly interactive maps
- **Tailwind CSS** - Custom design system with glassmorphism theme

## 📁 Project Structure

```
TripELD/
├── backend/                          # Django Backend Application
│   ├── core/                         # Django Project Configuration
│   │   ├── __init__.py
│   │   ├── asgi.py
│   │   ├── settings.py               # Project settings and configurations
│   │   ├── urls.py                   # Main URL routing
│   │   └── wsgi.py
│   ├── trips/                        # Main Application Module
│   │   ├── __init__.py
│   │   ├── admin.py                  # Django admin configuration
│   │   ├── apps.py
│   │   ├── models.py                 # Database models
│   │   ├── serializers.py            # DRF serializers
│   │   ├── urls.py                   # App URL routing
│   │   ├── views.py                  # API views and logic
│   │   ├── services/                 # Business logic services
│   │   │   ├── hos_calculator.py     # Hours of Service calculations
│   │   │   └── routing.py            # Route planning and optimization
│   │   ├── migrations/               # Database migrations
│   │   └── tests.py
│   ├── db.sqlite3                    # SQLite database
│   └── manage.py                     # Django management script
├── frontend/                         # React Frontend Application
│   ├── public/                       # Static assets
│   │   ├── vite.ico
│   │   └── vite.svg
│   ├── src/                          # Source code
│   │   ├── assets/                   # Static assets
│   │   ├── components/               # Reusable React components
│   │   │   ├── EldLog.jsx            # ELD log visualization component
│   │   │   └── MapView.jsx           # Interactive map component
│   │   ├── pages/                    # Page components
│   │   │   └── Home.jsx              # Main application page
│   │   ├── services/                 # API service functions
│   │   │   └── api.js                # Axios API client
│   │   ├── App.jsx                   # Root React component
│   │   ├── App.css                   # Application styles
│   │   ├── index.css                 # Global styles and Tailwind imports
│   │   └── main.jsx                  # Application entry point
│   ├── index.html                    # HTML template
│   ├── package.json                  # Node.js dependencies and scripts
│   ├── vite.config.js                # Vite configuration
│   └── eslint.config.js              # ESLint configuration
├── frontend/TODO.md                  # Development task tracking
└── README.md                         # Project documentation
```

## 🚀 Installation & Setup

### Prerequisites
- **Python 3.8+** - Backend runtime
- **Node.js 16+** - Frontend build tools
- **npm or yarn** - Package manager

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run migrations:**
   ```bash
   python manage.py migrate
   ```

5. **Start development server:**
   ```bash
   python manage.py runserver
   ```

The backend API will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

The frontend application will be available at `http://localhost:5173`

## 📖 Usage

1. **Access the Application**: Open `http://localhost:5173` in your browser
2. **Plan a Trip**:
   - Enter current location, pickup location, and drop-off location
   - Specify current cycle used hours
   - Click "Generate Logs" to calculate the route and ELD logs
3. **View Results**:
   - **Interactive Map**: See the complete route with start/drop-off markers
   - **ELD Logs**: Review daily activity breakdowns with visual charts
   - **Trip Details**: Distance, stops, and compliance information

## 🔌 API Endpoints

### Trip Planning
- `POST /api/trips/create/` - Create a new trip with route planning and HOS calculations

### Request Format
```json
{
  "current_location": "Los Angeles, CA",
  "pickup_location": "Phoenix, AZ",
  "dropoff_location": "Dallas, TX",
  "current_cycle_used_hours": 0
}
```

### Response Format
```json
{
  "hos_logs": [...],
  "route_info": {
    "path": [[lat, lng], ...],
    "waypoints": [...],
    "fuel_stops": [...],
    "rest_stops": [...],
    "total_distance_miles": 1234.5
  }
}
```

## 🎯 Key Components

### MapView Component
- Renders interactive Leaflet maps
- Displays route polylines and markers
- Custom popup styling with glassmorphism

### EldLog Component
- SVG-based activity visualization
- Color-coded duty status bars
- Hover tooltips with activity details

### Home Page
- Main application interface
- Form handling and validation
- Loading states and error management

## 🔧 Development

### Available Scripts

**Backend:**
```bash
python manage.py runserver          # Start development server
python manage.py makemigrations     # Create database migrations
python manage.py migrate            # Apply database migrations
python manage.py test               # Run test suite
```

**Frontend:**
```bash
npm run dev                         # Start development server
npm run build                       # Build for production
npm run preview                     # Preview production build
npm run lint                        # Run ESLint
```

### Environment Variables
Create `.env` files in both backend and frontend directories for configuration.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For questions, issues, or contributions, please open an issue in the repository or contact the development team.

---

**Built with ❤️ for the trucking industry** | © 2026 MD Rezaul Karim
