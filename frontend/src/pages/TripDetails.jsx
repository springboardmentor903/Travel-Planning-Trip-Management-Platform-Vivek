import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from "chart.js";
import { Doughnut, Pie, Bar } from "react-chartjs-2";
import Navbar from "../components/Navbar";
import { API_BASE_URL } from "../config/api";
import { getDestinationImageUrl, handleImageError } from "../utils/destinationImages";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

function extractWeatherFields(data) {
  if (!data) return null;
  const temp =
    data.temperature != null
      ? data.temperature
      : data.temp != null
      ? data.temp
      : data.main?.temp != null
      ? Math.round(data.main.temp)
      : null;

  const humidity =
    data.humidity != null
      ? data.humidity
      : data.main?.humidity != null
      ? data.main.humidity
      : null;

  const windSpeedVal =
    data.windSpeed != null
      ? data.windSpeed
      : data.wind != null
      ? (typeof data.wind === "object" ? data.wind.speed ?? null : data.wind)
      : null;

  const condition =
    data.condition ||
    data.description ||
    (Array.isArray(data.weather) ? data.weather[0]?.description : null) ||
    "—";

  const city = data.city || data.name || "";
  return { temp, humidity, windSpeed: windSpeedVal, condition, city };
}

function getWeatherIconEmoji(condition = "") {
  const c = condition.toLowerCase();
  if (c.includes("clear") || c.includes("sun")) return "☀️";
  if (c.includes("cloud") || c.includes("overcast")) return "🌤️";
  if (c.includes("rain") || c.includes("drizzle")) return "🌧️";
  if (c.includes("thunder") || c.includes("storm")) return "⛈️";
  if (c.includes("snow")) return "❄️";
  if (c.includes("mist") || c.includes("fog") || c.includes("haze")) return "🌫️";
  return "🌤️";
}

function TripDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Active Tab: "overview" | "itinerary" | "budget" | "expenses" | "members"
  const [activeTab, setActiveTab] = useState("overview");

  // =====================================================
  // TRIP
  // =====================================================
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =====================================================
  // MEMBERS
  // =====================================================
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [addMemberForm, setAddMemberForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    role: "MEMBER",
  });
  const [addMemberErrors, setAddMemberErrors] = useState({});
  const [invitingMember, setInvitingMember] = useState(false);
  const [addMemberSuccess, setAddMemberSuccess] = useState("");

  const [changingRole, setChangingRole] = useState(null);
  const [removingMember, setRemovingMember] = useState(null);
  const [canManageMembers, setCanManageMembers] = useState(false);

  // =====================================================
  // ITINERARY
  // =====================================================
  const [itineraries, setItineraries] = useState([]);
  const [loadingItinerary, setLoadingItinerary] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [savingItinerary, setSavingItinerary] = useState(false);
  const [editingItinerary, setEditingItinerary] = useState(null);
  const [deletingItinerary, setDeletingItinerary] = useState(null);

  const [formData, setFormData] = useState({
    dayNumber: "",
    date: "",
    title: "",
    description: "",
  });

  // =====================================================
  // BUDGET
  // =====================================================
  const [budget, setBudget] = useState(null);
  const [loadingBudget, setLoadingBudget] = useState(true);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [savingBudget, setSavingBudget] = useState(false);

  const [budgetForm, setBudgetForm] = useState({
    totalBudget: "",
    accommodationBudget: "",
    foodBudget: "",
    transportBudget: "",
    activityBudget: "",
    miscellaneousBudget: "",
  });

  // =====================================================
  // EXPENSES
  // =====================================================
  const [expenses, setExpenses] = useState([]);
  const [loadingExpenses, setLoadingExpenses] = useState(true);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [remainingBudget, setRemainingBudget] = useState(0);
  const [categorySummary, setCategorySummary] = useState([]);

  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [savingExpense, setSavingExpense] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [deletingExpense, setDeletingExpense] = useState(null);

  const [expenseForm, setExpenseForm] = useState({
    category: "",
    amount: "",
    expenseDate: "",
    receiptLink: "",
  });

  // =====================================================
  // WEATHER
  // =====================================================
  const [weather, setWeather] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [weatherError, setWeatherError] = useState("");

  // =====================================================
  // CHART TYPE
  // =====================================================
  const [expenseChartType, setExpenseChartType] = useState("pie"); // "pie" | "bar"

  // =====================================================
  // DELETE TRIP
  // =====================================================
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingTrip, setDeletingTrip] = useState(false);
  const [deleteTripError, setDeleteTripError] = useState("");

  // =====================================================
  // AUTH CONFIG
  // =====================================================
  const getAuthConfig = () => {
    const token = localStorage.getItem("token");
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };
  };

  const handleAuthError = (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      localStorage.removeItem("userName");
      localStorage.removeItem("userEmail");
      alert("Your session has expired. Please login again.");
      navigate("/login");
      return true;
    }
    return false;
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    fetchTrip();
    fetchItineraries();
    fetchBudget();
    fetchMembers();
    fetchExpenses();
    fetchRemainingBudget();
    fetchCategorySummary();
  }, [id]);

  // Set canManageMembers based on owner or GROUP_ADMIN
  useEffect(() => {
    if (!trip) return;

    const currentUserEmail = localStorage.getItem("userEmail");
    const currentUserId = String(localStorage.getItem("userId") || "");

    const tripOwnerEmail = trip.user?.email || "";
    const tripOwnerId = String(trip.user?.id || "");

    const isOwner =
      (currentUserEmail && currentUserEmail === tripOwnerEmail) ||
      (currentUserId && currentUserId === tripOwnerId);

    const isGroupAdmin = members.some((m) => {
      const mEmail = m.user?.email || m.email;
      const mId = String(m.user?.id || m.userId || "");
      const mRole = m.role || m.user?.role;
      return (
        ((currentUserEmail && mEmail === currentUserEmail) ||
          (currentUserId && mId === currentUserId)) &&
        mRole === "GROUP_ADMIN"
      );
    });

    if (isOwner || isGroupAdmin) {
      setCanManageMembers(true);
    } else {
      setCanManageMembers(false);
    }
  }, [trip, members]);

  // =====================================================
  // FETCH WEATHER
  // =====================================================
  const fetchWeatherForDestination = async (destName) => {
    if (!destName || !destName.trim()) return;
    try {
      setLoadingWeather(true);
      setWeatherError("");
      const response = await axios.get(
        `${API_BASE_URL}/api/weather/${encodeURIComponent(destName.trim())}`,
        getAuthConfig()
      );
      const fields = extractWeatherFields(response.data);
      setWeather(fields);
    } catch (err) {
      console.error("Error loading weather for destination:", err);
      setWeather(null);
      setWeatherError("Weather information unavailable");
    } finally {
      setLoadingWeather(false);
    }
  };

  // =====================================================
  // FETCH TRIP
  // =====================================================
  const fetchTrip = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        `${API_BASE_URL}/api/trips/${id}`,
        getAuthConfig()
      );

      console.log("TRIP DETAILS:", response.data);
      setTrip(response.data);
      const destName =
        response.data?.destination?.name ||
        response.data?.destination?.destinationName ||
        "";
      if (destName) {
        fetchWeatherForDestination(destName);
      }
    } catch (err) {
      console.error("Error fetching trip:", err);
      if (handleAuthError(err)) return;
      setError("Unable to load trip details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // DELETE TRIP HANDLER
  // =====================================================
  const confirmDeleteTrip = async () => {
    try {
      setDeletingTrip(true);
      setDeleteTripError("");
      await axios.delete(
        `${API_BASE_URL}/api/trips/${id}`,
        getAuthConfig()
      );
      navigate("/trips");
    } catch (err) {
      console.error("Error deleting trip:", err);
      if (handleAuthError(err)) return;
      const errorMsg =
        err.response?.data?.message ||
        (typeof err.response?.data === "string" ? err.response?.data : null) ||
        "Failed to delete trip. Only the trip owner or group admins can delete this trip.";
      setDeleteTripError(errorMsg);
    } finally {
      setDeletingTrip(false);
    }
  };

  // =====================================================
  // FETCH MEMBERS
  // =====================================================
  const fetchMembers = async () => {
    try {
      setLoadingMembers(true);
      const response = await axios.get(
        `${API_BASE_URL}/api/trips/${id}/members`,
        getAuthConfig()
      );
      console.log("MEMBERS:", response.data);
      setMembers(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Error fetching members:", err);
      if (handleAuthError(err)) return;
      setMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  // =====================================================
  // ADD MEMBER MODAL & HANDLERS
  // =====================================================
  const openAddMemberModal = () => {
    setAddMemberForm({
      fullName: "",
      email: "",
      phone: "",
      role: "MEMBER",
    });
    setAddMemberErrors({});
    setAddMemberSuccess("");
    setShowAddMemberModal(true);
  };

  const closeAddMemberModal = () => {
    if (invitingMember) return;
    setShowAddMemberModal(false);
    setAddMemberErrors({});
    setAddMemberSuccess("");
  };

  const handleAddMemberChange = (e) => {
    const { name, value } = e.target;
    setAddMemberForm((prev) => ({ ...prev, [name]: value }));
    if (addMemberErrors[name]) {
      setAddMemberErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateAddMemberForm = () => {
    const errs = {};
    if (!addMemberForm.fullName.trim()) {
      errs.fullName = "Full Name is required.";
    }
    if (!addMemberForm.email.trim()) {
      errs.email = "Email Address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addMemberForm.email.trim())) {
      errs.email = "Please enter a valid email address.";
    }
    if (
      addMemberForm.phone.trim() &&
      !/^[+\d][\d\s\-().]{6,19}$/.test(addMemberForm.phone.trim())
    ) {
      errs.phone = "Please enter a valid phone number.";
    }
    if (!addMemberForm.role) {
      errs.role = "Role is required.";
    }
    return errs;
  };

  const handleAddMemberSubmit = async (e) => {
    e.preventDefault();
    const errs = validateAddMemberForm();
    if (Object.keys(errs).length > 0) {
      setAddMemberErrors(errs);
      return;
    }

    try {
      setInvitingMember(true);
      setAddMemberSuccess("");

      const response = await axios.post(
        `${API_BASE_URL}/api/trips/${id}/invitations`,
        {
          email: addMemberForm.email.trim(),
          role: addMemberForm.role || "MEMBER",
        },
        getAuthConfig()
      );

      setAddMemberSuccess(`Invitation sent successfully to ${addMemberForm.email.trim()}! 🎉`);

      setTimeout(() => {
        closeAddMemberModal();
      }, 1500);
    } catch (err) {
      console.error("Error inviting member:", err);
      const message =
        err.response?.data?.message ||
        (typeof err.response?.data === "string" ? err.response.data : null) ||
        "Unable to send invitation. Please verify the email and try again.";
      setAddMemberErrors({ submit: message });
    } finally {
      setInvitingMember(false);
    }
  };

  const handleRemoveMember = async (member) => {
    const role = member.role || member.user?.role || "MEMBER";
    if (role === "OWNER" || member.isOwner) {
      alert("Trip owner cannot be removed.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to remove this member from the trip?"
    );
    if (!confirmed) return;

    const targetUserId = member.user?.id || member.userId;
    if (!targetUserId) {
      alert("Member User ID not found.");
      return;
    }

    try {
      setRemovingMember(targetUserId);
      await axios.delete(
        `${API_BASE_URL}/api/trips/${id}/members/${targetUserId}`,
        getAuthConfig()
      );
      await fetchMembers();
    } catch (err) {
      console.error("Error removing member:", err);
      alert(
        err.response?.data?.message ||
          (typeof err.response?.data === "string" ? err.response.data : null) ||
          "Unable to remove member."
      );
    } finally {
      setRemovingMember(null);
    }
  };

  const handleChangeRole = async (member) => {
    const currentRole = member.role || member.user?.role || "MEMBER";
    if (currentRole === "OWNER" || member.isOwner) {
      alert("Trip owner's role cannot be changed.");
      return;
    }

    const targetUserId = member.user?.id || member.userId;
    if (!targetUserId) {
      alert("Member User ID not found.");
      return;
    }

    const newRole = currentRole === "GROUP_ADMIN" ? "MEMBER" : "GROUP_ADMIN";

    try {
      setChangingRole(targetUserId);
      await axios.put(
        `${API_BASE_URL}/api/trips/${id}/members/${targetUserId}/role`,
        { role: newRole },
        getAuthConfig()
      );
      await fetchMembers();
    } catch (err) {
      console.error("Error changing role:", err);
      alert(
        err.response?.data?.message ||
          (typeof err.response?.data === "string" ? err.response.data : null) ||
          "Unable to change member role."
      );
    } finally {
      setChangingRole(null);
    }
  };

  // =====================================================
  // FETCH BUDGET
  // =====================================================
  const fetchBudget = async () => {
    try {
      setLoadingBudget(true);
      const response = await axios.get(
        `${API_BASE_URL}/api/budgets/trip/${id}`,
        getAuthConfig()
      );
      console.log("BUDGET RESPONSE:", response.data);
      setBudget(response.data);
    } catch (err) {
      if (err.response?.status === 404) {
        // Budget not set yet for this trip - expected default state
        setBudget(null);
      } else {
        console.error("Error fetching budget:", err);
        if (handleAuthError(err)) return;
        setBudget(null);
      }
    } finally {
      setLoadingBudget(false);
    }
  };

  const openBudgetModal = () => {
    if (budget) {
      setBudgetForm({
        totalBudget: budget.totalBudget ?? "",
        accommodationBudget: budget.accommodationBudget ?? "",
        foodBudget: budget.foodBudget ?? "",
        transportBudget: budget.transportBudget ?? "",
        activityBudget: budget.activityBudget ?? "",
        miscellaneousBudget: budget.miscellaneousBudget ?? "",
      });
    } else {
      setBudgetForm({
        totalBudget: trip?.budget ?? "",
        accommodationBudget: "",
        foodBudget: "",
        transportBudget: "",
        activityBudget: "",
        miscellaneousBudget: "",
      });
    }
    setShowBudgetModal(true);
  };

  const closeBudgetModal = () => {
    setShowBudgetModal(false);
  };

  const handleBudgetChange = (e) => {
    const { name, value } = e.target;
    setBudgetForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    try {
      setSavingBudget(true);
      const payload = {
        totalBudget: Number(budgetForm.totalBudget) || 0,
        accommodationBudget: Number(budgetForm.accommodationBudget) || 0,
        foodBudget: Number(budgetForm.foodBudget) || 0,
        transportBudget: Number(budgetForm.transportBudget) || 0,
        activityBudget: Number(budgetForm.activityBudget) || 0,
        miscellaneousBudget: Number(budgetForm.miscellaneousBudget) || 0,
      };

      if (budget) {
        await axios.put(
          `${API_BASE_URL}/api/budgets/trip/${id}`,
          payload,
          getAuthConfig()
        );
      } else {
        payload.tripId = Number(id);
        await axios.post(
          `${API_BASE_URL}/api/budgets`,
          payload,
          getAuthConfig()
        );
      }

      closeBudgetModal();
      await fetchBudget();
      await fetchRemainingBudget();
    } catch (err) {
      console.error("Error saving budget:", err);
      alert(err.response?.data?.message || "Unable to save budget.");
    } finally {
      setSavingBudget(false);
    }
  };

  // =====================================================
  // FETCH EXPENSES
  // =====================================================
  const fetchExpenses = async () => {
    try {
      setLoadingExpenses(true);
      const response = await axios.get(
        `${API_BASE_URL}/api/expenses/trip/${id}`,
        getAuthConfig()
      );
      console.log("EXPENSES:", response.data);
      const expenseList = Array.isArray(response.data) ? response.data : [];
      setExpenses(expenseList);

      const total = expenseList.reduce(
        (sum, item) => sum + (Number(item.amount) || 0),
        0
      );
      setTotalExpenses(total);
    } catch (err) {
      console.error("Error fetching expenses:", err);
      if (handleAuthError(err)) return;
      setExpenses([]);
      setTotalExpenses(0);
    } finally {
      setLoadingExpenses(false);
    }
  };

  const fetchRemainingBudget = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/expenses/trip/${id}/remaining-budget`,
        getAuthConfig()
      );
      setRemainingBudget(Number(response.data) || 0);
    } catch (err) {
      console.error("Error remaining budget:", err);
      setRemainingBudget(0);
    }
  };

  const fetchCategorySummary = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/expenses/trip/${id}/category-summary`,
        getAuthConfig()
      );
      setCategorySummary(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Error category summary:", err);
      setCategorySummary([]);
    }
  };

  const openAddExpenseModal = () => {
    setEditingExpense(null);
    setExpenseForm({
      category: "ACCOMMODATION",
      amount: "",
      expenseDate: new Date().toISOString().split("T")[0],
      receiptLink: "",
    });
    setShowExpenseModal(true);
  };

  const openEditExpenseModal = (expense) => {
    setEditingExpense(expense);
    setExpenseForm({
      category: expense.category || "ACCOMMODATION",
      amount: expense.amount ?? "",
      expenseDate: expense.expenseDate
        ? new Date(expense.expenseDate).toISOString().split("T")[0]
        : "",
      receiptLink: expense.receiptLink || "",
    });
    setShowExpenseModal(true);
  };

  const closeExpenseModal = () => {
    setShowExpenseModal(false);
    setEditingExpense(null);
  };

  const handleExpenseChange = (e) => {
    const { name, value } = e.target;
    setExpenseForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveExpense = async (e) => {
    e.preventDefault();
    if (!expenseForm.amount || Number(expenseForm.amount) <= 0) {
      alert("Please enter a valid expense amount.");
      return;
    }

    try {
      setSavingExpense(true);
      const payload = {
        category: expenseForm.category,
        amount: Number(expenseForm.amount),
        expenseDate: expenseForm.expenseDate,
        receiptLink: expenseForm.receiptLink.trim() || null,
        tripId: Number(id),
        budgetId: budget?.id,
        payerId: editingExpense ? editingExpense.payerId : Number(localStorage.getItem("userId")),
      };

      if (editingExpense) {
        await axios.put(
          `${API_BASE_URL}/api/expenses/${editingExpense.id}/trip/${id}`,
          payload,
          getAuthConfig()
        );
      } else {
        await axios.post(
          `${API_BASE_URL}/api/expenses`,
          payload,
          getAuthConfig()
        );
      }

      closeExpenseModal();
      await fetchExpenses();
      await fetchRemainingBudget();
      await fetchCategorySummary();
    } catch (err) {
      console.error("Error saving expense:", err);
      alert(err.response?.data?.message || "Unable to save expense.");
    } finally {
      setSavingExpense(false);
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    const confirmed = window.confirm("Are you sure you want to delete this expense?");
    if (!confirmed) return;

    try {
      setDeletingExpense(expenseId);
      await axios.delete(
        `${API_BASE_URL}/api/expenses/${expenseId}/trip/${id}`,
        getAuthConfig()
      );
      await fetchExpenses();
      await fetchRemainingBudget();
      await fetchCategorySummary();
    } catch (err) {
      console.error("Error deleting expense:", err);
      alert("Unable to delete expense.");
    } finally {
      setDeletingExpense(null);
    }
  };

  // =====================================================
  // FETCH ITINERARY
  // =====================================================
  const fetchItineraries = async () => {
    try {
      setLoadingItinerary(true);
      const response = await axios.get(
        `${API_BASE_URL}/api/trips/${id}/itineraries`,
        getAuthConfig()
      );
      setItineraries(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Error fetching itineraries:", err);
      if (handleAuthError(err)) return;
      setItineraries([]);
    } finally {
      setLoadingItinerary(false);
    }
  };

  const openAddModal = () => {
    setEditingItinerary(null);
    setFormData({
      dayNumber: itineraries.length + 1,
      date: "",
      title: "",
      description: "",
    });
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingItinerary(item);
    setFormData({
      dayNumber: item.dayNumber ?? "",
      date: item.date ? new Date(item.date).toISOString().split("T")[0] : "",
      title: item.title ?? "",
      description: item.description ?? "",
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItinerary(null);
  };

  const handleItineraryChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveItinerary = async (e) => {
    e.preventDefault();
    if (!formData.dayNumber || !formData.title.trim()) {
      alert("Please fill in Day Number and Activity Title.");
      return;
    }

    try {
      setSavingItinerary(true);
      const payload = {
        dayNumber: Number(formData.dayNumber),
        date: formData.date || null,
        title: formData.title.trim(),
        description: formData.description.trim(),
      };

      if (editingItinerary) {
        await axios.put(
          `${API_BASE_URL}/api/trips/${id}/itineraries/${editingItinerary.id}`,
          payload,
          getAuthConfig()
        );
      } else {
        await axios.post(
          `${API_BASE_URL}/api/trips/${id}/itineraries`,
          payload,
          getAuthConfig()
        );
      }

      closeModal();
      await fetchItineraries();
    } catch (err) {
      console.error("Error saving itinerary:", err);
      alert(err.response?.data?.message || "Unable to save itinerary.");
    } finally {
      setSavingItinerary(false);
    }
  };

  const handleDeleteItinerary = async (activityId) => {
    const confirmed = window.confirm("Are you sure you want to delete this activity?");
    if (!confirmed) return;

    try {
      setDeletingItinerary(activityId);
      await axios.delete(
        `${API_BASE_URL}/api/trips/${id}/itineraries/${activityId}`,
        getAuthConfig()
      );
      await fetchItineraries();
    } catch (err) {
      console.error("Error deleting activity:", err);
      alert("Unable to delete activity.");
    } finally {
      setDeletingItinerary(null);
    }
  };

  // Helper date formatter
  const formatDate = (dateStr) => {
    if (!dateStr) return "TBD";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <Navbar />
        <div style={styles.loadingContainer}>
          <div style={styles.spinnerEmoji}>⏳</div>
          <h2>Loading trip details...</h2>
          <p>Please wait while we gather itinerary, budget, and members.</p>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div style={styles.page}>
        <Navbar />
        <div style={styles.errorContainer}>
          <div style={styles.errorEmoji}>🔍</div>
          <h2>{error || "Trip not found"}</h2>
          <p>The trip you are looking for may have been deleted or is unavailable.</p>
          <Link to="/trips" style={styles.backBtn}>
            ← Back to My Trips
          </Link>
        </div>
      </div>
    );
  }

  const destinationName =
    trip.destination?.name ||
    trip.destination?.destinationName ||
    "Dream Destination";

  const totalBudgetValue =
    budget?.totalBudget || Number(trip.budget) || 0;

  const budgetUsagePercent =
    totalBudgetValue > 0
      ? Math.min(Math.round((totalExpenses / totalBudgetValue) * 100), 100)
      : 0;

  const isOverBudget =
    totalBudgetValue > 0 && totalExpenses > totalBudgetValue;

  // Build displayed members with Trip Owner prepended
  const displayedMembers = [];
  if (trip && trip.user) {
    displayedMembers.push({
      user: trip.user,
      role: "OWNER",
      isOwner: true,
      id: "owner_" + trip.user.id,
    });
  }
  const ownerUserId = trip?.user?.id;
  members.forEach((m) => {
    const mUserId = m.user?.id || m.userId;
    if (mUserId !== ownerUserId) {
      displayedMembers.push(m);
    }
  });

  // Chart data
  const chartLabels = categorySummary.map((item) => item.category || "Other");
  const chartDataPoints = categorySummary.map(
    (item) => Number(item.totalAmount) || 0
  );
  const chartColors = [
    "#0284c7",
    "#10b981",
    "#f59e0b",
    "#8b5cf6",
    "#ec4899",
    "#64748b",
  ];

  const doughnutData = {
    labels: chartLabels.length ? chartLabels : ["No Expenses"],
    datasets: [
      {
        data: chartDataPoints.length ? chartDataPoints : [1],
        backgroundColor: chartDataPoints.length
          ? chartColors.slice(0, chartLabels.length)
          : ["#e2e8f0"],
        borderWidth: 2,
        borderColor: "#ffffff",
      },
    ],
  };

  const doughnutOptions = {
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          boxWidth: 12,
          padding: 14,
          font: { size: 12, family: "Plus Jakarta Sans, sans-serif" },
        },
      },
    },
    cutout: "68%",
    maintainAspectRatio: false,
  };

  const pieData = doughnutData;
  const pieOptions = doughnutOptions;

  const barData = {
    labels: chartLabels.length ? chartLabels : ["No Expenses"],
    datasets: [
      {
        label: "Amount (₹)",
        data: chartDataPoints.length ? chartDataPoints : [0],
        backgroundColor: chartColors.slice(0, chartLabels.length || 1),
        borderRadius: 8,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => ` ₹${Number(context.parsed.y || 0).toLocaleString()}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (val) => `₹${Number(val).toLocaleString()}`,
          font: { size: 11, family: "Plus Jakarta Sans, sans-serif" },
        },
        grid: { color: "#f1f5f9" },
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 11, family: "Plus Jakarta Sans, sans-serif" } },
      },
    },
  };

  return (
    <div style={styles.page}>
      <Navbar />

      <main style={styles.container}>
        {/* =================================================
            HERO HEADER BANNER
        ================================================= */}
        <section
          style={{
            ...styles.heroBanner,
            backgroundImage: `linear-gradient(135deg, rgba(7, 89, 133, 0.88) 0%, rgba(15, 23, 42, 0.92) 100%), url(${getDestinationImageUrl(destinationName)})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div style={styles.heroTopRow}>
            <div style={styles.heroLeftContainer}>
              <div style={styles.heroThumbWrap}>
                <img
                  src={getDestinationImageUrl(destinationName)}
                  alt={destinationName}
                  style={styles.heroThumbImg}
                  onError={handleImageError}
                />
              </div>

              <div style={styles.heroLeft}>
                <div style={styles.heroBadgeRow}>
                  <span style={styles.destBadge}>📍 {destinationName}</span>
                  <span
                    style={{
                      ...styles.statusPill,
                      background:
                        trip.status === "ACTIVE"
                          ? "#ecfdf5"
                          : trip.status === "COMPLETED"
                          ? "#f1f5f9"
                          : "#eff6ff",
                      color:
                        trip.status === "ACTIVE"
                          ? "#059669"
                          : trip.status === "COMPLETED"
                          ? "#475569"
                          : "#2563eb",
                    }}
                  >
                    ● {trip.status || "PLANNED"}
                  </span>
                </div>

                <h1 style={styles.heroHeading}>{trip.name || destinationName}</h1>

                <div style={styles.heroMetaRow}>
                  <span>📅 {formatDate(trip.startDate)} → {formatDate(trip.endDate)}</span>
                  <span>•</span>
                  <span>👥 {trip.travelers || 1} Travelers</span>
                  <span>•</span>
                  <span>👑 Owner: {trip.user?.name || trip.user?.email || "Organizer"}</span>
                </div>
              </div>
            </div>

            <div style={styles.heroActions}>
              <button
                style={styles.editTripBtn}
                onClick={() => navigate(`/trips/${trip.id}/edit`)}
              >
                ✏️ Edit Trip
              </button>

              <button
                style={styles.deleteTripBtn}
                onClick={() => {
                  setDeleteTripError("");
                  setShowDeleteModal(true);
                }}
                title="Delete Trip"
              >
                🗑️ Delete Trip
              </button>

              <Link to="/trips" style={styles.backTripBtn}>
                ← All Trips
              </Link>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div style={styles.metricsStrip}>
            <div style={styles.metricStripItem}>
              <span style={styles.metricStripLabel}>Total Budget</span>
              <strong style={styles.metricStripVal}>
                ₹{totalBudgetValue.toLocaleString()}
              </strong>
            </div>

            <div style={styles.metricStripDivider} />

            <div style={styles.metricStripItem}>
              <span style={styles.metricStripLabel}>Spent so far</span>
              <strong
                style={{
                  ...styles.metricStripVal,
                  color: isOverBudget ? "#dc2626" : "#0f172a",
                }}
              >
                ₹{totalExpenses.toLocaleString()}
              </strong>
            </div>

            <div style={styles.metricStripDivider} />

            <div style={styles.metricStripItem}>
              <span style={styles.metricStripLabel}>Remaining</span>
              <strong
                style={{
                  ...styles.metricStripVal,
                  color: remainingBudget < 0 ? "#dc2626" : "#059669",
                }}
              >
                ₹{remainingBudget.toLocaleString()}
              </strong>
            </div>

            <div style={styles.metricStripDivider} />

            <div style={styles.metricStripItem}>
              <span style={styles.metricStripLabel}>Itinerary Activities</span>
              <strong style={styles.metricStripVal}>
                {itineraries.length} Planned
              </strong>
            </div>
          </div>
        </section>

        {/* =================================================
            TABBED NAVIGATION BAR
        ================================================= */}
        <nav style={styles.tabNav}>
          {[
            { id: "overview", label: "📌 Overview", count: null },
            { id: "itinerary", label: "🗓️ Itinerary", count: itineraries.length },
            { id: "budget", label: "💰 Budget", count: null },
            { id: "expenses", label: "💳 Expenses", count: expenses.length },
            { id: "members", label: "👥 Members", count: displayedMembers.length },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  ...styles.tabButton,
                  ...(isActive ? styles.tabButtonActive : {}),
                }}
              >
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span
                    style={{
                      ...styles.tabCountBadge,
                      background: isActive ? "#0284c7" : "#e2e8f0",
                      color: isActive ? "#ffffff" : "#475569",
                    }}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* =================================================
            TAB 1: OVERVIEW
        ================================================= */}
        {activeTab === "overview" && (
          <div style={styles.tabContent} className="animate-fade-in">
            <div style={styles.overviewGrid}>
              {/* Trip Information Card */}
              <div style={styles.sectionCard}>
                <h3 style={styles.cardSectionTitle}>📍 Trip Information</h3>
                <div style={styles.infoGrid}>
                  <div style={styles.infoBox}>
                    <span style={styles.infoLabel}>Destination</span>
                    <strong style={styles.infoValue}>{destinationName}</strong>
                  </div>
                  <div style={styles.infoBox}>
                    <span style={styles.infoLabel}>Travel Dates</span>
                    <strong style={styles.infoValue}>
                      {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                    </strong>
                  </div>
                  <div style={styles.infoBox}>
                    <span style={styles.infoLabel}>Travelers</span>
                    <strong style={styles.infoValue}>{trip.travelers || 1} Persons</strong>
                  </div>
                  <div style={styles.infoBox}>
                    <span style={styles.infoLabel}>Status</span>
                    <strong style={styles.infoValue}>{trip.status || "PLANNED"}</strong>
                  </div>
                </div>
              </div>

              {/* Dedicated Weather Card */}
              <div style={styles.sectionCard} id="trip-weather-section-card">
                <div style={styles.cardHeaderWithAction}>
                  <h3 style={styles.cardSectionTitle}>
                    Weather in {weather?.city || destinationName}
                  </h3>
                  {loadingWeather ? (
                    <span style={styles.weatherLiveBadge}>Checking...</span>
                  ) : weather ? (
                    <span style={styles.weatherLiveBadge}>Live Forecast</span>
                  ) : null}
                </div>

                {loadingWeather ? (
                  <div style={styles.weatherLoadingBox}>
                    <div style={styles.weatherMiniSpinner} />
                    <span style={styles.weatherLoadingText}>
                      Checking weather for {destinationName}...
                    </span>
                  </div>
                ) : weatherError || !weather ? (
                  <div style={styles.weatherUnavailableBox}>
                    <span style={styles.weatherUnavailableIcon}>⛅</span>
                    <p style={styles.weatherUnavailableText}>
                      Weather information unavailable
                    </p>
                    <button
                      type="button"
                      style={styles.weatherRetryBtn}
                      onClick={() => fetchWeatherForDestination(destinationName)}
                    >
                      Retry Weather
                    </button>
                  </div>
                ) : (
                  <div style={styles.weatherCardContent}>
                    <div style={styles.weatherMainRow}>
                      <div style={styles.weatherTempWrap}>
                        <span style={styles.weatherIconEmoji}>
                          {getWeatherIconEmoji(weather.condition)}
                        </span>
                        <span style={styles.weatherTempText}>
                          {weather.temp != null ? `${weather.temp}°C` : "—"}
                        </span>
                      </div>
                      <div style={styles.weatherConditionWrap}>
                        <span style={styles.weatherConditionText}>
                          {weather.condition
                            ? weather.condition.charAt(0).toUpperCase() + weather.condition.slice(1)
                            : "Clear"}
                        </span>
                        <span style={styles.weatherCitySub}>
                          📍 {weather.city || destinationName}
                        </span>
                      </div>
                    </div>

                    <div style={styles.weatherMetricsGrid}>
                      <div style={styles.weatherMetricItem}>
                        <span style={styles.weatherMetricLabel}>Humidity</span>
                        <strong style={styles.weatherMetricVal}>
                          {weather.humidity != null ? `${weather.humidity}%` : "—"}
                        </strong>
                      </div>
                      <div style={styles.weatherMetricItem}>
                        <span style={styles.weatherMetricLabel}>Wind</span>
                        <strong style={styles.weatherMetricVal}>
                          {weather.windSpeed != null ? `${weather.windSpeed} km/h` : "—"}
                        </strong>
                      </div>
                    </div>

                    <div style={styles.weatherFooterNote}>
                      <span>Updated recently</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Budget Progress Card */}
              <div style={styles.sectionCard}>
                <div style={styles.cardHeaderWithAction}>
                  <h3 style={styles.cardSectionTitle}>💰 Budget Overview</h3>
                  <button style={styles.inlineActionBtn} onClick={openBudgetModal}>
                    {budget ? "Manage Budget" : "+ Set Budget"}
                  </button>
                </div>

                <div style={styles.budgetBarWrapper}>
                  <div style={styles.budgetBarLabels}>
                    <span>Usage: {budgetUsagePercent}%</span>
                    <span style={{ color: isOverBudget ? "#dc2626" : "#059669", fontWeight: "700" }}>
                      {isOverBudget ? "⚠️ Over Budget" : "✅ Within Budget"}
                    </span>
                  </div>
                  <div style={styles.progressBarTrack}>
                    <div
                      style={{
                        ...styles.progressBarFill,
                        width: `${Math.min(budgetUsagePercent, 100)}%`,
                        background: isOverBudget
                          ? "linear-gradient(90deg, #f59e0b, #ef4444)"
                          : "linear-gradient(90deg, #38bdf8, #0284c7)",
                      }}
                    />
                  </div>
                </div>

                <div style={styles.budgetNumbersRow}>
                  <div>
                    <span style={styles.budgetSubLabel}>Total Allocated</span>
                    <div style={styles.budgetBigVal}>₹{totalBudgetValue.toLocaleString()}</div>
                  </div>
                  <div>
                    <span style={styles.budgetSubLabel}>Total Spent</span>
                    <div style={{ ...styles.budgetBigVal, color: isOverBudget ? "#dc2626" : "#0f172a" }}>
                      ₹{totalExpenses.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span style={styles.budgetSubLabel}>Remaining</span>
                    <div style={{ ...styles.budgetBigVal, color: remainingBudget < 0 ? "#dc2626" : "#059669" }}>
                      ₹{remainingBudget.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Action Cards */}
            <div style={styles.quickActionsGrid}>
              <div style={styles.quickActionCard} onClick={() => setActiveTab("itinerary")}>
                <div style={styles.actionCardIcon}>🗓️</div>
                <div>
                  <h4 style={styles.actionCardTitle}>Plan Daily Activities</h4>
                  <p style={styles.actionCardDesc}>
                    {itineraries.length} activities scheduled. Add notes, places, and time.
                  </p>
                </div>
              </div>

              <div style={styles.quickActionCard} onClick={() => setActiveTab("expenses")}>
                <div style={styles.actionCardIcon}>💳</div>
                <div>
                  <h4 style={styles.actionCardTitle}>Track Expenses</h4>
                  <p style={styles.actionCardDesc}>
                    {expenses.length} expenses recorded. Log receipts and category costs.
                  </p>
                </div>
              </div>

              <div style={styles.quickActionCard} onClick={() => setActiveTab("members")}>
                <div style={styles.actionCardIcon}>👥</div>
                <div>
                  <h4 style={styles.actionCardTitle}>Trip Members</h4>
                  <p style={styles.actionCardDesc}>
                    {displayedMembers.length} collaborators on this trip. Manage roles.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================================================
            TAB 2: ITINERARY
        ================================================= */}
        {activeTab === "itinerary" && (
          <div style={styles.tabContent} className="animate-fade-in">
            <div style={styles.sectionHeaderRow}>
              <div>
                <h2 style={styles.tabSectionTitle}>Daily Itinerary & Activities</h2>
                <p style={styles.tabSectionSubtitle}>
                  Schedule events, sightseeing, and timeline details day by day
                </p>
              </div>

              <button style={styles.primaryActionButton} onClick={openAddModal}>
                <span>＋</span>
                <span>Add Activity</span>
              </button>
            </div>

            {loadingItinerary ? (
              <div style={styles.loadingCard}>⏳ Loading itinerary...</div>
            ) : itineraries.length === 0 ? (
              <div style={styles.emptyModuleCard}>
                <div style={styles.emptyModuleIcon}>🗓️</div>
                <h3 style={styles.emptyModuleTitle}>No itinerary planned yet</h3>
                <p style={styles.emptyModuleDesc}>
                  Start outlining your daily adventure by adding sightseeing stops, tours, and reservations.
                </p>
                <button style={styles.primaryActionButton} onClick={openAddModal}>
                  ＋ Add Your First Activity
                </button>
              </div>
            ) : (
              <div style={styles.timelineList}>
                {itineraries.map((item, index) => (
                  <div key={item?.id || index} style={styles.timelineItem}>
                    {/* Left Day Pill */}
                    <div style={styles.dayBadgeBox}>
                      <span style={styles.dayNumberText}>Day {item?.dayNumber || index + 1}</span>
                      {item?.date && (
                        <span style={styles.dayDateText}>{formatDate(item.date)}</span>
                      )}
                    </div>

                    {/* Timeline Line */}
                    <div style={styles.timelineDotLine}>
                      <div style={styles.timelineDot} />
                      <div style={styles.timelineVerticalLine} />
                    </div>

                    {/* Activity Card */}
                    <div style={styles.activityCard}>
                      <div style={styles.activityHeader}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          <h4 style={styles.activityTitle}>{item?.title || "Activity"}</h4>
                          {item?.startTime && (
                            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", background: "#f1f5f9", padding: "2px 8px", borderRadius: "6px" }}>
                              🕒 {item.startTime}
                            </span>
                          )}
                        </div>
                        <div style={styles.activityActionButtons}>
                          <button
                            style={styles.smallEditBtn}
                            onClick={() => openEditModal(item)}
                            title="Edit Activity"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            style={styles.smallDeleteBtn}
                            onClick={() => handleDeleteItinerary(item?.id)}
                            disabled={deletingItinerary === item?.id}
                            title="Delete Activity"
                          >
                            {deletingItinerary === item?.id ? "..." : "🗑️"}
                          </button>
                        </div>
                      </div>

                      {item?.description && (
                        <p style={styles.activityDesc}>{item.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =================================================
            TAB 3: BUDGET
        ================================================= */}
        {activeTab === "budget" && (
          <div style={styles.tabContent} className="animate-fade-in">
            <div style={styles.sectionHeaderRow}>
              <div>
                <h2 style={styles.tabSectionTitle}>Trip Budget Plan</h2>
                <p style={styles.tabSectionSubtitle}>
                  Allocate budgets across accommodation, dining, transport, and excursions
                </p>
              </div>

              <button style={styles.primaryActionButton} onClick={openBudgetModal}>
                <span>{budget ? "✏️ Update Budget" : "＋ Set Budget"}</span>
              </button>
            </div>

            <div style={styles.budgetGrid}>
              {/* Category Breakdown Cards */}
              <div style={styles.budgetCard}>
                <h3 style={styles.cardSectionTitle}>Allocated Categories</h3>
                <div style={styles.categoryAllocationList}>
                  <div style={styles.categoryAllocationItem}>
                    <span>🏨 Accommodation</span>
                    <strong>₹{Number(budget?.accommodationBudget || 0).toLocaleString()}</strong>
                  </div>
                  <div style={styles.categoryAllocationItem}>
                    <span>🍽️ Food & Dining</span>
                    <strong>₹{Number(budget?.foodBudget || 0).toLocaleString()}</strong>
                  </div>
                  <div style={styles.categoryAllocationItem}>
                    <span>🚗 Transportation</span>
                    <strong>₹{Number(budget?.transportBudget || 0).toLocaleString()}</strong>
                  </div>
                  <div style={styles.categoryAllocationItem}>
                    <span>🎟️ Activities & Tours</span>
                    <strong>₹{Number(budget?.activityBudget || 0).toLocaleString()}</strong>
                  </div>
                  <div style={styles.categoryAllocationItem}>
                    <span>🛍️ Miscellaneous</span>
                    <strong>₹{Number(budget?.miscellaneousBudget || 0).toLocaleString()}</strong>
                  </div>
                </div>
              </div>

              {/* Spending vs Allocation Chart Card */}
              <div style={styles.budgetCard}>
                <div style={styles.cardHeaderWithAction}>
                  <h3 style={styles.cardSectionTitle}>Expense Spending Summary</h3>
                  <div style={styles.chartTypeSegmentWrap}>
                    <button
                      type="button"
                      style={{
                        ...styles.chartSegmentBtn,
                        ...(expenseChartType === "pie" ? styles.chartSegmentBtnActive : {}),
                      }}
                      onClick={() => setExpenseChartType("pie")}
                    >
                      🥧 Pie
                    </button>
                    <button
                      type="button"
                      style={{
                        ...styles.chartSegmentBtn,
                        ...(expenseChartType === "bar" ? styles.chartSegmentBtnActive : {}),
                      }}
                      onClick={() => setExpenseChartType("bar")}
                    >
                      📊 Bar
                    </button>
                  </div>
                </div>
                <div style={styles.chartContainer}>
                  {expenseChartType === "pie" ? (
                    <Pie data={pieData} options={pieOptions} />
                  ) : (
                    <Bar data={barData} options={barOptions} />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================================================
            TAB 4: EXPENSES
        ================================================= */}
        {activeTab === "expenses" && (
          <div style={styles.tabContent} className="animate-fade-in">
            <div style={styles.sectionHeaderRow}>
              <div>
                <h2 style={styles.tabSectionTitle}>Recorded Expenses</h2>
                <p style={styles.tabSectionSubtitle}>
                  Keep track of shared spending, receipts, and category distribution
                </p>
              </div>

              <button style={styles.primaryActionButton} onClick={openAddExpenseModal}>
                <span>＋</span>
                <span>Add Expense</span>
              </button>
            </div>

            {loadingExpenses ? (
              <div style={styles.loadingCard}>⏳ Loading expenses...</div>
            ) : expenses.length === 0 ? (
              <div style={styles.emptyModuleCard}>
                <div style={styles.emptyModuleIcon}>💳</div>
                <h3 style={styles.emptyModuleTitle}>No expenses logged yet</h3>
                <p style={styles.emptyModuleDesc}>
                  Keep your budget in check by logging payments for hotels, food, transport, and tickets.
                </p>
                <button style={styles.primaryActionButton} onClick={openAddExpenseModal}>
                  ＋ Record First Expense
                </button>
              </div>
            ) : (
              <div style={styles.expensesTableCard}>
                <div style={styles.tableResponsiveWrapper}>
                  <table style={styles.expensesTable}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Category</th>
                        <th style={styles.th}>Date</th>
                        <th style={styles.th}>Receipt</th>
                        <th style={styles.thRight}>Amount</th>
                        <th style={styles.thRight}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.map((expense) => (
                        <tr key={expense.id} style={styles.tr}>
                          <td style={styles.td}>
                            <span style={styles.categoryBadge}>
                              {expense.category || "GENERAL"}
                            </span>
                          </td>
                          <td style={styles.td}>{formatDate(expense.expenseDate)}</td>
                          <td style={styles.td}>
                            {expense.receiptLink ? (
                              <a
                                href={expense.receiptLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={styles.receiptLink}
                              >
                                📎 View Receipt
                              </a>
                            ) : (
                              <span style={styles.noReceiptText}>—</span>
                            )}
                          </td>
                          <td style={styles.tdRight}>
                            <strong style={styles.expenseAmountText}>
                              ₹{Number(expense.amount || 0).toLocaleString()}
                            </strong>
                          </td>
                          <td style={styles.tdRight}>
                            <div style={styles.tableActionGroup}>
                              <button
                                style={styles.tableIconBtn}
                                onClick={() => openEditExpenseModal(expense)}
                                title="Edit Expense"
                              >
                                ✏️
                              </button>
                              <button
                                style={styles.tableDeleteBtn}
                                onClick={() => handleDeleteExpense(expense.id)}
                                disabled={deletingExpense === expense.id}
                                title="Delete Expense"
                              >
                                {deletingExpense === expense.id ? "..." : "🗑️"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =================================================
            TAB 5: MEMBERS
        ================================================= */}
        {activeTab === "members" && (
          <div style={styles.tabContent} className="animate-fade-in">
            <div style={styles.sectionHeaderRow}>
              <div>
                <h2 style={styles.tabSectionTitle}>Trip Collaborators</h2>
                <p style={styles.tabSectionSubtitle}>
                  People with access to view, edit, or manage this trip
                </p>
              </div>

              {canManageMembers && (
                <button style={styles.primaryActionButton} onClick={openAddMemberModal}>
                  <span>＋</span>
                  <span>Add Member</span>
                </button>
              )}
            </div>

            {loadingMembers ? (
              <div style={styles.loadingCard}>⏳ Loading members...</div>
            ) : (
              <div style={styles.membersGrid}>
                {displayedMembers.map((member, index) => {
                  const memberName =
                    member.user?.name ||
                    member.name ||
                    member.user?.email ||
                    member.email ||
                    "Unknown User";

                  const memberEmail =
                    member.user?.email || member.email || "";

                  const role =
                    member.role || member.user?.role || "MEMBER";

                  const memberUserId =
                    member.user?.id || member.userId;

                  const isOwnerItem = role === "OWNER" || member.isOwner;
                  const currentUserEmail = localStorage.getItem("userEmail");
                  const currentUserId = String(localStorage.getItem("userId") || "");

                  const isSelf =
                    (currentUserEmail && memberEmail === currentUserEmail) ||
                    (currentUserId && String(memberUserId) === currentUserId);

                  return (
                    <div key={member.id || memberUserId || index} style={styles.memberCard}>
                      <div style={styles.memberAvatarBox}>
                        <div
                          style={{
                            ...styles.memberAvatarCircle,
                            background: isOwnerItem ? "#b45309" : "#0284c7",
                          }}
                        >
                          {memberName.charAt(0).toUpperCase()}
                        </div>

                        <div>
                          <h4 style={styles.memberCardName}>{memberName}</h4>
                          {memberEmail && (
                            <p style={styles.memberCardEmail}>{memberEmail}</p>
                          )}
                        </div>
                      </div>

                      <div style={styles.memberCardFooter}>
                        <span
                          style={
                            role === "OWNER"
                              ? styles.ownerRoleBadge
                              : role === "GROUP_ADMIN"
                              ? styles.adminRoleBadge
                              : styles.memberRoleBadge
                          }
                        >
                          {role === "OWNER"
                            ? "👑 OWNER"
                            : role === "GROUP_ADMIN"
                            ? "🛡️ ADMIN"
                            : "👤 MEMBER"}
                        </span>

                        {canManageMembers && !isOwnerItem && !isSelf && (
                          <div style={styles.memberControlsRow}>
                            <button
                              style={styles.roleToggleBtn}
                              onClick={() => handleChangeRole(member)}
                              disabled={changingRole === memberUserId}
                            >
                              {changingRole === memberUserId
                                ? "..."
                                : role === "GROUP_ADMIN"
                                ? "Make Member"
                                : "Make Admin"}
                            </button>

                            <button
                              style={styles.removeMemberBtn}
                              onClick={() => handleRemoveMember(member)}
                              disabled={removingMember === memberUserId}
                              title="Remove user from trip"
                            >
                              {removingMember === memberUserId ? "..." : "Remove"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* =================================================
          MODAL 1: ADD MEMBER MODAL
      ================================================= */}
      {showAddMemberModal && (
        <div
          style={styles.modalOverlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeAddMemberModal();
          }}
        >
          <div style={styles.modalContainer} className="modal-content-animate">
            <div style={styles.modalHeader}>
              <div>
                <h3 style={styles.modalHeading}>✉️ Invite Trip Member</h3>
                <p style={styles.modalSubheading}>Send a secure invitation to a registered traveler</p>
              </div>
              <button
                style={styles.modalCloseBtn}
                onClick={closeAddMemberModal}
                disabled={invitingMember}
              >
                ✕
              </button>
            </div>

            {addMemberSuccess && (
              <div style={styles.modalSuccessBox}>✅ {addMemberSuccess}</div>
            )}

            {addMemberErrors.submit && (
              <div style={styles.modalErrorBox}>⚠️ {addMemberErrors.submit}</div>
            )}

            <form onSubmit={handleAddMemberSubmit}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>
                  Full Name <span style={styles.requiredStar}>*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={addMemberForm.fullName}
                  onChange={handleAddMemberChange}
                  style={styles.modalInput}
                  placeholder="e.g. Rahul Sharma"
                  autoFocus
                  disabled={invitingMember}
                />
                {addMemberErrors.fullName && (
                  <p style={styles.fieldError}>{addMemberErrors.fullName}</p>
                )}
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>
                  Email Address <span style={styles.requiredStar}>*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={addMemberForm.email}
                  onChange={handleAddMemberChange}
                  style={styles.modalInput}
                  placeholder="e.g. rahul@example.com"
                  disabled={invitingMember}
                />
                {addMemberErrors.email && (
                  <p style={styles.fieldError}>{addMemberErrors.email}</p>
                )}
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Phone Number (optional)</label>
                <input
                  type="tel"
                  name="phone"
                  value={addMemberForm.phone}
                  onChange={handleAddMemberChange}
                  style={styles.modalInput}
                  placeholder="+91 9876543210"
                  disabled={invitingMember}
                />
                {addMemberErrors.phone && (
                  <p style={styles.fieldError}>{addMemberErrors.phone}</p>
                )}
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Role Assignment</label>
                <select
                  name="role"
                  value={addMemberForm.role}
                  onChange={handleAddMemberChange}
                  style={styles.modalSelect}
                  disabled={invitingMember}
                >
                  <option value="MEMBER">Member (Collaborator)</option>
                  <option value="GROUP_ADMIN">Admin (Full Management)</option>
                </select>
              </div>

              <div style={styles.modalActions}>
                <button
                  type="button"
                  style={styles.modalCancelBtn}
                  onClick={closeAddMemberModal}
                  disabled={invitingMember}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={styles.modalSubmitBtn}
                  disabled={invitingMember}
                >
                  {invitingMember ? "Sending Invitation..." : "✉️ Send Invitation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================
          MODAL 2: ITINERARY MODAL
      ================================================= */}
      {showModal && (
        <div
          style={styles.modalOverlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div style={styles.modalContainer} className="modal-content-animate">
            <div style={styles.modalHeader}>
              <div>
                <h3 style={styles.modalHeading}>
                  {editingItinerary ? "✏️ Edit Activity" : "🗓️ Add Activity"}
                </h3>
                <p style={styles.modalSubheading}>
                  Schedule details for your trip itinerary
                </p>
              </div>
              <button style={styles.modalCloseBtn} onClick={closeModal}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveItinerary}>
              <div style={styles.formRow2Col}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Day Number *</label>
                  <input
                    type="number"
                    min="1"
                    name="dayNumber"
                    value={formData.dayNumber}
                    onChange={handleItineraryChange}
                    style={styles.modalInput}
                    placeholder="e.g. 1"
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Date (optional)</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleItineraryChange}
                    style={styles.modalInput}
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Activity Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleItineraryChange}
                  style={styles.modalInput}
                  placeholder="e.g. Visit Eiffel Tower & Seine Cruise"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Description & Notes</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleItineraryChange}
                  style={styles.modalTextarea}
                  rows="3"
                  placeholder="Add meeting spots, timings, dress codes, or notes..."
                />
              </div>

              <div style={styles.modalActions}>
                <button
                  type="button"
                  style={styles.modalCancelBtn}
                  onClick={closeModal}
                  disabled={savingItinerary}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={styles.modalSubmitBtn}
                  disabled={savingItinerary}
                >
                  {savingItinerary
                    ? "Saving..."
                    : editingItinerary
                    ? "Update Activity"
                    : "Save Activity"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================
          MODAL 3: BUDGET MODAL
      ================================================= */}
      {showBudgetModal && (
        <div
          style={styles.modalOverlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeBudgetModal();
          }}
        >
          <div style={styles.modalContainer} className="modal-content-animate">
            <div style={styles.modalHeader}>
              <div>
                <h3 style={styles.modalHeading}>💰 Trip Budget Allocation</h3>
                <p style={styles.modalSubheading}>
                  Plan your overall budget and breakdown
                </p>
              </div>
              <button style={styles.modalCloseBtn} onClick={closeBudgetModal}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBudget}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Total Budget (₹) *</label>
                <input
                  type="number"
                  name="totalBudget"
                  value={budgetForm.totalBudget}
                  onChange={handleBudgetChange}
                  style={styles.modalInput}
                  placeholder="e.g. 50000"
                  required
                />
              </div>

              <div style={styles.formRow2Col}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>🏨 Accommodation (₹)</label>
                  <input
                    type="number"
                    name="accommodationBudget"
                    value={budgetForm.accommodationBudget}
                    onChange={handleBudgetChange}
                    style={styles.modalInput}
                    placeholder="e.g. 20000"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>🍽️ Food & Dining (₹)</label>
                  <input
                    type="number"
                    name="foodBudget"
                    value={budgetForm.foodBudget}
                    onChange={handleBudgetChange}
                    style={styles.modalInput}
                    placeholder="e.g. 10000"
                  />
                </div>
              </div>

              <div style={styles.formRow2Col}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>🚗 Transport (₹)</label>
                  <input
                    type="number"
                    name="transportBudget"
                    value={budgetForm.transportBudget}
                    onChange={handleBudgetChange}
                    style={styles.modalInput}
                    placeholder="e.g. 8000"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>🎟️ Activities (₹)</label>
                  <input
                    type="number"
                    name="activityBudget"
                    value={budgetForm.activityBudget}
                    onChange={handleBudgetChange}
                    style={styles.modalInput}
                    placeholder="e.g. 7000"
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>🛍️ Miscellaneous (₹)</label>
                <input
                  type="number"
                  name="miscellaneousBudget"
                  value={budgetForm.miscellaneousBudget}
                  onChange={handleBudgetChange}
                  style={styles.modalInput}
                  placeholder="e.g. 5000"
                />
              </div>

              <div style={styles.modalActions}>
                <button
                  type="button"
                  style={styles.modalCancelBtn}
                  onClick={closeBudgetModal}
                  disabled={savingBudget}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={styles.modalSubmitBtn}
                  disabled={savingBudget}
                >
                  {savingBudget ? "Saving..." : "Save Budget"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================
          MODAL 4: EXPENSE MODAL
      ================================================= */}
      {showExpenseModal && (
        <div
          style={styles.modalOverlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeExpenseModal();
          }}
        >
          <div style={styles.modalContainer} className="modal-content-animate">
            <div style={styles.modalHeader}>
              <div>
                <h3 style={styles.modalHeading}>
                  {editingExpense ? "✏️ Edit Expense" : "💳 Record Expense"}
                </h3>
                <p style={styles.modalSubheading}>
                  Track your trip spending and receipts
                </p>
              </div>
              <button style={styles.modalCloseBtn} onClick={closeExpenseModal}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveExpense}>
              <div style={styles.formRow2Col}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Category *</label>
                  <select
                    name="category"
                    value={expenseForm.category}
                    onChange={handleExpenseChange}
                    style={styles.modalSelect}
                    required
                  >
                    <option value="ACCOMMODATION">🏨 Accommodation</option>
                    <option value="FOOD">🍽️ Food & Dining</option>
                    <option value="TRANSPORT">🚗 Transport</option>
                    <option value="ACTIVITIES">🎟️ Activities & Tours</option>
                    <option value="SHOPPING">🛍️ Shopping</option>
                    <option value="MISCELLANEOUS">📦 Miscellaneous</option>
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Amount (₹) *</label>
                  <input
                    type="number"
                    min="1"
                    name="amount"
                    value={expenseForm.amount}
                    onChange={handleExpenseChange}
                    style={styles.modalInput}
                    placeholder="e.g. 1500"
                    required
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Expense Date</label>
                <input
                  type="date"
                  name="expenseDate"
                  value={expenseForm.expenseDate}
                  onChange={handleExpenseChange}
                  style={styles.modalInput}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Receipt Link (optional URL)</label>
                <input
                  type="url"
                  name="receiptLink"
                  value={expenseForm.receiptLink}
                  onChange={handleExpenseChange}
                  style={styles.modalInput}
                  placeholder="https://drive.google.com/..."
                />
              </div>

              <div style={styles.modalActions}>
                <button
                  type="button"
                  style={styles.modalCancelBtn}
                  onClick={closeExpenseModal}
                  disabled={savingExpense}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={styles.modalSubmitBtn}
                  disabled={savingExpense}
                >
                  {savingExpense
                    ? "Saving..."
                    : editingExpense
                    ? "Update Expense"
                    : "Add Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================
          DELETE TRIP CONFIRMATION MODAL
      ================================================= */}
      {showDeleteModal && (
        <div
          style={styles.modalOverlay}
          onClick={() => !deletingTrip && setShowDeleteModal(false)}
        >
          <div
            style={{ ...styles.modalContainer, maxWidth: "460px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: "#fee2e2",
                  color: "#ef4444",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "26px",
                  margin: "0 auto 16px",
                }}
              >
                🗑️
              </div>
              <h3
                style={{
                  margin: "0 0 8px",
                  fontSize: "20px",
                  fontWeight: "800",
                  color: "#0f172a",
                }}
              >
                Delete This Trip?
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: "14px",
                  color: "#64748b",
                  lineHeight: "1.5",
                }}
              >
                Are you sure you want to delete{" "}
                <strong>"{trip.name || destinationName}"</strong>? This action
                cannot be undone. All itinerary activities, budgets, expenses,
                and member records will be permanently removed.
              </p>
            </div>

            {deleteTripError && (
              <div style={styles.modalErrorBox}>
                ⚠️ {deleteTripError}
              </div>
            )}

            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
                marginTop: "24px",
              }}
            >
              <button
                type="button"
                style={styles.modalCancelBtn}
                onClick={() => setShowDeleteModal(false)}
                disabled={deletingTrip}
              >
                Cancel
              </button>
              <button
                type="button"
                style={styles.modalDeleteBtn}
                onClick={confirmDeleteTrip}
                disabled={deletingTrip}
              >
                {deletingTrip ? "Deleting..." : "Yes, Delete Trip"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#F7F5FF",
    color: "#0f172a",
    display: "flex",
    flexDirection: "column",
  },

  container: {
    maxWidth: "1240px",
    width: "92%",
    margin: "0 auto",
    padding: "32px 0 60px",
  },

  loadingContainer: {
    padding: "80px 20px",
    textAlign: "center",
    color: "#64748b",
  },

  errorContainer: {
    padding: "80px 20px",
    textAlign: "center",
    maxWidth: "460px",
    margin: "0 auto",
  },

  spinnerEmoji: {
    fontSize: "44px",
    marginBottom: "12px",
  },

  errorEmoji: {
    fontSize: "52px",
    marginBottom: "14px",
  },

  backBtn: {
    display: "inline-block",
    marginTop: "20px",
    background: "#0284c7",
    color: "#ffffff",
    padding: "10px 20px",
    borderRadius: "8px",
    fontWeight: "600",
    textDecoration: "none",
  },

  /* Hero Banner */
  heroBanner: {
    background: "linear-gradient(135deg, #075985 0%, #0369a1 40%, #1e1b4b 100%)",
    borderRadius: "20px",
    padding: "36px 40px 28px",
    color: "#ffffff",
    marginBottom: "24px",
    boxShadow: "0 12px 32px rgba(3, 105, 161, 0.16)",
  },

  heroTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
    flexWrap: "wrap",
    marginBottom: "28px",
  },

  heroLeftContainer: {
    display: "flex",
    gap: "24px",
    alignItems: "center",
    flexWrap: "wrap",
    flex: 1,
    minWidth: "280px",
  },

  heroThumbWrap: {
    width: "110px",
    height: "110px",
    borderRadius: "18px",
    overflow: "hidden",
    border: "2px solid rgba(255, 255, 255, 0.4)",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.25)",
    flexShrink: 0,
    backgroundColor: "#e2e8f0",
  },

  heroThumbImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },

  heroLeft: {
    maxWidth: "640px",
  },

  heroBadgeRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "10px",
  },

  destBadge: {
    background: "rgba(255, 255, 255, 0.2)",
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "700",
  },

  statusPill: {
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "800",
    letterSpacing: "0.5px",
  },

  heroHeading: {
    margin: "0 0 10px",
    fontSize: "clamp(24px, 4vw, 36px)",
    fontWeight: "800",
    color: "#ffffff",
  },

  heroMetaRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "13px",
    color: "#e0f2fe",
    flexWrap: "wrap",
  },

  heroActions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },

  editTripBtn: {
    background: "#0284c7",
    color: "#ffffff",
    border: "none",
    padding: "9px 18px",
    borderRadius: "9px",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(2, 132, 199, 0.35)",
    transition: "all 0.15s ease",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
  },

  deleteTripBtn: {
    background: "rgba(239, 68, 68, 0.88)",
    color: "#ffffff",
    border: "1px solid rgba(254, 202, 202, 0.3)",
    padding: "9px 18px",
    borderRadius: "9px",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(239, 68, 68, 0.3)",
    transition: "all 0.15s ease",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
  },

  backTripBtn: {
    background: "rgba(255, 255, 255, 0.12)",
    color: "#ffffff",
    border: "1px solid rgba(255, 255, 255, 0.25)",
    padding: "9px 18px",
    borderRadius: "9px",
    fontSize: "13px",
    fontWeight: "600",
    textDecoration: "none",
    backdropFilter: "blur(6px)",
    display: "inline-flex",
    alignItems: "center",
    transition: "all 0.15s ease",
  },

  /* Metrics Strip */
  metricsStrip: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "#ffffff",
    borderRadius: "14px",
    padding: "16px 24px",
    color: "#0f172a",
    boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
    flexWrap: "wrap",
    gap: "14px",
  },

  metricStripItem: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },

  metricStripLabel: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#64748b",
  },

  metricStripVal: {
    fontSize: "16px",
    fontWeight: "800",
    color: "#0f172a",
  },

  metricStripDivider: {
    width: "1px",
    height: "28px",
    background: "#e2e8f0",
  },

  /* Tab Nav */
  tabNav: {
    display: "flex",
    gap: "8px",
    background: "#ffffff",
    padding: "8px 12px",
    borderRadius: "14px",
    border: "1px solid #e2e8f0",
    marginBottom: "28px",
    overflowX: "auto",
    boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
  },

  tabButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 18px",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#64748b",
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "all 0.15s ease",
  },

  tabButtonActive: {
    background: "#f0f9ff",
    color: "#0284c7",
    fontWeight: "700",
  },

  tabCountBadge: {
    padding: "2px 8px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: "700",
  },

  tabContent: {
    animation: "fadeIn 0.25s ease-out forwards",
  },

  /* Section Header */
  sectionHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
    flexWrap: "wrap",
    gap: "16px",
  },

  tabSectionTitle: {
    margin: 0,
    fontSize: "22px",
    fontWeight: "800",
    color: "#0f172a",
  },

  tabSectionSubtitle: {
    margin: "4px 0 0",
    fontSize: "14px",
    color: "#64748b",
  },

  primaryActionButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "#0284c7",
    color: "#ffffff",
    padding: "10px 20px",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(2, 132, 199, 0.2)",
  },

  /* Overview Tab */
  overviewGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
    gap: "20px",
    marginBottom: "24px",
  },

  sectionCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "26px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
  },

  cardSectionTitle: {
    margin: "0 0 18px",
    fontSize: "17px",
    fontWeight: "700",
    color: "#0f172a",
  },

  /* Weather Card Styles */
  weatherLiveBadge: {
    background: "#e0f2fe",
    color: "#0284c7",
    fontSize: "11px",
    fontWeight: "700",
    padding: "3px 10px",
    borderRadius: "12px",
    border: "1px solid #bae6fd",
  },

  weatherLoadingBox: {
    padding: "24px 0",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
  },

  weatherMiniSpinner: {
    width: "24px",
    height: "24px",
    border: "3px solid #e2e8f0",
    borderTopColor: "#0284c7",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },

  weatherLoadingText: {
    fontSize: "13px",
    color: "#64748b",
  },

  weatherUnavailableBox: {
    padding: "20px 0",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
  },

  weatherUnavailableIcon: {
    fontSize: "28px",
  },

  weatherUnavailableText: {
    fontSize: "14px",
    color: "#64748b",
    margin: 0,
    fontWeight: "500",
  },

  weatherRetryBtn: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    color: "#0284c7",
    fontSize: "12px",
    fontWeight: "600",
    padding: "4px 12px",
    borderRadius: "6px",
    cursor: "pointer",
  },

  weatherCardContent: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },

  weatherMainRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
    background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
    borderRadius: "12px",
    border: "1px solid #bae6fd",
  },

  weatherTempWrap: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  weatherIconEmoji: {
    fontSize: "32px",
    lineHeight: 1,
  },

  weatherTempText: {
    fontSize: "28px",
    fontWeight: "800",
    color: "#0369a1",
    letterSpacing: "-0.5px",
  },

  weatherConditionWrap: {
    textAlign: "right",
  },

  weatherConditionText: {
    display: "block",
    fontSize: "14px",
    fontWeight: "700",
    color: "#0f172a",
  },

  weatherCitySub: {
    display: "block",
    fontSize: "12px",
    color: "#0369a1",
    fontWeight: "500",
    marginTop: "2px",
  },

  weatherMetricsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },

  weatherMetricItem: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "10px 14px",
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },

  weatherMetricLabel: {
    fontSize: "11px",
    color: "#64748b",
    fontWeight: "600",
  },

  weatherMetricVal: {
    fontSize: "15px",
    color: "#0f172a",
    fontWeight: "700",
  },

  weatherFooterNote: {
    fontSize: "11px",
    color: "#94a3b8",
    textAlign: "right",
    paddingTop: "2px",
  },

  /* Chart Type Selector */
  chartTypeSegmentWrap: {
    display: "flex",
    background: "#f1f5f9",
    padding: "3px",
    borderRadius: "8px",
    gap: "2px",
  },

  chartSegmentBtn: {
    border: "none",
    background: "transparent",
    color: "#64748b",
    padding: "4px 10px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },

  chartSegmentBtnActive: {
    background: "#ffffff",
    color: "#0284c7",
    fontWeight: "700",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  },

  cardHeaderWithAction: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "18px",
  },

  inlineActionBtn: {
    background: "#f0f9ff",
    color: "#0284c7",
    border: "1px solid #bae6fd",
    padding: "6px 12px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  },

  infoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "14px",
  },

  infoBox: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "12px 14px",
    display: "flex",
    flexDirection: "column",
    gap: "3px",
  },

  infoLabel: {
    fontSize: "11px",
    color: "#94a3b8",
    fontWeight: "600",
  },

  infoValue: {
    fontSize: "14px",
    color: "#0f172a",
  },

  budgetBarWrapper: {
    marginBottom: "22px",
  },

  budgetBarLabels: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "12px",
    fontWeight: "600",
    marginBottom: "8px",
    color: "#64748b",
  },

  progressBarTrack: {
    height: "10px",
    background: "#e2e8f0",
    borderRadius: "6px",
    overflow: "hidden",
  },

  progressBarFill: {
    height: "100%",
    borderRadius: "6px",
    transition: "width 0.4s ease",
  },

  budgetNumbersRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "12px",
    borderTop: "1px solid #f1f5f9",
    paddingTop: "16px",
  },

  budgetSubLabel: {
    fontSize: "11px",
    color: "#64748b",
    fontWeight: "600",
  },

  budgetBigVal: {
    fontSize: "16px",
    fontWeight: "800",
    color: "#0f172a",
    marginTop: "2px",
  },

  quickActionsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "18px",
  },

  quickActionCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "20px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    cursor: "pointer",
    boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
    transition: "transform 0.15s, border-color 0.15s",
  },

  actionCardIcon: {
    fontSize: "30px",
    width: "50px",
    height: "50px",
    background: "#f0f9ff",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  actionCardTitle: {
    margin: "0 0 4px",
    fontSize: "15px",
    fontWeight: "700",
    color: "#0f172a",
  },

  actionCardDesc: {
    margin: 0,
    fontSize: "12px",
    color: "#64748b",
    lineHeight: "1.4",
  },

  /* Itinerary Tab Timeline */
  timelineList: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },

  timelineItem: {
    display: "grid",
    gridTemplateColumns: "100px 30px 1fr",
    alignItems: "stretch",
    gap: "12px",
  },

  dayBadgeBox: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "flex-end",
    textAlign: "right",
  },

  dayNumberText: {
    fontSize: "14px",
    fontWeight: "800",
    color: "#0284c7",
  },

  dayDateText: {
    fontSize: "11px",
    color: "#94a3b8",
  },

  timelineDotLine: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },

  timelineDot: {
    width: "14px",
    height: "14px",
    borderRadius: "50%",
    background: "#0284c7",
    border: "3px solid #e0f2fe",
    marginTop: "16px",
    flexShrink: 0,
  },

  timelineVerticalLine: {
    width: "2px",
    flex: 1,
    background: "#e2e8f0",
    marginTop: "4px",
  },

  activityCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "18px 22px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
  },

  activityHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "14px",
    marginBottom: "8px",
  },

  activityTitle: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "700",
    color: "#0f172a",
  },

  activityActionButtons: {
    display: "flex",
    gap: "6px",
  },

  smallEditBtn: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    color: "#475569",
    padding: "4px 10px",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: "600",
    cursor: "pointer",
  },

  smallDeleteBtn: {
    background: "#fef2f2",
    border: "1px solid #fee2e2",
    color: "#b91c1c",
    padding: "4px 8px",
    borderRadius: "6px",
    fontSize: "11px",
    cursor: "pointer",
  },

  activityDesc: {
    margin: 0,
    fontSize: "13px",
    color: "#64748b",
    lineHeight: "1.5",
  },

  /* Budget Tab */
  budgetGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
    gap: "24px",
  },

  budgetCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "26px",
  },

  categoryAllocationList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  categoryAllocationItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 14px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    fontSize: "14px",
  },

  chartContainer: {
    height: "240px",
    position: "relative",
  },

  /* Expenses Tab */
  expensesTableCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
  },

  tableResponsiveWrapper: {
    overflowX: "auto",
  },

  expensesTable: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
  },

  th: {
    padding: "14px 18px",
    background: "#f8fafc",
    fontSize: "12px",
    fontWeight: "700",
    color: "#64748b",
    borderBottom: "1px solid #e2e8f0",
  },

  thRight: {
    padding: "14px 18px",
    background: "#f8fafc",
    fontSize: "12px",
    fontWeight: "700",
    color: "#64748b",
    borderBottom: "1px solid #e2e8f0",
    textAlign: "right",
  },

  tr: {
    borderBottom: "1px solid #f1f5f9",
  },

  td: {
    padding: "14px 18px",
    fontSize: "13px",
    color: "#334155",
  },

  tdRight: {
    padding: "14px 18px",
    fontSize: "13px",
    color: "#334155",
    textAlign: "right",
  },

  categoryBadge: {
    background: "#f1f5f9",
    color: "#0f172a",
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "700",
  },

  receiptLink: {
    fontSize: "12px",
    color: "#0284c7",
    fontWeight: "600",
  },

  noReceiptText: {
    color: "#cbd5e1",
  },

  expenseAmountText: {
    fontSize: "15px",
    fontWeight: "800",
    color: "#0f172a",
  },

  tableActionGroup: {
    display: "inline-flex",
    gap: "6px",
  },

  tableIconBtn: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    padding: "5px 9px",
    borderRadius: "6px",
    fontSize: "11px",
    cursor: "pointer",
  },

  tableDeleteBtn: {
    background: "#fef2f2",
    border: "1px solid #fee2e2",
    color: "#b91c1c",
    padding: "5px 9px",
    borderRadius: "6px",
    fontSize: "11px",
    cursor: "pointer",
  },

  /* Members Tab */
  membersGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "20px",
  },

  memberCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    gap: "18px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
  },

  memberAvatarBox: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },

  memberAvatarCircle: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "17px",
    fontWeight: "700",
    flexShrink: 0,
  },

  memberCardName: {
    margin: "0 0 2px",
    fontSize: "15px",
    fontWeight: "700",
    color: "#0f172a",
  },

  memberCardEmail: {
    margin: 0,
    fontSize: "12px",
    color: "#64748b",
  },

  memberCardFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderTop: "1px solid #f1f5f9",
    paddingTop: "14px",
    flexWrap: "wrap",
    gap: "10px",
  },

  ownerRoleBadge: {
    background: "#fef3c7",
    color: "#b45309",
    padding: "5px 11px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "800",
  },

  adminRoleBadge: {
    background: "#dbeafe",
    color: "#1d4ed8",
    padding: "5px 11px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "800",
  },

  memberRoleBadge: {
    background: "#f1f5f9",
    color: "#475569",
    padding: "5px 11px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "800",
  },

  memberControlsRow: {
    display: "flex",
    gap: "6px",
  },

  roleToggleBtn: {
    background: "#ffffff",
    border: "1px solid #cbd5e1",
    color: "#334155",
    padding: "5px 10px",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: "600",
    cursor: "pointer",
  },

  removeMemberBtn: {
    background: "#fef2f2",
    border: "1px solid #fee2e2",
    color: "#b91c1c",
    padding: "5px 10px",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: "600",
    cursor: "pointer",
  },

  /* Empty Modules */
  emptyModuleCard: {
    background: "#ffffff",
    border: "2px dashed #cbd5e1",
    borderRadius: "18px",
    padding: "50px 24px",
    textAlign: "center",
    maxWidth: "500px",
    margin: "0 auto",
  },

  emptyModuleIcon: {
    fontSize: "44px",
    marginBottom: "12px",
  },

  emptyModuleTitle: {
    margin: "0 0 6px",
    fontSize: "18px",
    fontWeight: "700",
  },

  emptyModuleDesc: {
    fontSize: "13px",
    color: "#64748b",
    marginBottom: "20px",
    lineHeight: "1.5",
  },

  loadingCard: {
    padding: "40px",
    textAlign: "center",
    color: "#64748b",
  },

  /* Modals */
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(15, 23, 42, 0.6)",
    backdropFilter: "blur(6px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2000,
    padding: "16px",
  },

  modalContainer: {
    background: "#ffffff",
    borderRadius: "20px",
    width: "100%",
    maxWidth: "520px",
    padding: "32px",
    boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.25)",
    maxHeight: "90vh",
    overflowY: "auto",
  },

  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "24px",
  },

  modalHeading: {
    margin: "0 0 4px",
    fontSize: "20px",
    fontWeight: "800",
    color: "#0f172a",
  },

  modalSubheading: {
    margin: 0,
    fontSize: "13px",
    color: "#64748b",
  },

  modalCloseBtn: {
    background: "#f1f5f9",
    border: "none",
    borderRadius: "50%",
    width: "32px",
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    color: "#64748b",
    cursor: "pointer",
  },

  modalSuccessBox: {
    background: "#ecfdf5",
    border: "1px solid #a7f3d0",
    color: "#059669",
    padding: "12px 16px",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: "600",
    marginBottom: "18px",
  },

  modalErrorBox: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#b91c1c",
    padding: "12px 16px",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: "600",
    marginBottom: "18px",
  },

  formGroup: {
    marginBottom: "18px",
  },

  formRow2Col: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "14px",
  },

  formLabel: {
    display: "block",
    fontSize: "13px",
    fontWeight: "600",
    color: "#334155",
    marginBottom: "6px",
  },

  requiredStar: {
    color: "#ef4444",
  },

  modalInput: {
    width: "100%",
    padding: "11px 14px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
  },

  modalSelect: {
    width: "100%",
    padding: "11px 14px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    background: "#ffffff",
    outline: "none",
    boxSizing: "border-box",
  },

  modalTextarea: {
    width: "100%",
    padding: "11px 14px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
  },

  fieldError: {
    margin: "4px 0 0",
    fontSize: "12px",
    color: "#b91c1c",
  },

  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "26px",
  },

  modalCancelBtn: {
    padding: "10px 18px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#475569",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },

  modalSubmitBtn: {
    padding: "10px 22px",
    borderRadius: "10px",
    border: "none",
    background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(2, 132, 199, 0.25)",
  },

  modalDeleteBtn: {
    padding: "10px 22px",
    borderRadius: "10px",
    border: "none",
    background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(239, 68, 68, 0.3)",
    transition: "all 0.15s ease",
  },
};

export default TripDetails;