import "./App.css";
import landingPage from "./assets/Landing-page.png";

import {
  BrowserRouter,
  Routes,
  Route,
  Link,
} from "react-router-dom";

import Login from "./page/Login";
import CreateTrip from "./page/CreateTrip";
import JoinTrip from "./page/JoinTrip";
import Dashboard from "./page/Dashboard";
import TripDetails from "./page/TripDetails";


function Home() {
  return (
    <div className="app">

      {/* NAVBAR */}

      <nav className="navbar">

        <Link to="/" className="logo">
          Your Trip Expense
        </Link>

        <div className="nav-links">

          <a href="#home">
            Home
          </a>

          <a href="#features">
            Features
          </a>

          <a href="#about">
            About
          </a>

          <Link to="/login">
            <button className="login-btn">
              Login
            </button>
          </Link>

        </div>

      </nav>


      {/* HERO */}

      <section
        className="hero"
        id="home"
        style={{
          backgroundImage: `url(${landingPage})`,
        }}
      >

        <div className="hero-content">

          <p className="small-title">
            YOUR JOURNEY • YOUR MONEY
          </p>

          <h1>
            Track Your Trip.
            <br />
            <span>Enjoy Your Journey.</span>
          </h1>

          <p className="hero-text">
            Manage your food, transport, hotels and
            personal expenses in one simple place.
          </p>


          <div className="hero-buttons">

            <Link to="/create-trip">
              <button className="primary-btn">
                Create Trip
              </button>
            </Link>

            <Link to="/join-trip">
              <button className="secondary-btn">
                Join Trip
              </button>
            </Link>

          </div>

        </div>

      </section>


      {/* FEATURES */}

      <section
        className="features"
        id="features"
      >

        <h2>
          Everything for your trip
        </h2>

        <p className="section-description">
          Keep track of every expense and know
          exactly where your money goes.
        </p>


        <div className="feature-grid">

          <div className="feature-card">

            <div className="icon">
              💰
            </div>

            <h3>
              Track Expenses
            </h3>

            <p>
              Add your expenses manually and
              keep your trip spending organized.
            </p>

          </div>


          <div className="feature-card">

            <div className="icon">
              👥
            </div>

            <h3>
              Split with Friends
            </h3>

            <p>
              Divide shared expenses between
              your trip members automatically.
            </p>

          </div>


          <div className="feature-card">

            <div className="icon">
              📊
            </div>

            <h3>
              Know Your Spending
            </h3>

            <p>
              See your individual expenses and
              your total trip cost.
            </p>

          </div>

        </div>

      </section>

    </div>
  );
}


/* =========================================
   APP ROUTES
========================================= */

function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* HOME */}
        <Route
          path="/"
          element={<Home />}
        />

        {/* LOGIN */}
        <Route
          path="/login"
          element={<Login />}
        />

        {/* CREATE TRIP */}
        <Route
          path="/create-trip"
          element={<CreateTrip />}
        />

        {/* JOIN TRIP */}
        <Route
          path="/join-trip"
          element={<JoinTrip />}
        />

        {/* DASHBOARD */}
        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        {/* TRIP DETAILS */}
        <Route
          path="/trip/:tripId"
          element={<TripDetails />}
        />

      </Routes>

    </BrowserRouter>
  );
}


export default App;