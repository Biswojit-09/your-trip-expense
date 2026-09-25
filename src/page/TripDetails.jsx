import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";

function TripDetails() {
  const { tripId } = useParams();

  const [trip, setTrip] = useState(null);
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const [memberName, setMemberName] = useState("");
  const [addingMember, setAddingMember] = useState(false);

  const [showExpenseForm, setShowExpenseForm] = useState(false);

  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [transportType, setTransportType] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [sharedWith, setSharedWith] = useState([]);
  const [splitType, setSplitType] = useState("equal");
  const [note, setNote] = useState("");
  const [splitValues, setSplitValues] = useState({});
  const [savingExpense, setSavingExpense] = useState(false);

  // --------------------------------
  // LOAD TRIP
  // --------------------------------

  async function getTrip() {
    try {
      setLoading(true);

      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser();

      console.log("CURRENT USER:", user);
      console.log("CURRENT USER ID:", user?.id);

      if (userError) {
        console.error("USER ERROR:", userError);
        alert(userError.message);
        return;
      }

      if (!user) {
        alert("Please login first.");
        return;
      }

      // Get trip
      const {
        data: tripData,
        error: tripError
      } = await supabase
        .from("trips")
        .select("*")
        .eq("id", tripId)
        .single();

      if (tripError) {
        console.error("TRIP ERROR:", tripError);
        alert(tripError.message);
        return;
      }

      console.log("TRIP DATA:", tripData);
      console.log("TRIP OWNER:", tripData.created_by);
      console.log("LOGGED USER:", user.id);

      setTrip(tripData);

      // Get members
      const {
        data: memberData,
        error: memberError
      } = await supabase
        .from("trip_members")
        .select("*")
        .eq("trip_id", tripId);

      if (memberError) {
        console.error("MEMBER ERROR:", memberError);
      } else {
        setMembers(memberData || []);
      }

      // Get expenses
      const {
        data: expenseData,
        error: expenseError
      } = await supabase
        .from("expenses")
        .select("*")
        .eq("trip_id", tripId)
        .order("created_at", {
          ascending: false
        });

      if (expenseError) {
        console.error("EXPENSE LOAD ERROR:", expenseError);
      } else {
        setExpenses(expenseData || []);
      }

      setLoaded(true);

    } catch (error) {
      console.error("GET TRIP ERROR:", error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  // --------------------------------
  // ADD MEMBER
  // --------------------------------

  async function addMember(e) {
    e.preventDefault();

    const name = memberName.trim();

    if (!name) {
      alert("Please enter member name.");
      return;
    }

    try {
      setAddingMember(true);

      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        alert("Please login first.");
        return;
      }

      const { data, error } = await supabase
        .from("trip_members")
        .insert([
          {
            trip_id: tripId,
            member_name: name
          }
        ])
        .select()
        .single();

      if (error) {
        console.error("ADD MEMBER ERROR:", error);
        alert(error.message);
        return;
      }

      setMembers((prev) => [...prev, data]);
      setMemberName("");

      alert("Member added successfully!");

    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setAddingMember(false);
    }
  }

  // --------------------------------
  // SHARED MEMBERS
  // --------------------------------

  function toggleSharedMember(name) {
    setSharedWith((prev) => {
      if (prev.includes(name)) {
        return prev.filter(
          (member) => member !== name
        );
      }

      return [...prev, name];
    });
  }

  // --------------------------------
  // SPLIT VALUE
  // --------------------------------

  function updateSplitValue(name, value) {
    setSplitValues((prev) => ({
      ...prev,
      [name]: value
    }));
  }

  // --------------------------------
  // SPLIT TYPE
  // --------------------------------

  function handleSplitTypeChange(type) {
    setSplitType(type);
    setSplitValues({});
  }

  // --------------------------------
  // ADD EXPENSE
  // --------------------------------

  async function addExpense(e) {
    e.preventDefault();

    console.log(
      "========== ADD EXPENSE START =========="
    );

    try {
      setSavingExpense(true);

      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser();

      console.log("CURRENT USER:", user);
      console.log(
        "CURRENT USER ID:",
        user?.id
      );

      if (userError) {
        console.error(
          "USER ERROR:",
          userError
        );

        alert(
          "User error: " +
          userError.message
        );

        return;
      }

      if (!user) {
        alert("Please login first.");
        return;
      }

      // Check trip owner
      const {
        data: currentTrip,
        error: currentTripError
      } = await supabase
        .from("trips")
        .select("*")
        .eq("id", tripId)
        .single();

      if (currentTripError) {
        console.error(
          "CURRENT TRIP ERROR:",
          currentTripError
        );

        alert(
          "Could not load trip:\n" +
          currentTripError.message
        );

        return;
      }

      console.log(
        "CURRENT TRIP:",
        currentTrip
      );

      console.log(
        "TRIP CREATED BY:",
        currentTrip.created_by
      );

      console.log(
        "DO USER AND OWNER MATCH?",
        user.id === currentTrip.created_by
      );

      // Validation
      if (!location.trim()) {
        alert(
          "Please enter where the money was spent."
        );
        return;
      }

      if (!category) {
        alert("Please select a category.");
        return;
      }

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
          "Please select at least one member."
        );
        return;
      }

      const numericAmount = Number(amount);

      // --------------------------------
      // CREATE SPLITS
      // --------------------------------

      let splits = [];

      if (splitType === "equal") {
        const eachAmount =
          Math.round(
            (numericAmount /
              sharedWith.length) *
              100
          ) / 100;

        const eachPercentage =
          Math.round(
            (100 /
              sharedWith.length) *
              100
          ) / 100;

        splits = sharedWith.map(
          (name) => ({
            member_name: name,
            amount: eachAmount,
            percentage: eachPercentage
          })
        );

      } else if (splitType === "custom") {
        let total = 0;

        splits = sharedWith.map(
          (name) => {
            const value = Number(
              splitValues[name] || 0
            );

            total += value;

            return {
              member_name: name,
              amount: value,
              percentage: null
            };
          }
        );

        if (
          Math.abs(
            total - numericAmount
          ) > 0.01
        ) {
          alert(
            `Custom split total must equal ₹${numericAmount}.\n\nCurrent total: ₹${total}`
          );

          return;
        }

      } else if (
        splitType === "percentage"
      ) {
        let totalPercentage = 0;

        splits = sharedWith.map(
          (name) => {
            const percentage =
              Number(
                splitValues[name] || 0
              );

            totalPercentage += percentage;

            const memberAmount =
              Math.round(
                (
                  numericAmount *
                  percentage /
                  100
                ) * 100
              ) / 100;

            return {
              member_name: name,
              amount: memberAmount,
              percentage
            };
          }
        );

        if (
          Math.abs(
            totalPercentage - 100
          ) > 0.01
        ) {
          alert(
            `Percentage split must equal 100%.\n\nCurrent total: ${totalPercentage}%`
          );

          return;
        }
      }

      console.log(
        "SPLITS:",
        splits
      );

      // --------------------------------
      // INSERT EXPENSE
      // --------------------------------

      const expenseData = {
        trip_id: tripId,
        description: note || null,
        location: location.trim(),
        category,
        transport_type:
          category === "Transport"
            ? transportType || null
            : null,
        amount: numericAmount,
        paid_by: paidBy,
        split_type: splitType,
        note: note || null
      };

      console.log(
        "EXPENSE DATA:",
        expenseData
      );

      const {
        data: newExpense,
        error: expenseError
      } = await supabase
        .from("expenses")
        .insert([expenseData])
        .select()
        .single();

      if (expenseError) {
        console.error(
          "EXPENSE INSERT ERROR:",
          expenseError
        );

        alert(
          "EXPENSE ERROR:\n\n" +
          expenseError.message +
          "\n\nCode: " +
          expenseError.code
        );

        return;
      }

      console.log(
        "EXPENSE CREATED:",
        newExpense
      );

      // --------------------------------
      // INSERT SPLITS
      // --------------------------------

      const splitRows =
        splits.map((split) => ({
          expense_id:
            newExpense.id,
          member_name:
            split.member_name,
          amount: split.amount,
          percentage:
            split.percentage
        }));

      const {
        data: insertedSplits,
        error: splitError
      } = await supabase
        .from("expense_splits")
        .insert(splitRows)
        .select();

      if (splitError) {
        console.error(
          "SPLIT INSERT ERROR:",
          splitError
        );

        await supabase
          .from("expenses")
          .delete()
          .eq(
            "id",
            newExpense.id
          );

        alert(
          "SPLIT ERROR:\n\n" +
          splitError.message +
          "\n\nCode: " +
          splitError.code
        );

        return;
      }

      console.log(
        "SPLITS CREATED:",
        insertedSplits
      );

      // Update expenses
      setExpenses((prev) => [
        newExpense,
        ...prev
      ]);

      // Reset form
      setLocation("");
      setCategory("");
      setTransportType("");
      setAmount("");
      setPaidBy("");
      setSharedWith([]);
      setSplitType("equal");
      setNote("");
      setSplitValues({});

      setShowExpenseForm(false);

      alert(
        "Expense added successfully! 🎉"
      );

    } catch (error) {
      console.error(
        "ADD EXPENSE ERROR:",
        error
      );

      alert(
        "Unexpected error:\n\n" +
        error.message
      );

    } finally {
      setSavingExpense(false);
    }
  }

  // --------------------------------
  // CALCULATE SPENT
  // --------------------------------

  const totalSpent = expenses.reduce(
    (total, expense) =>
      total + Number(expense.amount || 0),
    0
  );

  const tripBudget = Number(
    trip?.budget || 0
  );

  const remainingBudget =
    tripBudget - totalSpent;

  // --------------------------------
  // PAGE
  // --------------------------------

  return (
    <div className="trip-details-page">

      <Link to="/dashboard">
        <button>
          ← Back to Dashboard
        </button>
      </Link>

      <h1>{trip?.name}</h1>

      {!loaded && !loading && (
        <div>
          <p>
            Click below to load this trip.
          </p>

          <button onClick={getTrip}>
            Load Trip
          </button>
        </div>
      )}

      {loading && (
        <p>
          Loading trip...
        </p>
      )}

      {loaded && trip && (
        <>

          <p>
            📍 {trip.destination}
          </p>

          <p>
            📅 {trip.start_date} →{" "}
            {trip.end_date}
          </p>

          <hr />

          {/* BUDGET */}

          <h2>Trip Budget</h2>

          <div className="budget-section">

            <div>
              <h3>
                💰 Budget
              </h3>

              <p>
                ₹
                {tripBudget.toFixed(2)}
              </p>
            </div>

            <div>
              <h3>
                💸 Spent
              </h3>

              <p>
                ₹
                {totalSpent.toFixed(2)}
              </p>
            </div>

            <div>
              <h3>
                {remainingBudget >= 0
                  ? "🟢 Remaining"
                  : "🔴 Over Budget"}
              </h3>

              <p>
                ₹
                {Math.abs(
                  remainingBudget
                ).toFixed(2)}
              </p>

              {remainingBudget < 0 && (
                <small>
                  You have exceeded your
                  budget.
                </small>
              )}
            </div>

          </div>

          <hr />

          {/* MEMBERS */}

          <h2>
            Trip Members
          </h2>

          {members.length === 0 && (
            <p>
              No members added yet.
            </p>
          )}

          {members.map((member) => (
            <div key={member.id}>
              👤{" "}
              {member.member_name}
            </div>
          ))}

          <form onSubmit={addMember}>

            <input
              type="text"
              placeholder="Enter member name"
              value={memberName}
              onChange={(e) =>
                setMemberName(
                  e.target.value
                )
              }
            />

            <button
              type="submit"
              disabled={addingMember}
            >
              {addingMember
                ? "Adding..."
                : "Add Member"}
            </button>

          </form>

          <hr />

          {/* EXPENSES */}

          <h2>
            Expenses
          </h2>

          <button
            onClick={() =>
              setShowExpenseForm(
                !showExpenseForm
              )
            }
          >
            {showExpenseForm
              ? "Close Expense Form"
              : "+ Add Expense"}
          </button>

          {showExpenseForm && (
            <form
              onSubmit={addExpense}
            >

              <h3>
                Add New Expense
              </h3>

              <div>
                <label>
                  Where was the money
                  spent?
                </label>

                <input
                  type="text"
                  placeholder="Example: Restaurant"
                  value={location}
                  onChange={(e) =>
                    setLocation(
                      e.target.value
                    )
                  }
                  required
                />
              </div>

              <div>
                <label>
                  Category
                </label>

                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(
                      e.target.value
                    );
                    setTransportType("");
                  }}
                  required
                >
                  <option value="">
                    Select Category
                  </option>

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

              {category ===
                "Transport" && (
                <div>

                  <label>
                    Transport Type
                  </label>

                  <select
                    value={
                      transportType
                    }
                    onChange={(e) =>
                      setTransportType(
                        e.target.value
                      )
                    }
                    required
                  >
                    <option value="">
                      Select Transport
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

              <div>
                <label>
                  Amount
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Example: 8000"
                  value={amount}
                  onChange={(e) =>
                    setAmount(
                      e.target.value
                    )
                  }
                  required
                />
              </div>

              <div>
                <label>
                  Who paid?
                </label>

                <select
                  value={paidBy}
                  onChange={(e) =>
                    setPaidBy(
                      e.target.value
                    )
                  }
                  required
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

              <div>

                <label>
                  Shared with
                </label>

                {members.map(
                  (member) => (
                    <label
                      key={member.id}
                      style={{
                        display:
                          "block"
                      }}
                    >

                      <input
                        type="checkbox"
                        checked={sharedWith.includes(
                          member.member_name
                        )}
                        onChange={() =>
                          toggleSharedMember(
                            member.member_name
                          )
                        }
                      />

                      {" "}
                      {
                        member.member_name
                      }

                    </label>
                  )
                )}

              </div>

              <div>

                <label>
                  Split Type
                </label>

                <select
                  value={splitType}
                  onChange={(e) =>
                    handleSplitTypeChange(
                      e.target.value
                    )
                  }
                >
                  <option value="equal">
                    Equal
                  </option>

                  <option value="custom">
                    Custom Amount
                  </option>

                  <option value="percentage">
                    Percentage
                  </option>
                </select>

              </div>

              {(splitType ===
                "custom" ||
                splitType ===
                  "percentage") &&
                sharedWith.map(
                  (name) => (
                    <div key={name}>

                      <label>
                        {name}{" "}
                        {splitType ===
                        "custom"
                          ? "Amount"
                          : "Percentage"}
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          splitValues[
                            name
                          ] || ""
                        }
                        onChange={(e) =>
                          updateSplitValue(
                            name,
                            e.target.value
                          )
                        }
                        placeholder={
                          splitType ===
                          "custom"
                            ? "Amount"
                            : "%"
                        }
                      />

                    </div>
                  )
                )}

              <div>

                <label>
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
                />

              </div>

              <button
                type="submit"
                disabled={
                  savingExpense
                }
              >
                {savingExpense
                  ? "Saving..."
                  : "Save Expense"}
              </button>

            </form>
          )}

          <hr />

          {/* EXPENSE HISTORY */}

          <h2>
            Expense History
          </h2>

          {expenses.length === 0 && (
            <p>
              No expenses added yet.
            </p>
          )}

          {expenses.map(
            (expense) => (
              <div
                key={expense.id}
                className="expense-card"
              >

                <h3>
                  ₹
                  {Number(
                    expense.amount
                  ).toFixed(2)}
                </h3>

                <p>
                  📍{" "}
                  {expense.location}
                </p>

                <p>
                  📂{" "}
                  {expense.category}
                </p>

                {expense.transport_type && (
                  <p>
                    🚗{" "}
                    {
                      expense.transport_type
                    }
                  </p>
                )}

                <p>
                  💳 Paid by:{" "}
                  {expense.paid_by}
                </p>

                <p>
                  🔀 Split:{" "}
                  {expense.split_type}
                </p>

                {expense.note && (
                  <p>
                    📝{" "}
                    {expense.note}
                  </p>
                )}

              </div>
            )
          )}

        </>
      )}

    </div>
  );
}

export default TripDetails;