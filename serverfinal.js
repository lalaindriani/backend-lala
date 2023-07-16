const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken')

const app = express();
app.use(express.json())
app.use(cors())
const port = 3333;
const uri = 'mongodb+srv://lalaindriani:lalaindriani@cluster0.g0dsiuf.mongodb.net/?retryWrites=true&w=majority';

const RencanaSchema = new mongoose.Schema({
    rencana: {
      type: String,
      required: true
    },
    waktu: {
      type: String,
      required: true
    },
    keterangan: {
      type: String,
      required: true
    }
  });
  
  const Rencana = mongoose.model('Rencana', RencanaSchema);


const userSchema = new mongoose.Schema({
    username: {
      type: String,
      required: true,
      unique: true
    },
    password: {
      type: String,
      required: true
    }
  });
  
  const User = mongoose.model('User', userSchema);


// Create a new Rencana
const createRencana = async (req, res) => {
    try {
      const { rencana, waktu, keterangan } = req.body;
      const newRencana = new Rencana({ rencana, waktu, keterangan });
      const savedRencana = await newRencana.save();
      res.status(201).json(savedRencana);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  
  // Get all Rencana
  const getAllRencana = async (req, res) => {
    try {
      const allRencana = await Rencana.find();
      res.status(200).json(allRencana);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  
  // Get a specific Rencana by ID
  const getRencanaById = async (req, res) => {
    try {
      const { id } = req.params;
      const foundRencana = await Rencana.findById(id);
      if (foundRencana) {
        res.status(200).json(foundRencana);
      } else {
        res.status(404).json({ message: 'Rencana not found' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  
  // Update a Rencana by ID
  const updateRencanaById = async (req, res) => {
    try {
      const { id } = req.params;
      const { rencana, waktu, keterangan } = req.body;
      const updatedRencana = await Rencana.findByIdAndUpdate(
        id,
        { rencana, waktu, keterangan },
        { new: true }
      );
      if (updatedRencana) {
        res.status(200).json(updatedRencana);
      } else {
        res.status(404).json({ message: 'Rencana not found' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  
  // Delete a Rencana by ID
  const deleteRencanaById = async (req, res) => {
    try {
      const { id } = req.params;
      const deletedRencana = await Rencana.findByIdAndDelete(id);
      if (deletedRencana) {
        res.status(200).json({ message: 'Rencana deleted successfully' });
      } else {
        res.status(404).json({ message: 'Rencana not found' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  const isAuthenticated = (req, res, next) => {
    try {
      const token = req.headers.authorization.split(' ')[1]; // Extract token from the Authorization header
      const decoded = jwt.verify(token, 'lalaindri'); // Verify the token using the secret key
  
      // Attach the decoded token to the request object
      req.user = decoded.user;
  
      next(); // Move to the next middleware
    } catch (error) {
      console.error(error);
      return res.status(401).json({ error: 'Invalid token' });
    }
  };

  // Assuming the necessary imports are available, such as User model and jwt

async function registerUser(req, res) {
    try {
      const { username, password } = req.body;
  
      // Check if username already exists
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ error: 'Username already exists' });
      }
  
      // Create a new user
      const newUser = new User({
        username,
        password, // Saving password as plain text (Not recommended)
      });
  
      // Save the user to the database
      await newUser.save();
  
      res.json({ message: 'User registered successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  }
  
  async function login(req, res) {
    try {
      const { username, password } = req.body;
  
      // Check if user exists
      const user = await User.findOne({ username });
      if (!user) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }
  
      // Check password (No bcrypt, comparing plain text)
      if (user.password !== password) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }
  
      // Generate JWT token
      const token = jwt.sign({ user: user.username }, 'lalaindri', { expiresIn: '1h' });
  
      // Set the JWT token as a cookie
      res.cookie('token', token, { maxAge: 3600000, httpOnly: true }); // Expiry set to 1 hour (3600000 milliseconds)
  
      // Return the token as a response
      res.json({ token });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  }
  

// Create a new Rencana
app.post('/rencana', isAuthenticated, createRencana);

// Get all Rencana
app.get('/rencana', isAuthenticated, getAllRencana);

// Get a specific Rencana by ID
app.get('/rencana/:id', getRencanaById);

// Update a Rencana by ID
app.put('/rencana/:id', isAuthenticated, updateRencanaById);

// Delete a Rencana by ID
app.delete('/rencana/:id', isAuthenticated, deleteRencanaById);

// Register a new user
app.post('/register', registerUser);

// Login user
app.post('/login', login);







// Connect to MongoDB
const connect = async () => {
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB!");
  } catch (error) {
    throw error;
  }
};

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected!");
});

// Start the server
connect().then(() => {
  const port = process.env.PORT || 3333;
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
});