import axios from "axios";

const API = axios.create({
  // baseURL: "http://127.0.0.1:8000/api",
    baseURL: "https://tripeld.onrender.com/api",

});

export const createTrip = (data) => API.post("/api/trips/create/", data);
