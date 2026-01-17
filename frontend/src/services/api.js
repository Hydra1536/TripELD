import axios from "axios";

const API = axios.create({
  baseURL: "https://tripeld.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export const createTrip = async (data) => {
  const res = await API.post("/trips/create/", data);
  return res.data;
};
