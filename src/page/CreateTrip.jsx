import { useState } from "react";
import { supabase } from "../supabaseClient";

function CreateTrip() {
  const [tripName, setTripName] = useState("");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [budget, setBudget] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreateTrip = async (e) => {
    e.preventDefault();

    if (!budget || Number(budget) <= 0) {
      alert("Please enter a valid trip budget.");
      return;
    }

    setLoading(true);

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
      alert("Please login first.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("trips")
      .insert([
        {
          name: tripName,
          destination: destination,
          start_date: startDate,
          end_date: endDate,
          budget: Number(budget),
          created_by: user.id
        }
      ])
      .select();

    if (error) {
      console.error("CREATE TRIP ERROR:", error);
      alert(error.message);
    } else {
      console.log("Trip created:", data);

      alert("Trip created successfully! 🎉");

      setTripName("");
      setDestination("");
      setStartDate("");
      setEndDate("");
      setBudget("");
    }

    setLoading(false);
  };

  return (
    <div className="create-trip-page">

      <h1>Create Your Trip</h1>

      <p>Enter your trip details</p>

      <form onSubmit={handleCreateTrip}>

        <div>
          <label>Trip Name</label>

          <input
            type="text"
            placeholder="Example: Goa Trip"
            value={tripName}
            onChange={(e) =>
              setTripName(e.target.value)
            }
            required
          />
        </div>

        <div>
          <label>Destination</label>

          <input
            type="text"
            placeholder="Example: Goa"
            value={destination}
            onChange={(e) =>
              setDestination(e.target.value)
            }
            required
          />
        </div>

        <div>
          <label>Start Date</label>

          <input
            type="date"
            value={startDate}
            onChange={(e) =>
              setStartDate(e.target.value)
            }
            required
          />
        </div>

        <div>
          <label>End Date</label>

          <input
            type="date"
            value={endDate}
            onChange={(e) =>
              setEndDate(e.target.value)
            }
            required
          />
        </div>

        <div>
          <label>Trip Budget</label>

          <input
            type="number"
            min="1"
            step="0.01"
            placeholder="Example: 50000"
            value={budget}
            onChange={(e) =>
              setBudget(e.target.value)
            }
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Creating..."
            : "Create Trip"}
        </button>

      </form>

    </div>
  );
}

export default CreateTrip;