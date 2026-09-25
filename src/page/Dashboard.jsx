import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import landingPage from "../assets/Landing-page.png";

function Dashboard() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);

  const getTrips = async () => {
    setLoading(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        alert("Please login first.");
        return;
      }

      const { data: tripData, error: tripError } = await supabase
        .from("trips")
        .select("*")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });

      if (tripError) {
        alert(tripError.message);
        return;
      }

      const tripIds = (tripData || []).map((trip) => trip.id);

      let expenseData = [];

      if (tripIds.length > 0) {
        const { data, error: expenseError } = await supabase
          .from("expenses")
          .select("id, trip_id, amount")
          .in("trip_id", tripIds);

        if (expenseError) {
          alert(expenseError.message);
          return;
        }

        expenseData = data || [];
      }

      const updatedTrips = (tripData || []).map((trip) => {
        const tripExpenses = expenseData.filter(
          (expense) => expense.trip_id === trip.id
        );

        const spent = tripExpenses.reduce(
          (total, expense) =>
            total + Number(expense.amount || 0),
          0
        );

        const budget = Number(trip.budget || 0);

        return {
          ...trip,
          spent,
          remaining: budget - spent,
        };
      });

      setTrips(updatedTrips);

    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (amount) => {
    return Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div
      className="travel-dashboard"
      style={{
        backgroundImage: `url(${landingPage})`,
      }}
    >

      {/* DARK OVERLAY */}
      <div className="dashboard-overlay"></div>

      {/* CONTENT */}
      <div className="dashboard-content">

        {/* NAVBAR */}
        <nav className="dashboard-nav">

          <Link to="/" className="dashboard-logo">
            Your Trip Expense
          </Link>

          <div className="dashboard-nav-right">
            <span className="dashboard-nav-label">
              MY TRIPS
            </span>

            <Link to="/">
              <button className="dashboard-home-btn">
                Home
              </button>
            </Link>
          </div>

        </nav>


        {/* HEADER */}
        <section className="dashboard-hero">

          <div>

            <p className="dashboard-eyebrow">
              YOUR JOURNEY • YOUR MONEY
            </p>

            <h1>
              Your Trips.
              <br />
              <span>Your Journey.</span>
            </h1>

            <p className="dashboard-description">
              Keep your trips organized and know
              exactly where your money goes.
            </p>

          </div>

          <div className="dashboard-main-actions">

            <Link to="/create-trip">
              <button className="dashboard-create-btn">
                + Create Trip
              </button>
            </Link>

            <button
              className="dashboard-refresh-btn"
              onClick={getTrips}
            >
              ↻ Refresh
            </button>

          </div>

        </section>


        {/* INITIAL STATE */}
        {trips.length === 0 && !loading && (

          <section className="dashboard-empty glass-card">

            <div className="empty-trip-icon">
              ✈️
            </div>

            <h2>
              Ready for your next adventure?
            </h2>

            <p>
              Load your trips to see your
              budgets and expenses.
            </p>

            <button
              className="dashboard-create-btn"
              onClick={getTrips}
            >
              Load My Trips
            </button>

          </section>

        )}


        {/* LOADING */}
        {loading && (

          <div className="dashboard-loading">
            <div className="dashboard-spinner">
              ↻
            </div>

            <p>
              Loading your trips...
            </p>
          </div>

        )}


        {/* TRIPS */}
        {!loading && trips.length > 0 && (

          <section className="dashboard-trips">

            <div className="dashboard-section-title">

              <div>
                <p>
                  YOUR COLLECTION
                </p>

                <h2>
                  Your Trips
                </h2>
              </div>

              <span>
                {trips.length}{" "}
                {trips.length === 1
                  ? "Trip"
                  : "Trips"}
              </span>

            </div>


            <div className="travel-trip-grid">

              {trips.map((trip) => {

                const budget =
                  Number(trip.budget || 0);

                const spent =
                  Number(trip.spent || 0);

                const remaining =
                  Number(trip.remaining || 0);

                const percentage =
                  budget > 0
                    ? Math.min(
                        (spent / budget) * 100,
                        100
                      )
                    : 0;

                const overBudget =
                  remaining < 0;

                return (

                  <article
                    className="travel-trip-card"
                    key={trip.id}
                  >

                    {/* CARD HEADER */}

                    <div className="travel-card-header">

                      <div>

                        <span className="trip-small-label">
                          TRIP
                        </span>

                        <h3>
                          {trip.name}
                        </h3>

                        <p>
                          📍 {trip.destination}
                        </p>

                      </div>

                      <div className="travel-card-icon">
                        ✈
                      </div>

                    </div>


                    {/* DATE */}

                    <div className="travel-date">
                      📅 {trip.start_date}
                      {"  →  "}
                      {trip.end_date}
                    </div>


                    {/* MONEY */}

                    <div className="travel-money-grid">

                      <div>
                        <span>
                          BUDGET
                        </span>

                        <strong>
                          ₹{formatMoney(budget)}
                        </strong>
                      </div>

                      <div>
                        <span>
                          SPENT
                        </span>

                        <strong>
                          ₹{formatMoney(spent)}
                        </strong>
                      </div>

                    </div>


                    {/* PROGRESS */}

                    <div className="travel-progress-area">

                      <div className="travel-progress-text">

                        <span>
                          Budget used
                        </span>

                        <span>
                          {percentage.toFixed(0)}%
                        </span>

                      </div>

                      <div className="travel-progress">

                        <div
                          className={
                            overBudget
                              ? "travel-progress-fill over"
                              : "travel-progress-fill"
                          }
                          style={{
                            width:
                              `${percentage}%`,
                          }}
                        />

                      </div>

                    </div>


                    {/* REMAINING */}

                    <div
                      className={
                        overBudget
                          ? "travel-remaining over"
                          : "travel-remaining"
                      }
                    >

                      <div>

                        <span>
                          {overBudget
                            ? "OVER BUDGET"
                            : "REMAINING"}
                        </span>

                        <strong>
                          ₹
                          {formatMoney(
                            Math.abs(remaining)
                          )}
                        </strong>

                      </div>

                      <span>
                        {overBudget
                          ? "⚠"
                          : "✓"}
                      </span>

                    </div>


                    {/* OPEN */}

                    <Link
                      to={`/trip/${trip.id}`}
                      className="travel-open-trip"
                    >
                      Open Trip
                      <span>
                        →
                      </span>
                    </Link>

                  </article>

                );
              })}

            </div>

          </section>

        )}

      </div>

    </div>
  );
}

export default Dashboard;