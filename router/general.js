const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

const BASE = "http://localhost:5000";

// Register
public_users.post("/register", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ message: "Username and password required" });
  if (users.some(u => u.username === username))
    return res.status(409).json({ message: "User already exists" });
  users.push({ username, password });
  return res.status(200).json({ message: "User successfully registered. Now you can login" });
});

// Raw data endpoints (Axios calls these)
public_users.get("/books", (req, res) => res.status(200).json(books));
public_users.get("/books/isbn/:isbn", (req, res) => {
  const book = books[req.params.isbn];
  return book ? res.status(200).json(book) : res.status(404).json({ message: "Book not found" });
});
public_users.get("/books/author/:author", (req, res) => {
  const result = Object.entries(books)
    .filter(([_, b]) => b.author.toLowerCase() === req.params.author.toLowerCase())
    .map(([isbn, b]) => ({ isbn, ...b }));
  return res.status(200).json({ booksbyauthor: result });
});
public_users.get("/books/title/:title", (req, res) => {
  const result = Object.entries(books)
    .filter(([_, b]) => b.title.toLowerCase() === req.params.title.toLowerCase())
    .map(([isbn, b]) => ({ isbn, ...b }));
  return res.status(200).json({ booksbytitle: result });
});

// All books - async/await + Axios
public_users.get("/", async (req, res) => {
  try {
    const response = await axios.get(`${BASE}/books`);
    return res.status(200).send(JSON.stringify(response.data, null, 4));
  } catch (e) {
    return res.status(500).json({ message: "Error fetching books" });
  }
});

// By ISBN - Promise callbacks + Axios
public_users.get("/isbn/:isbn", (req, res) => {
  axios.get(`${BASE}/books/isbn/${req.params.isbn}`)
    .then(r => res.status(200).json(r.data))
    .catch(() => res.status(404).json({ message: "Book not found" }));
});

// By author - async/await + Axios
public_users.get("/author/:author", async (req, res) => {
  try {
    const r = await axios.get(`${BASE}/books/author/${encodeURIComponent(req.params.author)}`);
    return res.status(200).json(r.data);
  } catch (e) {
    return res.status(500).json({ message: "Error fetching by author" });
  }
});

// By title - Promise callbacks + Axios
public_users.get("/title/:title", (req, res) => {
  axios.get(`${BASE}/books/title/${encodeURIComponent(req.params.title)}`)
    .then(r => res.status(200).json(r.data))
    .catch(() => res.status(500).json({ message: "Error fetching by title" }));
});

// Reviews
public_users.get("/review/:isbn", (req, res) => {
  const book = books[req.params.isbn];
  return book ? res.status(200).json(book.reviews) : res.status(404).json({ message: "Book not found" });
});

module.exports.general = public_users;
