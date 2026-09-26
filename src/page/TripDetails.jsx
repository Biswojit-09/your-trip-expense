
console.log("NEW TRIP DETAILS COMPONENT IS RUNNING");
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import landingPage from "../assets/Landing-page.png";

function TripDetails() {
  const { tripId } = useParams();

  const [trip, setTrip] = useState(null);
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================================
  // LOAD TRIP AUTOMATICALLY
  // =========================================

  useEffect(() => {
    let cancelled = false;

    const fetchTrip = async () => {
      if (!tripId) {
        setError("Trip ID is missing.");
        setLoading(false);
        return;
      }

      try {
        // ================================
        // GET TRIP
        // ================================

        const {
          data: tripData,
          error: tripError,
        } = await supabase
          .from("trips")
          .select("*")
          .eq("id", tripId)
          .single();

        if (tripError) {
          throw tripError;
        }

        if (cancelled) return;

        setTrip(tripData);

        // ================================
        // GET MEMBERS
        // ================================

        const {
          data: memberData,
          error: memberError,
        } = await supabase
          .from("trip_members")
          .select("*")
          .eq("trip_id", tripId)
          .order("joined_at", {
            ascending: true,
          });

        if (memberError) {
          console.error(
            "Member loading error:",
            memberError
          );
        }

        if (cancelled) return;

        setMembers(memberData || []);

        // ================================
        // GET EXPENSES
        // ================================

        const {
          data: expenseData,
          error: expenseError,
        } = await supabase
          .from("expenses")
          .select("*")
          .eq("trip_id", tripId)
          .order("created_at", {
            ascending: false,
          });

        if (expenseError) {
          console.error(
            "Expense loading error:",
            expenseError
          );
        }

        if (cancelled) return;

        setExpenses(expenseData || []);

      } catch (err) {
        console.error(
          "Trip loading error:",
          err
        );

        if (!cancelled) {
          setError(
            err.message ||
            "Unable to load this trip."
          );
        }

      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchTrip();

    return () => {
      cancelled = true;
    };
  }, [tripId]);


  // =========================================
  // FORMAT MONEY
  // =========================================

  const formatMoney = (amount) => {
    return Number(amount || 0).toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }
    );
  };


  // =========================================
  // LOADING SCREEN
  // =========================================

  if (loading) {
    return (
      <div
        className="travel-dashboard"
        style={{
          backgroundImage:
            `url(${landingPage})`,
        }}
      >

        <div className="dashboard-overlay"></div>

        <div className="dashboard-content">

          <nav className="dashboard-nav">

            <Link
              to="/dashboard"
              className="dashboard-logo"
            >
              Your Trip Expense
            </Link>

            <div className="dashboard-nav-right">

              <span className="dashboard-nav-label">
                TRIP DETAILS
              </span>

              <Link to="/dashboard">

                <button className="dashboard-home-btn">
                  Dashboard
                </button>

              </Link>

            </div>

          </nav>


          <div className="dashboard-loading">

            <div className="dashboard-spinner">
              ↻
            </div>

            <p>
              Loading your trip...
            </p>

          </div>

        </div>

      </div>
    );
  }


  // =========================================
  // ERROR SCREEN
  // =========================================

  if (error) {
    return (
      <div
        className="travel-dashboard"
        style={{
          backgroundImage:
            `url(${landingPage})`,
        }}
      >

        <div className="dashboard-overlay"></div>

        <div className="dashboard-content">

          <nav className="dashboard-nav">

            <Link
              to="/dashboard"
              className="dashboard-logo"
            >
              Your Trip Expense
            </Link>

            <Link to="/dashboard">

              <button className="dashboard-home-btn">
                Dashboard
              </button>

            </Link>

          </nav>


          <section className="dashboard-empty glass-card">

            <div className="empty-trip-icon">
              ⚠️
            </div>

            <h2>
              Unable to load trip
            </h2>

            <p>
              {error}
            </p>

            <Link to="/dashboard">

              <button className="dashboard-create-btn">
                ← Back to Dashboard
              </button>

            </Link>

          </section>

        </div>

      </div>
    );
  }


  // =========================================
  // SAFETY CHECK
  // =========================================

  if (!trip) {
    return (
      <div
        className="travel-dashboard"
        style={{
          backgroundImage:
            `url(${landingPage})`,
        }}
      >

        <div className="dashboard-overlay"></div>

        <div className="dashboard-content">

          <nav className="dashboard-nav">

            <Link
              to="/dashboard"
              className="dashboard-logo"
            >
              Your Trip Expense
            </Link>

            <Link to="/dashboard">

              <button className="dashboard-home-btn">
                Dashboard
              </button>

            </Link>

          </nav>


          <section className="dashboard-empty glass-card">

            <div className="empty-trip-icon">
              🔍
            </div>

            <h2>
              Trip not found
            </h2>

            <p>
              This trip could not be found.
            </p>

            <Link to="/dashboard">

              <button className="dashboard-create-btn">
                ← Back to Dashboard
              </button>

            </Link>

          </section>

        </div>

      </div>
    );
  }


  // =========================================
  // CALCULATE TOTALS
  // =========================================

  const budget = Number(
    trip.budget || 0
  );

  const spent = expenses.reduce(
    (total, expense) =>
      total + Number(expense.amount || 0),
    0
  );

  const remaining =
    budget - spent;

  const percentage =
    budget > 0
      ? Math.min(
          (spent / budget) * 100,
          100
        )
      : 0;

  const overBudget =
    remaining < 0;


  // =========================================
  // MAIN PAGE
  // =========================================

  return (
    <div
      className="travel-dashboard"
      style={{
        backgroundImage:
          `url(${landingPage})`,
      }}
    >

      {/* DARK BACKGROUND */}

      <div className="dashboard-overlay"></div>


      {/* PAGE CONTENT */}

      <div className="dashboard-content">


        {/* ===================================
            NAVBAR
        =================================== */}

        <nav className="dashboard-nav">

          <Link
            to="/dashboard"
            className="dashboard-logo"
          >
            Your Trip Expense
          </Link>


          <div className="dashboard-nav-right">

            <span className="dashboard-nav-label">
              TRIP DETAILS
            </span>

            <Link to="/dashboard">

              <button className="dashboard-home-btn">
                Dashboard
              </button>

            </Link>

          </div>

        </nav>


        {/* ===================================
            TRIP HEADER
        =================================== */}

        <section className="dashboard-hero">

          <div>

            <p className="dashboard-eyebrow">
              YOUR JOURNEY • YOUR MONEY
            </p>

            <h1>

              {trip.name}

              <br />

              <span>
                {trip.destination}
              </span>

            </h1>

            <p className="dashboard-description">

              📅 {trip.start_date}

              {"  →  "}

              {trip.end_date}

            </p>

          </div>


          <div className="dashboard-main-actions">

            <Link to="/dashboard">

              <button className="dashboard-refresh-btn">
                ← Back to Dashboard
              </button>

            </Link>

          </div>

        </section>


        {/* ===================================
            TRIP OVERVIEW
        =================================== */}

        <section className="dashboard-trips">

          <div className="dashboard-section-title">

            <div>

              <p>
                TRIP OVERVIEW
              </p>

              <h2>
                Your Trip
              </h2>

            </div>

            <span>
              {members.length}{" "}
              {members.length === 1
                ? "Member"
                : "Members"}
            </span>

          </div>


          <div className="travel-trip-grid">


            {/* ===============================
                BUDGET CARD
            =============================== */}

            <article className="travel-trip-card">

              <div className="travel-card-header">

                <div>

                  <span className="trip-small-label">
                    TRIP BUDGET
                  </span>

                  <h3>
                    ₹{formatMoney(budget)}
                  </h3>

                  <p>
                    Total budget
                  </p>

                </div>

                <div className="travel-card-icon">
                  💰
                </div>

              </div>


              <div className="travel-money-grid">

                <div>

                  <span>
                    SPENT
                  </span>

                  <strong>
                    ₹{formatMoney(spent)}
                  </strong>

                </div>


                <div>

                  <span>
                    REMAINING
                  </span>

                  <strong>
                    ₹{formatMoney(
                      Math.abs(remaining)
                    )}
                  </strong>

                </div>

              </div>


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
                    ₹{formatMoney(
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

            </article>


            {/* ===============================
                MEMBERS CARD
            =============================== */}

            <article className="travel-trip-card">

              <div className="travel-card-header">

                <div>

                  <span className="trip-small-label">
                    MEMBERS
                  </span>

                  <h3>
                    {members.length}
                  </h3>

                  <p>
                    People in this trip
                  </p>

                </div>

                <div className="travel-card-icon">
                  👥
                </div>

              </div>


              <div
                style={{
                  marginTop: "20px",
                }}
              >

                {members.length === 0 ? (

                  <p>
                    No members added yet.
                  </p>

                ) : (

                  members.map((member) => (

                    <div
                      key={member.id}
                      style={{
                        padding:
                          "11px 12px",
                        marginBottom:
                          "8px",
                        borderRadius:
                          "10px",
                        background:
                          "rgba(255,255,255,0.06)",
                        color:
                          "#dbeafe",
                      }}
                    >

                      👤{" "}
                      {member.member_name}

                    </div>

                  ))

                )}

              </div>

            </article>


            {/* ===============================
                EXPENSE SUMMARY
            =============================== */}

            <article className="travel-trip-card">

              <div className="travel-card-header">

                <div>

                  <span className="trip-small-label">
                    EXPENSES
                  </span>

                  <h3>
                    {expenses.length}
                  </h3>

                  <p>
                    Recorded expenses
                  </p>

                </div>

                <div className="travel-card-icon">
                  💸
                </div>

              </div>


              <div className="travel-money-grid">

                <div>

                  <span>
                    TOTAL SPENT
                  </span>

                  <strong>
                    ₹{formatMoney(spent)}
                  </strong>

                </div>


                <div>

                  <span>
                    AVERAGE
                  </span>

                  <strong>
                    ₹
                    {formatMoney(
                      expenses.length
                        ? spent /
                          expenses.length
                        : 0
                    )}
                  </strong>

                </div>

              </div>

            </article>

          </div>

        </section>


        {/* ===================================
            EXPENSES
        =================================== */}

        <section className="dashboard-trips">

          <div className="dashboard-section-title">

            <div>

              <p>
                MONEY TRACKER
              </p>

              <h2>
                Trip Expenses
              </h2>

            </div>

            <span>
              {expenses.length}{" "}
              {expenses.length === 1
                ? "Expense"
                : "Expenses"}
            </span>

          </div>


          {expenses.length === 0 ? (

            <section className="dashboard-empty glass-card">

              <div className="empty-trip-icon">
                💸
              </div>

              <h2>
                No expenses yet
              </h2>

              <p>
                Expenses added to this trip
                will appear here.
              </p>

            </section>

          ) : (

            <div className="travel-trip-grid">

              {expenses.map((expense) => (

                <article
                  className="travel-trip-card"
                  key={expense.id}
                >

                  <div className="travel-card-header">

                    <div>

                      <span className="trip-small-label">

                        {expense.category ||
                          "OTHER"}

                      </span>

                      <h3>

                        {expense.description ||
                          expense.location ||
                          "Trip Expense"}

                      </h3>

                      {expense.location && (

                        <p>
                          📍{" "}
                          {expense.location}
                        </p>

                      )}

                    </div>

                    <div className="travel-card-icon">
                      💸
                    </div>

                  </div>


                  <div className="travel-money-grid">

                    <div>

                      <span>
                        AMOUNT
                      </span>

                      <strong>
                        ₹
                        {formatMoney(
                          expense.amount
                        )}
                      </strong>

                    </div>


                    <div>

                      <span>
                        PAID BY
                      </span>

                      <strong>
                        {expense.paid_by ||
                          "-"}
                      </strong>

                    </div>

                  </div>


                  {expense.transport_type && (

                    <div className="travel-date">

                      🚗{" "}
                      {expense.transport_type}

                    </div>

                  )}


                  <div className="travel-date">

                    👥 Split:{" "}
                    {expense.split_type ||
                      "equal"}

                  </div>


                  {expense.note && (

                    <div className="travel-date">

                      📝{" "}
                      {expense.note}

                    </div>

                  )}

                </article>

              ))}

            </div>

          )}

        </section>


        {/* ===================================
            BACK BUTTON
        =================================== */}

        <div
          style={{
            marginTop: "45px",
            textAlign: "center",
          }}
        >

          <Link to="/dashboard">

            <button className="dashboard-refresh-btn">
              ← Back to Dashboard
            </button>

          </Link>

        </div>

      </div>

    </div>
  );
}

export default TripDetails;