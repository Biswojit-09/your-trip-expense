import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import landingPage from "../assets/Landing-page.png";

function TripDetails() {
  const { tripId } = useParams();

  // =========================================
  // MAIN DATA
  // =========================================

  const [trip, setTrip] = useState(null);
  const [members, setMembers] = useState([]);
  
  const [expenses, setExpenses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");

  // =========================================
  // MEMBER FORM
  // =========================================

  const [showMemberForm, setShowMemberForm] = useState(false);
  const [memberName, setMemberName] = useState("");
  const [savingMember, setSavingMember] = useState(false);

  // =========================================
  // EXPENSE FORM
  // =========================================

  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [savingExpense, setSavingExpense] = useState(false);

  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("Food");
  const [transportType, setTransportType] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [sharedWith, setSharedWith] = useState([]);
  const [splitType, setSplitType] = useState("equal");
  const [note, setNote] = useState("");

  // Custom amount for each member
  const [customAmounts, setCustomAmounts] = useState({});

  // Percentage for each member
  const [customPercentages, setCustomPercentages] =
    useState({});

  // =========================================
  // HELPERS
  // =========================================

  const showSuccess = (message) => {
    setActionMessage(message);
    setActionError("");

    setTimeout(() => {
      setActionMessage("");
    }, 3000);
  };

  const showError = (message) => {
    setActionError(message);
    setActionMessage("");

    setTimeout(() => {
      setActionError("");
    }, 5000);
  };

  const formatMoney = (value) => {
    return Number(value || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  const roundMoney = (value) => {
    return Math.round(Number(value) * 100) / 100;
  };

  // =========================================
  // LOAD TRIP
  // =========================================

  const loadTrip = async () => {
    if (!tripId) {
      setError("Trip ID is missing.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      // TRIP
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
        throw memberError;
      }

      setMembers(memberData || []);

      // EXPENSES
      await loadExpenses();
    } catch (err) {
      console.error("Trip loading error:", err);

      setError(
        err.message || "Unable to load this trip."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // LOAD EXPENSES
  // =========================================

  const loadExpenses = async () => {
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
      throw expenseError;
    }

    const expenseIds = (expenseData || []).map(
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
        throw splitError;
      }

      splitData = data || [];
    }

    const expensesWithSplits =
      (expenseData || []).map((expense) => ({
        ...expense,
        splits: splitData.filter(
          (split) =>
            split.expense_id === expense.id
        ),
      }));

    setExpenses(expensesWithSplits);
  };

  // =========================================
  // INITIAL LOAD
  // =========================================

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!cancelled) {
        await loadTrip();
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [tripId]);

  // =========================================
  // MEMBER MANAGEMENT
  // =========================================
// =========================================
// MEMBER MANAGEMENT
// =========================================

const openMemberForm = () => {
  setMemberName("");
  setShowMemberForm(true);
};

const closeMemberForm = () => {
  setMemberName("");
  setShowMemberForm(false);
};

const addMember = async (event) => {
  event.preventDefault();

  const cleanName = memberName.trim();

  if (!cleanName) {
    showError("Please enter the member name.");
    return;
  }

  if (cleanName.length < 2) {
    showError(
      "Member name must contain at least 2 characters."
    );
    return;
  }

  const alreadyExists = members.some(
    (member) =>
      member.member_name.trim().toLowerCase() ===
      cleanName.toLowerCase()
  );

  if (alreadyExists) {
    showError(
      "This member is already in the trip."
    );
    return;
  }

  setSavingMember(true);

  try {
    const { data, error: insertError } =
      await supabase
        .from("trip_members")
        .insert({
          trip_id: tripId,
          member_name: cleanName,
        })
        .select()
        .single();

    if (insertError) {
      throw insertError;
    }

    setMembers((current) => [
      ...current,
      data,
    ]);

    closeMemberForm();

    showSuccess(
      `${cleanName} was added to the trip.`
    );
  } catch (err) {
    console.error(
      "Add member error:",
      err
    );

    showError(
      err.message ||
        "Unable to add member."
    );
  } finally {
    setSavingMember(false);
  }
};

const deleteMember = async (member) => {
  const removedMemberName =
    member.member_name;

  const usedInExpenses = expenses.some(
    (expense) =>
      expense.paid_by === removedMemberName ||
      (expense.splits || []).some(
        (split) =>
          split.member_name ===
          removedMemberName
      )
  );

  if (usedInExpenses) {
    showError(
      `${removedMemberName} cannot be deleted because this member is already used in an expense.`
    );
    return;
  }

  const confirmed = window.confirm(
    `Remove ${removedMemberName} from this trip?`
  );

  if (!confirmed) {
    return;
  }

  try {
    const { error: deleteError } =
      await supabase
        .from("trip_members")
        .delete()
        .eq("id", member.id)
        .eq("trip_id", tripId);

    if (deleteError) {
      throw deleteError;
    }

    setMembers((current) =>
      current.filter(
        (item) => item.id !== member.id
      )
    );

    showSuccess(
      `${removedMemberName} was removed.`
    );
  } catch (err) {
    console.error(
      "Delete member error:",
      err
    );

    showError(
      err.message ||
        "Unable to delete member."
    );
  }
};

  // =========================================
  // EXPENSE FORM
  // =========================================

  const resetExpenseForm = () => {
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
    setCustomAmounts({});
    setCustomPercentages({});
  };

  const openAddExpense = () => {
    resetExpenseForm();

    if (members.length > 0) {
      const names = members.map(
        (member) => member.member_name
      );

      setPaidBy(names[0]);
      setSharedWith(names);

      const equalPercentage =
        100 / names.length;

      const percentages = {};

      names.forEach((name) => {
        percentages[name] = roundMoney(
          equalPercentage
        );
      });

      setCustomPercentages(percentages);
    }

    setShowExpenseForm(true);
  };

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

    const selectedMembers =
      (expense.splits || []).map(
        (split) => split.member_name
      );

    setSharedWith(selectedMembers);

    const amounts = {};
    const percentages = {};

    (expense.splits || []).forEach(
      (split) => {
        amounts[split.member_name] =
          split.amount;

        percentages[split.member_name] =
          split.percentage || 0;
      }
    );

    setCustomAmounts(amounts);
    setCustomPercentages(percentages);

    setShowExpenseForm(true);
  };

  const closeExpenseForm = () => {
    resetExpenseForm();
    setShowExpenseForm(false);
  };

  // =========================================
  // SHARED MEMBERS
  // =========================================

  const toggleSharedMember = (name) => {
    setSharedWith((current) => {
      if (current.includes(name)) {
        return current.filter(
          (item) => item !== name
        );
      }

      return [...current, name];
    });
  };

  // =========================================
  // SPLIT CALCULATION
  // =========================================

  const calculateEqualSplits = (
    total,
    names
  ) => {
    if (!names.length) return [];

    const totalCents = Math.round(
      total * 100
    );

    const baseCents = Math.floor(
      totalCents / names.length
    );

    const remainder =
      totalCents -
      baseCents * names.length;

    return names.map(
      (name, index) => ({
        member_name: name,
        amount:
          (baseCents +
            (index < remainder ? 1 : 0)) /
          100,
        percentage:
          roundMoney(
            ((
              baseCents +
              (index < remainder ? 1 : 0)
            ) /
              totalCents) *
              100
          ),
      })
    );
  };

  const calculateCustomSplits = (
    names
  ) => {
    return names.map((name) => ({
      member_name: name,
      amount: roundMoney(
        Number(
          customAmounts[name] || 0
        )
      ),
      percentage: null,
    }));
  };

  const calculatePercentageSplits = (
    total,
    names
  ) => {
    return names.map((name) => {
      const percentage = Number(
        customPercentages[name] || 0
      );

      return {
        member_name: name,
        amount: roundMoney(
          (total * percentage) / 100
        ),
        percentage:
          roundMoney(percentage),
      };
    });
  };

  // =========================================
  // SAVE EXPENSE
  // =========================================

  const saveExpense = async (event) => {
    event.preventDefault();

    const totalAmount = roundMoney(amount);

    if (!description.trim() && !location.trim()) {
      showError(
        "Please enter an expense description or location."
      );
      return;
    }

    if (!totalAmount || totalAmount <= 0) {
      showError(
        "Please enter a valid expense amount."
      );
      return;
    }

    if (!paidBy) {
      showError(
        "Please select who paid."
      );
      return;
    }

    if (sharedWith.length === 0) {
      showError(
        "Please select at least one member."
      );
      return;
    }

    if (
      category === "Transport" &&
      !transportType
    ) {
      showError(
        "Please select the transport type."
      );
      return;
    }

    let splitRows = [];

    // EQUAL
    if (splitType === "equal") {
      splitRows = calculateEqualSplits(
        totalAmount,
        sharedWith
      );
    }

    // CUSTOM
    if (splitType === "custom") {
      splitRows =
        calculateCustomSplits(
          sharedWith
        );

      const customTotal = roundMoney(
        splitRows.reduce(
          (sum, item) =>
            sum + Number(item.amount),
          0
        )
      );

      if (
        Math.abs(
          customTotal - totalAmount
        ) > 0.01
      ) {
        showError(
          `Custom split must equal ₹${formatMoney(
            totalAmount
          )}. Current total: ₹${formatMoney(
            customTotal
          )}.`
        );
        return;
      }
    }

    // PERCENTAGE
    if (splitType === "percentage") {
      splitRows =
        calculatePercentageSplits(
          totalAmount,
          sharedWith
        );

      const percentageTotal =
        roundMoney(
          splitRows.reduce(
            (sum, item) =>
              sum +
              Number(
                item.percentage || 0
              ),
            0
          )
        );

      if (
        Math.abs(
          percentageTotal - 100
        ) > 0.01
      ) {
        showError(
          `Percentage split must equal 100%. Current total: ${percentageTotal}%.`
        );
        return;
      }
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
            ? transportType
            : null,
        amount: totalAmount,
        paid_by: paidBy,
        split_type: splitType,
        note:
          note.trim() || null,
      };

      let expenseId;

      // =====================================
      // UPDATE
      // =====================================

      if (editingExpense) {
        const {
          error: updateError,
        } = await supabase
          .from("expenses")
          .update(expenseData)
          .eq(
            "id",
            editingExpense.id
          )
          .eq("trip_id", tripId);

        if (updateError) {
          throw updateError;
        }

        expenseId =
          editingExpense.id;

        // Delete old splits first
        const {
          error: deleteSplitError,
        } = await supabase
          .from("expense_splits")
          .delete()
          .eq(
            "expense_id",
            expenseId
          );

        if (deleteSplitError) {
          throw deleteSplitError;
        }
      }

      // =====================================
      // INSERT
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
      // INSERT SPLITS
      // =====================================

      const splitRowsForDatabase =
        splitRows.map((split) => ({
          expense_id: expenseId,
          member_name:
            split.member_name,
          amount:
            Number(split.amount),
          percentage:
            split.percentage === null
              ? null
              : Number(
                  split.percentage
                ),
        }));

      const {
        error: splitError,
      } = await supabase
        .from("expense_splits")
        .insert(
          splitRowsForDatabase
        );

      if (splitError) {
        throw splitError;
      }

      await loadExpenses();

      closeExpenseForm();

      showSuccess(
        editingExpense
          ? "Expense updated successfully."
          : "Expense added successfully."
      );
    } catch (err) {
      console.error(
        "Save expense error:",
        err
      );

      showError(
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

  const deleteExpense = async (
    expense
  ) => {
    const confirmed =
      window.confirm(
        `Delete "${expense.description || "this expense"}"?`
      );

    if (!confirmed) return;

    try {
      // Delete splits first.
      // This makes deletion work even if
      // database cascade settings are different.
      const {
        error: splitDeleteError,
      } = await supabase
        .from("expense_splits")
        .delete()
        .eq(
          "expense_id",
          expense.id
        );

      if (splitDeleteError) {
        throw splitDeleteError;
      }

      // Delete expense
      const {
        error: expenseDeleteError,
      } = await supabase
        .from("expenses")
        .delete()
        .eq("id", expense.id)
        .eq("trip_id", tripId);

      if (expenseDeleteError) {
        throw expenseDeleteError;
      }

      setExpenses((current) =>
        current.filter(
          (item) =>
            item.id !== expense.id
        )
      );

      if (
        editingExpense?.id ===
        expense.id
      ) {
        closeExpenseForm();
      }

      showSuccess(
        "Expense deleted successfully."
      );
    } catch (err) {
      console.error(
        "Delete expense error:",
        err
      );

      showError(
        err.message ||
          "Unable to delete expense. Check your Supabase DELETE policies."
      );
    }
  };

  // =========================================
  // LOADING
  // =========================================

  if (loading) {
    return (
      <TripShell>
        <div className="dashboard-loading">
          <div className="dashboard-spinner">
            ↻
          </div>

          <p>
            Loading your trip...
          </p>
        </div>
      </TripShell>
    );
  }

  // =========================================
  // ERROR
  // =========================================

  if (error || !trip) {
    return (
      <TripShell>
        <section className="dashboard-empty glass-card">
          <div className="empty-trip-icon">
            ⚠️
          </div>

          <h2>
            Unable to load trip
          </h2>

          <p>
            {error ||
              "Trip not found."}
          </p>

          <Link to="/dashboard">
            <button className="dashboard-create-btn">
              ← Back to Dashboard
            </button>
          </Link>
        </section>
      </TripShell>
    );
  }

  // =========================================
  // TOTALS
  // =========================================

  const budget = Number(
    trip.budget || 0
  );

  const spent = expenses.reduce(
    (sum, expense) =>
      sum +
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
  // MAIN
  // =========================================

  return (
    <TripShell>

      {/* =====================================
          NAVBAR
      ===================================== */}

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

      {/* =====================================
          ALERTS
      ===================================== */}

      {(actionMessage ||
        actionError) && (
        <div
          className={
            actionError
              ? "trip-alert error"
              : "trip-alert success"
          }
        >
          {actionError ||
            actionMessage}
        </div>
      )}

      {/* =====================================
          TRIP HEADER
      ===================================== */}

      <section className="dashboard-hero trip-details-hero">

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

          <button
            className="dashboard-refresh-btn"
            onClick={openMemberForm}
          >
            + Add Member
          </button>

        </div>

      </section>

      {/* =====================================
          OVERVIEW
      ===================================== */}

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

            <div className="member-list">

              {members.length === 0 ? (
                <div className="member-empty">
                  <p>
                    No members added yet.
                  </p>

                  <button
                    className="dashboard-create-btn"
                    onClick={openMemberForm}
                  >
                    + Add First Member
                  </button>
                </div>
              ) : (
                members.map((member) => (
                  <div
                    className="member-row"
                    key={member.id}
                  >
                    <div>
                      <span className="member-avatar">
                        {member.member_name
                          .charAt(0)
                          .toUpperCase()}
                      </span>

                      <span>
                        {member.member_name}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="member-delete-btn"
                      onClick={() =>
                        deleteMember(member)
                      }
                      title="Remove member"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}

            </div>

            {members.length > 0 && (
              <button
                className="member-add-link"
                onClick={openMemberForm}
              >
                + Add another member
              </button>
            )}

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

      {/* =====================================
          ADD MEMBER FORM
      ===================================== */}

      {showMemberForm && (
        <section className="trip-form-card">

          <div className="trip-form-header">

            <div>
              <p className="dashboard-eyebrow">
                TRIP MEMBERS
              </p>

              <h2>
                Add Member
              </h2>

              <p>
                Add a person using their name.
              </p>
            </div>

            <button
              className="trip-close-btn"
              onClick={closeMemberForm}
            >
              ×
            </button>

          </div>

          <form
            onSubmit={addMember}
            className="member-form"
          >

            <div className="form-field">
              <label>
                Member name
              </label>

              <input
                type="text"
                value={memberName}
                onChange={(e) =>
                  setMemberName(
                    e.target.value
                  )
                }
                placeholder="e.g. Rahul"
                autoFocus
              />
            </div>

            <div className="form-actions">

              <button
                type="submit"
                className="dashboard-create-btn"
                disabled={savingMember}
              >
                {savingMember
                  ? "Adding..."
                  : "Add Member"}
              </button>

              <button
                type="button"
                className="dashboard-refresh-btn"
                onClick={closeMemberForm}
              >
                Cancel
              </button>

            </div>

          </form>

        </section>
      )}

      {/* =====================================
          EXPENSE FORM
      ===================================== */}

      {showExpenseForm && (
        <section className="trip-form-card">

          <div className="trip-form-header">

            <div>
              <p className="dashboard-eyebrow">
                MONEY TRACKER
              </p>

              <h2>
                {editingExpense
                  ? "Edit Expense"
                  : "Add Expense"}
              </h2>

              <p>
                Record exactly who paid and
                how the expense is shared.
              </p>
            </div>

            <button
              className="trip-close-btn"
              onClick={closeExpenseForm}
            >
              ×
            </button>

          </div>

          {members.length === 0 ? (

            <div className="form-warning">
              <strong>
                Add members first
              </strong>

              <p>
                You need at least one trip
                member before adding an expense.
              </p>

              <button
                className="dashboard-create-btn"
                onClick={() => {
                  closeExpenseForm();
                  openMemberForm();
                }}
              >
                + Add Member
              </button>
            </div>

          ) : (

            <form
              onSubmit={saveExpense}
              className="expense-form"
            >

              {/* BASIC DETAILS */}

              <div className="form-grid">

                <div className="form-field">
                  <label>
                    What was the expense?
                  </label>

                  <input
                    type="text"
                    value={description}
                    onChange={(e) =>
                      setDescription(
                        e.target.value
                      )
                    }
                    placeholder="e.g. Dinner at hotel"
                  />
                </div>

                <div className="form-field">
                  <label>
                    Where?
                  </label>

                  <input
                    type="text"
                    value={location}
                    onChange={(e) =>
                      setLocation(
                        e.target.value
                      )
                    }
                    placeholder="e.g. Puri Beach"
                  />
                </div>

                <div className="form-field">
                  <label>
                    Category
                  </label>

                  <select
                    value={category}
                    onChange={(e) => {
                      const value =
                        e.target.value;

                      setCategory(value);

                      if (
                        value !==
                        "Transport"
                      ) {
                        setTransportType("");
                      }
                    }}
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

                <div className="form-field">
                  <label>
                    Amount (₹)
                  </label>

                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={(e) =>
                      setAmount(
                        e.target.value
                      )
                    }
                    placeholder="1000"
                  />
                </div>

                {category ===
                  "Transport" && (
                  <div className="form-field">
                    <label>
                      Transport type
                    </label>

                    <select
                      value={transportType}
                      onChange={(e) =>
                        setTransportType(
                          e.target.value
                        )
                      }
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

                <div className="form-field">
                  <label>
                    Paid by
                  </label>

                  <select
                    value={paidBy}
                    onChange={(e) =>
                      setPaidBy(
                        e.target.value
                      )
                    }
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

              </div>

              {/* SPLIT TYPE */}

              <div className="form-field">
                <label>
                  Split type
                </label>

                <select
                  value={splitType}
                  onChange={(e) =>
                    setSplitType(
                      e.target.value
                    )
                  }
                >
                  <option value="equal">
                    Equal
                  </option>

                  <option value="custom">
                    Custom amount
                  </option>

                  <option value="percentage">
                    Percentage
                  </option>
                </select>
              </div>

              {/* SHARED WITH */}

              <div className="form-field">

                <label>
                  Shared with
                </label>

                <p className="field-help">
                  Select the people who
                  should share this expense.
                </p>

                <div className="member-select-grid">

                  {members.map((member) => {

                    const selected =
                      sharedWith.includes(
                        member.member_name
                      );

                    return (
                      <button
                        type="button"
                        key={member.id}
                        className={
                          selected
                            ? "shared-member selected"
                            : "shared-member"
                        }
                        onClick={() =>
                          toggleSharedMember(
                            member.member_name
                          )
                        }
                      >
                        <span>
                          {selected
                            ? "✓"
                            : "+"}
                        </span>

                        {
                          member.member_name
                        }
                      </button>
                    );
                  })}

                </div>

              </div>

              {/* CUSTOM / PERCENTAGE */}

              {sharedWith.length > 0 && (
                <div className="split-editor">

                  <div className="split-editor-title">
                    Split details
                  </div>

                  {sharedWith.map(
                    (name) => (
                      <div
                        className="split-row"
                        key={name}
                      >

                        <div className="split-person">
                          <span className="member-avatar">
                            {name
                              .charAt(0)
                              .toUpperCase()}
                          </span>

                          {name}
                        </div>

                        {splitType ===
                          "equal" && (
                          <strong>
                            ₹
                            {formatMoney(
                              Number(amount) /
                                sharedWith.length
                            )}
                          </strong>
                        )}

                        {splitType ===
                          "custom" && (
                          <div className="split-input">
                            <span>
                              ₹
                            </span>

                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={
                                customAmounts[
                                  name
                                ] ??
                                ""
                              }
                              onChange={(e) =>
                                setCustomAmounts(
                                  (
                                    current
                                  ) => ({
                                    ...current,
                                    [name]:
                                      e.target
                                        .value,
                                  })
                                )
                              }
                            />
                          </div>
                        )}

                        {splitType ===
                          "percentage" && (
                          <div className="split-input">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={
                                customPercentages[
                                  name
                                ] ??
                                ""
                              }
                              onChange={(e) =>
                                setCustomPercentages(
                                  (
                                    current
                                  ) => ({
                                    ...current,
                                    [name]:
                                      e.target
                                        .value,
                                  })
                                )
                              }
                            />

                            <span>
                              %
                            </span>
                          </div>
                        )}

                      </div>
                    )
                  )}

                  {amount &&
                    splitType ===
                      "custom" && (
                      <div className="split-total">
                        <span>
                          Custom total
                        </span>

                        <strong>
                          ₹
                          {formatMoney(
                            sharedWith.reduce(
                              (
                                total,
                                name
                              ) =>
                                total +
                                Number(
                                  customAmounts[
                                    name
                                  ] || 0
                                ),
                              0
                            )
                          )}
                          {" / ₹"}
                          {formatMoney(
                            amount
                          )}
                        </strong>
                      </div>
                    )}

                  {amount &&
                    splitType ===
                      "percentage" && (
                      <div className="split-total">
                        <span>
                          Percentage total
                        </span>

                        <strong>
                          {formatMoney(
                            sharedWith.reduce(
                              (
                                total,
                                name
                              ) =>
                                total +
                                Number(
                                  customPercentages[
                                    name
                                  ] || 0
                                ),
                              0
                            )
                          )}
                          %
                        </strong>
                      </div>
                    )}

                </div>
              )}

              {/* NOTE */}

              <div className="form-field">
                <label>
                  Note
                </label>

                <textarea
                  rows="3"
                  value={note}
                  onChange={(e) =>
                    setNote(
                      e.target.value
                    )
                  }
                  placeholder="Optional note"
                />
              </div>

              {/* BUTTONS */}

              <div className="form-actions">

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
                  onClick={
                    closeExpenseForm
                  }
                >
                  Cancel
                </button>

              </div>

            </form>
          )}

        </section>
      )}

      {/* =====================================
          EXPENSES
      ===================================== */}

      <section className="dashboard-trips trip-expenses-section">

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
              Add your first expense to
              start tracking your trip.
            </p>

            <button
              className="dashboard-create-btn"
              onClick={
                openAddExpense
              }
            >
              + Add Expense
            </button>

          </section>

        ) : (

          <div className="travel-trip-grid">

            {expenses.map(
              (expense) => (
                <article
                  className="travel-trip-card expense-card"
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

                      <strong className="paid-by-name">
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

                  {expense.splits?.length >
                    0 && (
                    <div className="expense-splits">

                      <span className="split-heading">
                        SHARED WITH
                      </span>

                      {expense.splits.map(
                        (split) => (
                          <div
                            className="expense-split-line"
                            key={split.id}
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

                              {expense.split_type ===
                                "percentage" &&
                                split.percentage !=
                                  null && (
                                  <small>
                                    {" "}
                                    (
                                    {
                                      split.percentage
                                    }
                                    %)
                                  </small>
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

                  <div className="expense-actions">

                    <button
                      type="button"
                      className="dashboard-refresh-btn"
                      onClick={() =>
                        openEditExpense(
                          expense
                        )
                      }
                    >
                      ✏️ Edit
                    </button>

                    <button
                      type="button"
                      className="expense-delete-btn"
                      onClick={() =>
                        deleteExpense(
                          expense
                        )
                      }
                    >
                      🗑 Delete
                    </button>

                  </div>

                </article>
              )
            )}

          </div>

        )}

      </section>

      {/* BACK */}

      <div className="trip-back-button">
        <Link to="/dashboard">
          <button className="dashboard-refresh-btn">
            ← Back to Dashboard
          </button>
        </Link>
      </div>

    </TripShell>
  );
}

// =========================================
// PAGE SHELL
// =========================================

function TripShell({ children }) {
  return (
    <div
      className="travel-dashboard trip-details-page"
      style={{
        backgroundImage:
          `url(${landingPage})`,
      }}
    >
      <div className="dashboard-overlay"></div>

      <div className="dashboard-content">
        {children}
      </div>
    </div>
  );
}

export default TripDetails;