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
  // EXPENSE FORM
  // =========================================

  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("Food");
  const [transportType, setTransportType] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [sharedWith, setSharedWith] = useState([]);
  const [splitType, setSplitType] = useState("equal");
  const [note, setNote] = useState("");

  const [savingExpense, setSavingExpense] = useState(false);

  // =========================================
  // LOAD TRIP
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

        // MEMBERS
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

        // EXPENSES
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

        // LOAD SPLITS
        const expenseIds =
          (expenseData || []).map(
            (expense) => expense.id
          );

        let splitData = [];

        if (expenseIds.length > 0) {
          const {
            data,
            error: splitError,
          } = await supabase
            .from("expense_splits")
            .select("*")
            .in("expense_id", expenseIds);

          if (splitError) {
            console.error(
              "Split loading error:",
              splitError
            );
          }

          splitData = data || [];
        }

        if (cancelled) return;

        const expensesWithSplits =
          (expenseData || []).map(
            (expense) => ({
              ...expense,
              splits: splitData.filter(
                (split) =>
                  split.expense_id === expense.id
              ),
            })
          );

        setExpenses(expensesWithSplits);
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
  // REFRESH EXPENSES
  // =========================================

  const refreshExpenses = async () => {
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
      console.error(expenseError);
      return;
    }

    const expenseIds =
      (expenseData || []).map(
        (expense) => expense.id
      );

    let splitData = [];

    if (expenseIds.length > 0) {
      const {
        data,
        error: splitError,
      } = await supabase
        .from("expense_splits")
        .select("*")
        .in("expense_id", expenseIds);

      if (splitError) {
        console.error(splitError);
      }

      splitData = data || [];
    }

    const expensesWithSplits =
      (expenseData || []).map(
        (expense) => ({
          ...expense,
          splits: splitData.filter(
            (split) =>
              split.expense_id === expense.id
          ),
        })
      );

    setExpenses(expensesWithSplits);
  };

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
  // RESET FORM
  // =========================================

  const resetForm = () => {
    setDescription("");
    setLocation("");
    setCategory("Food");
    setTransportType("");
    setAmount("");
    setPaidBy("");
    setSharedWith([]);
    setSplitType("equal");
    setNote("");
    setEditingExpense(null);
  };

  // =========================================
  // OPEN ADD FORM
  // =========================================

  const openAddExpense = () => {
    resetForm();

    if (members.length > 0) {
      setPaidBy(members[0].member_name);
      setSharedWith(
        members.map(
          (member) => member.member_name
        )
      );
    }

    setShowExpenseForm(true);
  };

  // =========================================
  // OPEN EDIT FORM
  // =========================================

  const openEditExpense = (expense) => {
    setEditingExpense(expense);

    setDescription(
      expense.description || ""
    );

    setLocation(
      expense.location || ""
    );

    setCategory(
      expense.category || "Food"
    );

    setTransportType(
      expense.transport_type || ""
    );

    setAmount(
      expense.amount || ""
    );

    setPaidBy(
      expense.paid_by || ""
    );

    setSplitType(
      expense.split_type || "equal"
    );

    setNote(
      expense.note || ""
    );

    setSharedWith(
      (expense.splits || []).map(
        (split) => split.member_name
      )
    );

    setShowExpenseForm(true);
  };

  // =========================================
  // TOGGLE MEMBER
  // =========================================

  const toggleSharedMember = (memberName) => {
    setSharedWith((current) => {
      if (current.includes(memberName)) {
        return current.filter(
          (name) => name !== memberName
        );
      }

      return [...current, memberName];
    });
  };

  // =========================================
  // SAVE EXPENSE
  // =========================================

  const saveExpense = async (event) => {
    event.preventDefault();

    if (!amount || Number(amount) <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    if (!paidBy) {
      alert("Please select who paid.");
      return;
    }

    if (sharedWith.length === 0) {
      alert(
        "Please select at least one member under Shared With."
      );
      return;
    }

    setSavingExpense(true);

    try {
      const expenseData = {
        trip_id: tripId,
        description:
          description.trim() || null,
        location:
          location.trim() || null,
        category,
        transport_type:
          category === "Transport"
            ? transportType || null
            : null,
        amount: Number(amount),
        paid_by: paidBy,
        split_type: splitType,
        note: note.trim() || null,
      };

      let expenseId;

      // =====================================
      // EDIT
      // =====================================

      if (editingExpense) {
        const {
          error: updateError,
        } = await supabase
          .from("expenses")
          .update(expenseData)
          .eq("id", editingExpense.id);

        if (updateError) {
          throw updateError;
        }

        expenseId = editingExpense.id;

        await supabase
          .from("expense_splits")
          .delete()
          .eq(
            "expense_id",
            editingExpense.id
          );
      }

      // =====================================
      // ADD
      // =====================================

      else {
        const {
          data: newExpense,
          error: insertError,
        } = await supabase
          .from("expenses")
          .insert(expenseData)
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }

        expenseId = newExpense.id;
      }

      // =====================================
      // CALCULATE SPLIT
      // =====================================

      const totalAmount = Number(amount);

      const equalShare =
        totalAmount / sharedWith.length;

      const splitRows =
        sharedWith.map((memberName) => ({
          expense_id: expenseId,
          member_name: memberName,
          amount:
            splitType === "equal"
              ? equalShare
              : equalShare,
          percentage:
            splitType === "equal"
              ? 100 / sharedWith.length
              : 100 / sharedWith.length,
        }));

      const {
        error: splitInsertError,
      } = await supabase
        .from("expense_splits")
        .insert(splitRows);

      if (splitInsertError) {
        throw splitInsertError;
      }

      await refreshExpenses();

      resetForm();
      setShowExpenseForm(false);

      alert(
        editingExpense
          ? "Expense updated successfully!"
          : "Expense added successfully!"
      );
    } catch (err) {
      console.error(
        "Saving expense error:",
        err
      );

      alert(
        err.message ||
          "Unable to save expense."
      );
    } finally {
      setSavingExpense(false);
    }
  };

  // =========================================
  // DELETE EXPENSE
  // =========================================

  const deleteExpense = async (expenseId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this expense?"
    );

    if (!confirmed) return;

    try {
      const {
        error: deleteError,
      } = await supabase
        .from("expenses")
        .delete()
        .eq("id", expenseId);

      if (deleteError) {
        throw deleteError;
      }

      await refreshExpenses();

      alert("Expense deleted.");
    } catch (err) {
      console.error(err);

      alert(
        err.message ||
          "Unable to delete expense."
      );
    }
  };

  // =========================================
  // LOADING
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

            <Link to="/dashboard">
              <button className="dashboard-home-btn">
                Dashboard
              </button>
            </Link>

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
  // ERROR
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

  if (!trip) {
    return null;
  }

  // =========================================
  // TOTALS
  // =========================================

  const budget = Number(
    trip.budget || 0
  );

  const spent = expenses.reduce(
    (total, expense) =>
      total +
      Number(expense.amount || 0),
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

      <div className="dashboard-overlay"></div>

      <div className="dashboard-content">

        {/* NAVBAR */}

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


        {/* TRIP HEADER */}

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
              {" → "}
              {trip.end_date}

            </p>

          </div>

          <div className="dashboard-main-actions">

            <button
              className="dashboard-create-btn"
              onClick={openAddExpense}
            >
              + Add Expense
            </button>

            <Link to="/dashboard">

              <button className="dashboard-refresh-btn">
                ← Dashboard
              </button>

            </Link>

          </div>

        </section>


        {/* OVERVIEW */}

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

            {/* BUDGET */}

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


            {/* MEMBERS */}

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

              <div style={{ marginTop: "20px" }}>

                {members.length === 0 ? (

                  <p>
                    No members added yet.
                  </p>

                ) : (

                  members.map((member) => (

                    <div
                      key={member.id}
                      style={{
                        padding: "11px 12px",
                        marginBottom: "8px",
                        borderRadius: "10px",
                        background:
                          "rgba(255,255,255,0.06)",
                        color: "#dbeafe",
                      }}
                    >
                      👤 {member.member_name}
                    </div>

                  ))

                )}

              </div>

            </article>


            {/* EXPENSE SUMMARY */}

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
            ADD / EDIT EXPENSE FORM
        =================================== */}

        {showExpenseForm && (

          <section
            className="travel-trip-card"
            style={{
              marginTop: "35px",
            }}
          >

            <div
              className="dashboard-section-title"
              style={{
                marginBottom: "25px",
              }}
            >

              <div>

                <p>
                  MONEY TRACKER
                </p>

                <h2>
                  {editingExpense
                    ? "Edit Expense"
                    : "Add Expense"}
                </h2>

              </div>

            </div>


            <form onSubmit={saveExpense}>

              {/* DESCRIPTION */}

              <div style={fieldStyle}>

                <label style={labelStyle}>
                  What was the expense?
                </label>

                <input
                  type="text"
                  placeholder="e.g. Dinner at hotel"
                  value={description}
                  onChange={(e) =>
                    setDescription(
                      e.target.value
                    )
                  }
                  style={inputStyle}
                />

              </div>


              {/* LOCATION */}

              <div style={fieldStyle}>

                <label style={labelStyle}>
                  Where?
                </label>

                <input
                  type="text"
                  placeholder="e.g. Puri Beach"
                  value={location}
                  onChange={(e) =>
                    setLocation(
                      e.target.value
                    )
                  }
                  style={inputStyle}
                />

              </div>


              {/* CATEGORY */}

              <div style={fieldStyle}>

                <label style={labelStyle}>
                  Category
                </label>

                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(
                      e.target.value
                    );

                    if (
                      e.target.value !==
                      "Transport"
                    ) {
                      setTransportType("");
                    }
                  }}
                  style={inputStyle}
                >

                  <option value="Food">
                    Food
                  </option>

                  <option value="Transport">
                    Transport
                  </option>

                  <option value="Hotel / Stay">
                    Hotel / Stay
                  </option>

                  <option value="Activities">
                    Activities
                  </option>

                  <option value="Shopping">
                    Shopping
                  </option>

                  <option value="Personal">
                    Personal
                  </option>

                  <option value="Medical">
                    Medical
                  </option>

                  <option value="Other">
                    Other
                  </option>

                </select>

              </div>


              {/* TRANSPORT */}

              {category === "Transport" && (

                <div style={fieldStyle}>

                  <label style={labelStyle}>
                    Transport Type
                  </label>

                  <select
                    value={transportType}
                    onChange={(e) =>
                      setTransportType(
                        e.target.value
                      )
                    }
                    style={inputStyle}
                  >

                    <option value="">
                      Select transport
                    </option>

                    <option value="Train">
                      Train
                    </option>

                    <option value="Bus">
                      Bus
                    </option>

                    <option value="Taxi/Cab">
                      Taxi/Cab
                    </option>

                    <option value="Car">
                      Car
                    </option>

                    <option value="Scooty">
                      Scooty
                    </option>

                    <option value="Bike">
                      Bike
                    </option>

                    <option value="Flight">
                      Flight
                    </option>

                    <option value="Ship/Ferry">
                      Ship/Ferry
                    </option>

                    <option value="Auto">
                      Auto
                    </option>

                    <option value="Metro">
                      Metro
                    </option>

                    <option value="Bicycle">
                      Bicycle
                    </option>

                    <option value="Other">
                      Other
                    </option>

                  </select>

                </div>

              )}


              {/* AMOUNT */}

              <div style={fieldStyle}>

                <label style={labelStyle}>
                  Amount (₹)
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="1000"
                  value={amount}
                  onChange={(e) =>
                    setAmount(
                      e.target.value
                    )
                  }
                  style={inputStyle}
                />

              </div>


              {/* PAID BY */}

              <div style={fieldStyle}>

                <label style={labelStyle}>
                  Paid by
                </label>

                <select
                  value={paidBy}
                  onChange={(e) =>
                    setPaidBy(
                      e.target.value
                    )
                  }
                  style={inputStyle}
                >

                  <option value="">
                    Select member
                  </option>

                  {members.map(
                    (member) => (

                      <option
                        key={member.id}
                        value={
                          member.member_name
                        }
                      >
                        {
                          member.member_name
                        }
                      </option>

                    )
                  )}

                </select>

              </div>


              {/* SPLIT TYPE */}

              <div style={fieldStyle}>

                <label style={labelStyle}>
                  Split type
                </label>

                <select
                  value={splitType}
                  onChange={(e) =>
                    setSplitType(
                      e.target.value
                    )
                  }
                  style={inputStyle}
                >

                  <option value="equal">
                    Equal
                  </option>

                  <option value="custom">
                    Custom
                  </option>

                  <option value="percentage">
                    Percentage
                  </option>

                </select>

                {splitType !== "equal" && (

                  <p
                    style={{
                      color: "#fbbf24",
                      fontSize: "12px",
                      marginTop: "8px",
                    }}
                  >
                    Currently this version
                    uses equal amounts.
                    Custom and percentage
                    editing can be added next.
                  </p>

                )}

              </div>


              {/* SHARED WITH */}

              <div style={fieldStyle}>

                <label style={labelStyle}>
                  Shared with
                </label>

                <p
                  style={{
                    color: "#94a3b8",
                    fontSize: "12px",
                    marginBottom: "10px",
                  }}
                >
                  Select the people who should
                  share this expense.
                </p>


                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: "10px",
                  }}
                >

                  {members.map(
                    (member) => {

                      const selected =
                        sharedWith.includes(
                          member.member_name
                        );

                      return (

                        <button
                          type="button"
                          key={member.id}
                          onClick={() =>
                            toggleSharedMember(
                              member.member_name
                            )
                          }
                          style={{
                            padding:
                              "12px 14px",
                            borderRadius:
                              "10px",
                            border:
                              selected
                                ? "1px solid #60a5fa"
                                : "1px solid rgba(255,255,255,0.15)",
                            background:
                              selected
                                ? "rgba(37,99,235,0.25)"
                                : "rgba(255,255,255,0.05)",
                            color:
                              selected
                                ? "white"
                                : "#cbd5e1",
                            cursor: "pointer",
                            textAlign:
                              "left",
                          }}
                        >

                          {selected
                            ? "☑"
                            : "☐"}{" "}
                          {
                            member.member_name
                          }

                        </button>

                      );
                    }
                  )}

                </div>


                {amount &&
                  sharedWith.length > 0 && (

                    <div
                      style={{
                        marginTop: "15px",
                        padding: "15px",
                        borderRadius: "12px",
                        background:
                          "rgba(34,197,94,0.10)",
                        border:
                          "1px solid rgba(34,197,94,0.2)",
                      }}
                    >

                      <span
                        style={{
                          color:
                            "#94a3b8",
                          fontSize: "11px",
                        }}
                      >
                        EACH PERSON PAYS
                      </span>

                      <strong
                        style={{
                          display:
                            "block",
                          color:
                            "#86efac",
                          fontSize:
                            "24px",
                          marginTop:
                            "4px",
                        }}
                      >
                        ₹
                        {formatMoney(
                          Number(amount) /
                            sharedWith.length
                        )}
                      </strong>

                      <small
                        style={{
                          color:
                            "#cbd5e1",
                        }}
                      >
                        ₹
                        {formatMoney(
                          Number(amount)
                        )}{" "}
                        ÷{" "}
                        {sharedWith.length}{" "}
                        member
                        {sharedWith.length !==
                        1
                          ? "s"
                          : ""}
                      </small>

                    </div>

                  )}

              </div>


              {/* NOTE */}

              <div style={fieldStyle}>

                <label style={labelStyle}>
                  Note
                </label>

                <textarea
                  placeholder="Optional note"
                  value={note}
                  onChange={(e) =>
                    setNote(
                      e.target.value
                    )
                  }
                  rows="3"
                  style={{
                    ...inputStyle,
                    resize: "vertical",
                  }}
                />

              </div>


              {/* FORM BUTTONS */}

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  marginTop: "20px",
                  flexWrap: "wrap",
                }}
              >

                <button
                  type="submit"
                  className="dashboard-create-btn"
                  disabled={savingExpense}
                >
                  {savingExpense
                    ? "Saving..."
                    : editingExpense
                    ? "Update Expense"
                    : "Add Expense"}
                </button>


                <button
                  type="button"
                  className="dashboard-refresh-btn"
                  onClick={() => {
                    resetForm();
                    setShowExpenseForm(
                      false
                    );
                  }}
                >
                  Cancel
                </button>

              </div>

            </form>

          </section>

        )}


        {/* ===================================
            EXPENSES
        =================================== */}

        <section
          className="dashboard-trips"
          style={{
            marginTop: "40px",
          }}
        >

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
                Click "Add Expense" to record
                your first trip expense.
              </p>

              <button
                className="dashboard-create-btn"
                onClick={openAddExpense}
              >
                + Add Expense
              </button>

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


                  {/* SPLIT DETAILS */}

                  {expense.splits &&
                    expense.splits.length >
                      0 && (

                      <div
                        style={{
                          marginTop: "15px",
                          paddingTop: "15px",
                          borderTop:
                            "1px solid rgba(255,255,255,0.1)",
                        }}
                      >

                        <span
                          style={{
                            color:
                              "#94a3b8",
                            fontSize:
                              "10px",
                            fontWeight:
                              "800",
                            letterSpacing:
                              "1px",
                          }}
                        >
                          SHARED WITH
                        </span>


                        {expense.splits.map(
                          (split) => (

                            <div
                              key={split.id}
                              style={{
                                display:
                                  "flex",
                                justifyContent:
                                  "space-between",
                                padding:
                                  "8px 0",
                                color:
                                  "#dbeafe",
                                fontSize:
                                  "13px",
                              }}
                            >

                              <span>
                                👤{" "}
                                {
                                  split.member_name
                                }
                              </span>

                              <strong>
                                ₹
                                {formatMoney(
                                  split.amount
                                )}
                              </strong>

                            </div>

                          )
                        )}

                      </div>

                    )}


                  {expense.note && (

                    <div className="travel-date">

                      📝{" "}
                      {expense.note}

                    </div>

                  )}


                  {/* EDIT DELETE */}

                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      marginTop: "18px",
                    }}
                  >

                    <button
                      type="button"
                      onClick={() =>
                        openEditExpense(
                          expense
                        )
                      }
                      className="dashboard-refresh-btn"
                      style={{
                        flex: 1,
                      }}
                    >
                      ✏️ Edit
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        deleteExpense(
                          expense.id
                        )
                      }
                      style={{
                        flex: 1,
                        padding: "10px 15px",
                        borderRadius: "9px",
                        border:
                          "1px solid rgba(239,68,68,0.4)",
                        background:
                          "rgba(239,68,68,0.12)",
                        color: "#fca5a5",
                        fontWeight: "700",
                        cursor: "pointer",
                      }}
                    >
                      🗑 Delete
                    </button>

                  </div>

                </article>

              ))}

            </div>

          )}

        </section>


        {/* BACK */}

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


// =========================================
// FORM STYLES
// =========================================

const fieldStyle = {
  marginBottom: "18px",
};

const labelStyle = {
  display: "block",
  marginBottom: "8px",
  color: "#dbeafe",
  fontSize: "13px",
  fontWeight: "700",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "13px 14px",
  borderRadius: "10px",
  border:
    "1px solid rgba(255,255,255,0.18)",
  background:
    "rgba(255,255,255,0.07)",
  color: "white",
  outline: "none",
  fontSize: "14px",
};

export default TripDetails;