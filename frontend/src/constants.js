export const API_BASE_URL = "http://127.0.0.1:8000";
export const AI_SERVICE_URL = "http://127.0.0.1:8001";

export const initialForm = {
  company: "",
  position: "",
  status: "saved",
  location: "",
  applied_date: "",
  source: "",
  notes: "",
  favorite: false,
};

export const statusOptions = ["saved", "applied", "interview", "offer", "rejected"];

export const statusLabels = {
  saved: "Saved",
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
};

export const statusColors = {
  saved: "#64748b",
  applied: "#2563eb",
  interview: "#d97706",
  offer: "#16a34a",
  rejected: "#dc2626",
};
