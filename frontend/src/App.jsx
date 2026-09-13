import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import Destinations from "./pages/Destinations";
import DestinationDetails from "./pages/DestinationDetails";
import Trips from "./pages/Trips";
import CreateTrip from "./pages/CreateTrip";
import TripDetails from "./pages/TripDetails";
import CreateItinerary from "./pages/CreateItinerary";
import EditTrip from "./pages/EditTrip";
import TripInvitation from "./pages/TripInvitation";
import Notifications from "./pages/Notifications";

function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* Landing & Authentication */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* User & Admin */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/notifications" element={<Notifications />} />

        {/* Destinations */}
        <Route path="/destinations" element={<Destinations />} />

        <Route
          path="/destination-details/:placeId"
          element={<DestinationDetails />}
        />

        <Route path="/trips" element={<Trips />} />

        <Route path="/trips/create" element={<CreateTrip />} />

        <Route path="/trips/:id" element={<TripDetails />} />

        <Route path="/trips/:id/edit" element={<EditTrip />} />

        <Route
          path="/trips/:id/itineraries/create"
          element={<CreateItinerary />}
        />

        {/* Trip Invitation */}
        <Route path="/trip-invitation/:token" element={<TripInvitation />} />

      </Routes>

    </BrowserRouter>
  );
}

export default App;