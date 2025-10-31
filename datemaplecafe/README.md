# DateMapleCafe E-commerce Website

A modern, secure, full-stack coffee shop e-commerce platform featuring real-time order management, secure payment processing, and comprehensive admin tools.

[![Java](https://img.shields.io/badge/Java-17-orange.svg)](https://openjdk.java.net/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.0-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18-green.svg)](https://nodejs.org/)

## 🚀 Features

### Customer Experience
- **Intuitive Menu Browsing** - Easy-to-navigate menu with search, filters, and categories
- **Customization Options** - Personalize drinks with milk alternatives, extra shots, syrups
- **Secure Ordering** - Shopping cart with real-time price calculations
- **Payment Processing** - Secure Stripe integration with multiple payment methods
- **Order Tracking** - Real-time status updates and pickup notifications
- **Mobile Responsive** - Optimized experience across all device sizes

### Staff & Admin Features
- **Real-time Dashboard** - Live order queue with status management
- **Menu Management** - CRUD operations for menu items, pricing, and availability
- **User Management** - Role-based access control (Customer, Staff, Admin)
- **Analytics & Reporting** - Sales insights, popular items, and performance metrics
- **Inventory Tracking** - Stock level monitoring with low-stock alerts

### Technical Features
- **Security First** - OWASP Top 10 compliance, JWT authentication, input sanitization
- **Real-time Updates** - WebSocket integration for instant notifications
- **Scalable Architecture** - Microservices-ready design with Docker support
- **API-Driven** - RESTful APIs with comprehensive documentation

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React Frontend│◄──►│   Spring Boot    │◄──►│   WebSocket     │
│   (TypeScript)  │    │   Backend API    │    │   Server        │
│   Port 3000     │    │   Port 8080      │    │   Port 3002     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Material-UI   │    │   SQLite         │    │   Socket.io     │
│   Styled UI     │    │   + Flyway       │    │   Real-time     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🛠️ Tech Stack

### Backend
- **Java 17** - Modern Java features and performance
- **Spring Boot 3.2** - Production-ready framework
- **Spring Security** - JWT authentication & authorization
- **SQLite** - Lightweight, embedded database
- **Flyway** - Database migration management
- **Stripe Java SDK** - Secure payment processing
- **HikariCP** - High-performance connection pooling

### Frontend
- **React 19** - Latest React features
- **TypeScript** - Type-safe development
- **Material-UI (MUI)** - Professional React components
- **Vite** - Fast build tool and development server
- **React Router** - Client-side routing
- **Axios** - HTTP client with interceptors
- **React Hook Form** - Performant form handling

### Real-time & DevOps
- **Node.js 18** - WebSocket server runtime
- **Socket.io** - Real-time bidirectional communication
- **Docker** - Containerization and deployment
- **Nginx** - Production web server and reverse proxy

## 📋 Prerequisites

- **Java 17+** for backend development
- **Node.js 18+** for frontend and WebSocket server
- **Docker & Docker Compose** for containerized deployment
- **Stripe Account** for payment processing

## 🚀 Quick Start

### Option 1: Docker Deployment (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd datemaplecafe
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your Stripe keys and other settings
   ```

3. **Start all services**
   ```bash
   docker-compose up --build
   ```

4. **Access the application**
   - Frontend: http://localhost:80
   - Backend API: http://localhost:8080/api
   - WebSocket: http://localhost:3002

### Option 2: Local Development

1. **Backend Setup**
   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **WebSocket Server**
   ```bash
   cd websocket-server
   npm install
   npm start
   ```

## 👥 Default Users

The application comes with pre-configured users for testing:

| Role | Email | Password | Access |
|------|-------|----------|---------|
| Admin | admin@datemaplecafe.com | admin123 | Full system access |
| Staff | staff@datemaplecafe.com | staff123 | Order & menu management |
| Customer | customer@example.com | customer123 | Customer features |

## 📚 Documentation

- **[API Documentation](docs/API.md)** - Complete REST API reference
- **[Architecture Guide](docs/ARCHITECTURE.md)** - System design and technical details
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Production deployment instructions
- **[User Manual](docs/USER_MANUAL.md)** - End-user documentation
- **[Postman Collection](docs/POSTMAN_COLLECTION.json)** - API testing collection

## 🔧 Development

### Project Structure
```
datemaplecafe/
├── backend/              # Spring Boot REST API
│   ├── src/main/java/    # Java source code
│   ├── src/main/resources/ # Configuration & migrations
│   └── pom.xml           # Maven dependencies
├── frontend/             # React TypeScript application
│   ├── src/              # React components and pages
│   ├── public/           # Static assets
│   └── package.json      # NPM dependencies
├── websocket-server/     # Node.js WebSocket server
│   ├── server.js         # Main server file
│   └── package.json      # NPM dependencies
├── docker/               # Docker configuration
│   ├── Dockerfile.*      # Service-specific Dockerfiles
│   └── nginx.conf        # Nginx configuration
└── docs/                 # Documentation
```

### Key Commands

**Backend:**
```bash
./mvnw clean compile      # Compile
./mvnw spring-boot:run    # Run development server
./mvnw test              # Run tests
```

**Frontend:**
```bash
npm run dev              # Development server
npm run build            # Production build
npm run lint             # Code linting
```

**Docker:**
```bash
docker-compose up --build    # Build and start all services
docker-compose down          # Stop all services
docker-compose logs          # View logs
```

## 🔒 Security Features

- **JWT Authentication** - Stateless, secure authentication
- **Role-Based Access Control** - Customer, Staff, Admin roles
- **OWASP Top 10 Compliance** - Protection against common vulnerabilities
- **Input Validation** - Comprehensive server-side validation
- **SQL Injection Prevention** - Parameterized queries
- **CORS Protection** - Configured for secure cross-origin requests
- **Rate Limiting** - Prevents abuse on authentication endpoints
- **Secure Headers** - X-Frame-Options, X-Content-Type-Options, etc.

## 🚀 Deployment

### Production Deployment

1. **Prepare environment**
   ```bash
   cp .env.example .env
   # Configure production settings
   ```

2. **Deploy with Docker**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. **Set up reverse proxy** (recommended)
   - Configure SSL/TLS certificates
   - Set up domain routing
   - Enable HTTP/2 and compression

### Cloud Deployment

The application is ready for deployment on:
- **AWS** - EC2, ECS, or Elastic Beanstalk
- **Azure** - Container Instances or App Service
- **Google Cloud** - Cloud Run or Compute Engine
- **DigitalOcean** - App Platform or Droplets

## 📊 Monitoring & Health Checks

- **Backend Health**: `GET /api/actuator/health`
- **WebSocket Health**: `GET http://localhost:3002/health`
- **Application Metrics**: Spring Boot Actuator endpoints
- **Connection Stats**: WebSocket server statistics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Spring Boot** - Excellent framework for Java development
- **React** - Powerful UI library
- **Material-UI** - Beautiful and accessible React components
- **Stripe** - Secure and reliable payment processing
- **Socket.io** - Real-time communication made easy

---

**Built with ❤️ for coffee lovers everywhere** ☕