/** 
  All endpoints are primary used for The Passport App
**/
require('../instrument.js');

const Sentry = require('@sentry/node');

const express = require('express');
const app = express();
const axios = require('axios');
const serverless = require('serverless-http');
const router = express.Router();
const bodyParser = require('body-parser');
const cors = require('cors');
const compression = require('compression');
const dotenv = require('dotenv').config({path:'../.env'});
const zlib = require('zlib');
const multer = require('multer');
const fs = require('fs');
const FormData = require('form-data');
// const upload = multer({ dest: '/uploads/' });
const multiparty = require('multiparty');
const { getAccessToken } = require('../firebase-admin-config');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { requestLogger } = require('../log/log');
const { errorLogger } = require('../log/error_log');
const ipAndCountryBlocker = require('../access/black_list');

// List of allowed origins
const allowedOrigins = ['https://sportspassports.com', 'https://statplatform.sportspassports.com', 'http://dev.statplatform.sportspassports.com:8080', 'https://expressjs.sportspassports.com', 'http://dev.statplatform.sportspassports.com:19006', 'https://dev.sportspassports.com', 'http://dev.statplatform.sportspassports.com:3000'];

// CORS options
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Check if the origin is in the list of allowed origins
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

// Rate limit rule
const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 1000,
  message: 'Too many requests from this IP, please try again later.',
});

app.use(cors(corsOptions));
app.use(compression());
app.use(limiter);
app.use(requestLogger);
app.use(ipAndCountryBlocker);

const siteUrl = (hostType) => {
  if(hostType.includes('dev.')){
    return 'https://dev.sportspassports.com';
  }else{
//     return 'https://dev.sportspassports.com';
    return'https://sportspassports.com';
  }
}

// // GET: Stats for leaderboard
// app.get('/api/stat-leaderboard/v1/:requestType/:orgId/:eventId/:statType/:lvPlay/:division/:year', cors(corsOptions), (req, res) => {
//   const getRequestType = req.params.requestType;
//   const getOrgId = req.params.orgId;
//   const getEventId = req.params.eventId;
//   const getStatType = req.params.statType;
//   const getLvPlay = req.params.lvPlay;
//   const getDivision = req.params.division;
//   const getYear = req.params.year;
//   // Change this to live site before depoy the project
//   const fullUrl = 'https://dev.sportspassports.com';
//   let dataUrl = fullUrl + '/wp-json/app-stat-data-request/v1/' + getRequestType + '/' + getOrgId + '/' + getEventId + '/' + getStatType + '/' + getLvPlay + '/' + getDivision + '/' + getYear;
//   axios.get(`${dataUrl}`)
//     .then(response => {
//       // Handle the response data here
//       res.json(response.data);
//     })
//     .catch(error => {
//       // Handle any errors here
//       console.error('Error:', error);
//     });
// });

// GET: Team standings
app.get('/api/team-standing/v1/:requestType/:selectYear/:divisionList/:groupType', cors(corsOptions), (req, res) => {
  const getRequestType = req.params.requestType;
  const getSelectYear = req.params.selectYear;
  const getDivisionList = req.params.divisionList;
  const getGroupType = req.params.groupType;
  // Change this to live site before depoy the project
  const fullUrl = 'https://dev.sportspassports.com';
  let dataUrl = fullUrl + '/wp-json/app-standing-data-request/v1/' + getRequestType + '/' + getSelectYear + '/' + getDivisionList + '/' + getGroupType;
  axios.get(`${dataUrl}`)
    .then(response => {
      // Handle the response data here
      res.json(response.data);
    })
    .catch(error => {
      // Handle any errors here
      console.error('Error:', error);
    });
});

// GET: Box Scores
app.get('/api/box-score/v1/:requestType/:teamId/:orgId/:gameId/:selectYear', cors(corsOptions), (req, res) => {
  const getRequestType = req.params.requestType;
  const getTeamId = req.params.teamId;
  const getOrgId = req.params.orgId;
  const getSelectYear = req.params.selectYear;
  const getGameId = req.params.gameId;
  // Change this to live site before depoy the project
  const fullUrl = 'https://dev.sportspassports.com';
  let dataUrl = fullUrl + '/wp-json/app-boxscore-data-request/v1/' + getRequestType + '/' + getTeamId + '/' + getOrgId + '/' + getGameId + '/' + getSelectYear;
  axios.get(`${dataUrl}`)
    .then(response => {
      // Handle the response data here
      res.json(response.data);
    })
    .catch(error => {
      // Handle any errors here
      console.error('Error:', error);
    });
});

// App Player Profile Data
app.get('/api/player-data/v1/:requestType/:playerId/:argsOne/:argsTwo', cors(corsOptions), (req, res) => {
  const getRequestType = req.params.requestType;
  const getPlayerId = req.params.playerId;
  const getArgsOne = (req.params.argsOne) ? req.params.argsOne : '';
  const getArgsTwo = (req.params.argsTwo) ? req.params.argsTwo : '';
  // Change this to live site before depoy the project
  const fullUrl = 'https://dev.sportspassports.com';
  let dataUrl = fullUrl + '/wp-json/app-player-data-request/v1/' + getRequestType + '/' + getPlayerId + '/' + getArgsOne + '/' + getArgsTwo;
  axios.get(`${dataUrl}`)
    .then(response => {
      // Handle the response data here
      res.json(response.data);
    })
    .catch(error => {
      // Handle any errors here
      console.error('Error:', error);
    });
});

// GET: User owned data
app.get('/api/user-data/v1/:requestType/:userId', cors(corsOptions), (req, res) => {
  const getRequestType = req.params.requestType;
  const getUserId = req.params.userId;
  // Change this to live site before depoy the project
  const fullUrl = 'https://dev.sportspassports.com';
  let dataUrl = fullUrl + '/wp-json/app-user-data-request/v1/' + getRequestType + '/' + getUserId;
  axios.get(`${dataUrl}`)
    .then(response => {
      // Handle the response data here
      res.json(response.data);
    })
    .catch(error => {
      // Handle any errors here
      console.error('Error:', error);
    });
});

// POST: Remote request post data
// Body Parser: Get request body data
app.use(bodyParser.json());

app.post('/post/api/v1/:requestType', async (req, res) => {
  const getRequestType = req.params.requestType;
  const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
  const sppUrl = siteUrl(fullUrl) + '/wp-json/app-post-request/v1/' + getRequestType;
  const data = req.body;
  const authToken = req.headers.authorization;
  if(authToken && authToken.startsWith('Bearer ')){
    const token = authToken.slice(7, authToken.length); // Remove "Bearer " from start
    const authorizationSecretKeys = process.env.REACT_APP_SECRET_KEY;
    if(token === authorizationSecretKeys){
      try {
        const response = await axios.post(sppUrl, data, {
          // Use auth if login is required.
          // auth: {
          //   username: 'your_username',
          //   password: 'your_password'
          // }
        });
        res.send(response.data);
      } catch (error) {
        res.status(500).send(error.message);
      }
    }else{
      res.status(401).send('Unauthorized');  
    }
  }else{
    res.status(401).send('Unauthorized');
  }
});
// POST: Get login credential from SPP
app.post('/post/api/login-request/v1', async (req, res) => {
//   const getRequestType = req.params.requestType;
  const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
  const sppUrl = siteUrl(fullUrl) + '/wp-json/jwt-auth/v1/token';
  const data = req.body;
  const authToken = req.headers.authorization;
  if(authToken && authToken.startsWith('Bearer ')){
    const token = authToken.slice(7, authToken.length); // Remove "Bearer " from start
    const authorizationSecretKeys = process.env.REACT_APP_SECRET_KEY;
    if(token === authorizationSecretKeys){
      try {
        const response = await axios.post(sppUrl, {
          // Use auth if login is required.
          username: data.username,
          password: data.password
        });
        res.send(response.data);
      } catch (error) {
        let errorMessage = 'Failed to fetch data';
        if (error.response && error.response.data && error.response.data.message) {
          errorMessage = error.response.data;
        }
        res.status(500).send(errorMessage);
      }
    }else{
      res.status(401).send('Unauthorized');  
    }
  }else{
    res.status(401).send('Unauthorized');
  }
});

// Endpoints: Login
app.post('/api/v1/login', async (req, res) => {
  const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
  const sppUrl = siteUrl(fullUrl) + '/wp-json/jwt-auth/v1/token';
  const data = req.body;
  try {
    const response = await axios.post(sppUrl, {
      // Use auth if login is required.
      email: data.email,
      password: data.password
    });
    res.send(response.data);
  } catch (error) {
    let errorMessage = 'Failed to fetch data';
    if (error.response && error.response.data && error.response.data.message) {
      errorMessage = error.response.data;
    }
    res.status(401).send(errorMessage);
  }
});

// Endpoints: Validate token
app.post('/api/v1/validate-token', async (req, res) => {
  try {
    // Get the full URL of the request
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    const sppUrl = siteUrl(fullUrl) + '/wp-json/jwt-auth/v1/token/validate';
    // Extract the refresh token from the Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const refreshToken = authHeader.split(' ')[1];
    const headers = {
      'Authorization': `Bearer ${refreshToken}`,
      'Content-Type': 'application/json'
    };
    
    // Make a POST request to the external API endpoint
    const response = await axios.post(sppUrl, {}, { headers });
    
    // Send the response data back to the client
    res.json(response.data);
  }
  catch (error) {
    // Handle errors
    let errorMessage = 'Invalid Token';
    res.status(401).send(errorMessage);
  }
});

// Endpoints: Validate refresh token
app.post('/api/v1/validate-refresh-token', async (req, res) => {
  try {
    // Get the full URL of the request
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    const sppUrl = siteUrl(fullUrl) + '/wp-json/jwt-auth/v1/token/validate-refresh-token';
    // Extract the refresh token from the Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const refreshToken = authHeader.split(' ')[1];
    const headers = {
      'Authorization': `Bearer ${refreshToken}`,
      'Content-Type': 'application/json'
    };
    
    // Make a POST request to the external API endpoint
    const response = await axios.post(sppUrl, {}, { headers });
    
    // Send the response data back to the client
    res.json(response.data);
  }
  catch (error) {
    // Handle errors
    let errorMessage = 'Invalid Refresh Token';
    res.status(400).send(errorMessage);
  }
});

// Player search for player directory screen
app.get('/api/v1/players', async (req, res) => {
  try {
    // Get the full URL of the request
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    const sppUrl = siteUrl(fullUrl) + '/wp-json/app-get-player-data/v1/players';

    // Extract the refresh token from the Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const accessToken = authHeader.split(' ')[1];

    // Extract search, page, and per_page query parameters from the request
    const { search, page, per_page } = req.query;

    // Prepare the URL with query parameters
    const urlWithParams = new URL(sppUrl);
    if (search) urlWithParams.searchParams.append('search', search);
    if (page) urlWithParams.searchParams.append('page', page);
    if (per_page) urlWithParams.searchParams.append('per_page', per_page);

    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };

    // Make the request to the WordPress API
    const response = await axios.get(urlWithParams.href, { headers });
    
    // Convert JSON to string
    const jsonString = JSON.stringify(response.data);

    // Compress the JSON string using gzip
    zlib.gzip(jsonString, (err, compressedData) => {
      if (err) {
        // Handle error
        console.error('Error compressing data:', err);
        res.status(500).send('Internal Server Error');
        return;
      }
      
      // Set response headers to indicate gzip compression
      res.set({
        'Content-Type': 'application/json',
        'Content-Encoding': 'gzip'
      });

      // Send compressed data as response
      res.send(compressedData);
    });
  } catch (error) {
    const errorStatus = error.response.status;
    res.status(errorStatus).send(error.response.data);
  }
});

app.get('/api/v1/players/:player_id', async (req, res) => {
  try {
    const { player_id } = req.params;

    // Get the full URL of the request
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    const sppUrl = siteUrl(fullUrl) + `/wp-json/app-get-player-data/v1/players/${player_id}`;

    // Extract the refresh token from the Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const accessToken = authHeader.split(' ')[1];

    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };

    const response = await axios.get(sppUrl, { headers });
    const jsonString = JSON.stringify(response.data);

    // Compress the JSON string using gzip
    zlib.gzip(jsonString, (err, compressedData) => {
      if (err) {
        console.error('Error compressing data:', err);
        res.status(500).send('Internal Server Error');
        return;
      }

      // Set response headers to indicate gzip compression
      res.set({
        'Content-Type': 'application/json',
        'Content-Encoding': 'gzip'
      });

      res.send(compressedData);
    });
  } catch (error) {
    const errorStatus = error.response.status;
    res.status(errorStatus).send(error.response.data);
  }
});


// Endpoints: CREATE player
app.post('/api/v1/player', async (req, res) => {
  try {
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    const sppUrl = siteUrl(fullUrl) + '/wp-json/app-post-player-data/v1/player';
    
    // Extract data from the request body
    const bodyData = req.body;
    
    // Extract the access token from the Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const accessToken = authHeader.split(' ')[1];
    
    // Set headers for the external API request
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };
    
    // Make a POST request to the external API endpoint with the data from the request body
    const response = await axios.post(sppUrl, bodyData, { headers });
    // Send the response data back to the client
    res.json(response.data);
  }
  catch (error) {
    const errorStatus = error.response.status;
    res.status(errorStatus).send(error.response.data);
  }

});

// Endpoints: UPDATE player
app.put('/api/v1/players/:id', async (req, res) => {
  const getPlayerId = req.params.id;
  try {
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    const sppUrl = siteUrl(fullUrl) + '/wp-json/app-update-player-data/v1/players/' + getPlayerId;
    
    // Extract data from the request body
    const bodyData = req.body;
    
    // Extract the access token from the Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const accessToken = authHeader.split(' ')[1];
    
    // Set headers for the external API request
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };
    
    // Make a POST request to the external API endpoint with the data from the request body
    const response = await axios.put(sppUrl, bodyData, { headers });
    // Send the response data back to the client
    res.json(response.data);
  }
  catch (error) {
    const errorStatus = error.response.status;
    res.status(errorStatus).send(error.response.data);
  }
});

// Endpoints: GET user
app.get('/api/v1/user/:id', async (req, res) => {
  const getUserId = req.params.id;
  try {
    // Get the full URL of the request
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    const sppUrl = siteUrl(fullUrl) + '/wp-json/app-get-user-data/v1/user/' + getUserId;
    // Extract the refresh token from the Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const accessToken = authHeader.split(' ')[1];
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };
    
    const response = await axios.get(sppUrl, { headers });
    
    // Send the response data back to the client
    res.json(response.data);
  }
  catch (error) {
    // Handle errors
    const errorStatus = error.response ? error.response.status : 500;
    res.status(errorStatus).send(error.response ? error.response.data : 'Internal Server Error');
  }
});

// Endpoints: UPDATE user
app.post('/api/v1/user', async (req, res) => {
  try {
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    const sppUrl = siteUrl(fullUrl) + '/wp-json/app-update-user-data/v1/user';
    
    // Extract data from the request body
    const bodyData = req.body;
    
    // Extract the access token from the Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const accessToken = authHeader.split(' ')[1];
    
    // Set headers for the external API request
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };
    
    // Make a POST request to the external API endpoint with the data from the request body
    const response = await axios.post(sppUrl, bodyData, { headers });
    // Send the response data back to the client
    res.json(response.data);
  }
  catch (error) {
    const errorStatus = error.response.status;
    res.status(errorStatus).send(error.response.data);
  }
});

// Endpoints: CLAIM player
app.post('/api/v1/claim/:id', async (req, res) => {
  const getPlayerId = req.params.id;
  try {
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    const sppUrl = siteUrl(fullUrl) + '/wp-json/app-user-claim-data/v1/claim/' + getPlayerId;
    
    // Extract data from the request body
    const bodyData = req.body;
    
    // Extract the access token from the Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const accessToken = authHeader.split(' ')[1];
    
    // Set headers for the external API request
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };
    
    // Make a POST request to the external API endpoint with the data from the request body
    const response = await axios.post(sppUrl, bodyData, { headers });
    // Send the response data back to the client
    res.json(response.data);
  }
  catch (error) {
    const errorStatus = error.response.status;
    res.status(errorStatus).send(error.response.data);
  }
});

// Endpoints: Reset password
app.post('/api/v1/reset-password', async (req, res) => {
  try {
    // Get the full URL of the request
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    const sppUrl = siteUrl(fullUrl) + '/wp-json/app-user-reset-password/v1/reset-password';
    const bodyData = req.body;
    // Extract the refresh token from the Authorization header
//     const authHeader = req.headers['authorization'];
//     if (!authHeader || !authHeader.startsWith('Bearer ')) {
//       return res.status(401).json({ error: 'Unauthorized' });
//     }
//     const accessToken = authHeader.split(' ')[1];
    const headers = {
//       'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };
    
    // Make a POST request to the external API endpoint
    const response = await axios.post(sppUrl, bodyData, { headers });
    
    // Send the response data back to the client
    res.json(response.data);
  }
  catch (error) {
    const errorStatus = error.response.status;
    res.status(errorStatus).send(error.response.data);
  }
});

// Endpoints: GET player positions
app.get('/api/v1/player-positions', async (req, res) => {
  try {
    // Get the full URL of the request
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    const sppUrl = siteUrl(fullUrl) + '/wp-json/app-player-position/v1/player-position';
    // Extract the refresh token from the Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const accessToken = authHeader.split(' ')[1];
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };
    
    const response = await axios.get(sppUrl, { headers });
    
    // Send the response data back to the client
    res.json(response.data);
  }
  catch (error) {
    const errorStatus = error.response.status;
    res.status(errorStatus).send(error.response.data);
  }
});

// // Endpoints: Player file upload for Web
// app.post('/api/v1/player-file-upload', upload.single('file'), async (req, res) => {
//   try {
//     // Check if a file was uploaded
//     if (!req.file) {
//       return res.status(400).json({ error: 'No file uploaded.' });
//     }
    
//     // Prepare the full URL of the request
//     const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
//     const sppUrl = siteUrl(fullUrl) + '/wp-json/app-player-file-upload/v1/player-file-upload';
    
//     // Extract the access token from the Authorization header
//     const authHeader = req.headers['authorization'];
//     if (!authHeader || !authHeader.startsWith('Bearer ')) {
//       return res.status(401).json({ error: 'Unauthorized' });
//     }
//     const accessToken = authHeader.split(' ')[1];
    
//     // Prepare the file data and other body parameters
//     const formData = new FormData();
//     formData.append('file', fs.createReadStream(req.file.path), { filename: req.file.originalname }); // Use original filename
//     formData.append('player_name', req.body.player_name); // Add other parameters as needed
//     formData.append('player_id', req.body.player_id);
//     formData.append('file_type', req.body.file_type);
    
// //     // Make a POST request to the external API endpoint
//     const headers = {
//       'Authorization': `Bearer ${accessToken}`,
//       ...formData.getHeaders() // Include multipart form data headers
//     };
//     const response = await axios.post(sppUrl, formData, { headers });

//     // Send the response data back to the client
//     res.json(response.data);
//   } catch (error) {
//     const errorStatus = error.response ? error.response.status : 500;
//     res.status(errorStatus).send(error.response ? error.response.data : 'Internal Server Error');
//   }
// });

// Endpoints: Player file upload for mobile app
app.post('/api/v1/player-file-upload-rn', async (req, res) => {
  try {
    // Parse the multipart form data using multiparty
    const form = new multiparty.Form();
    const formData = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          reject(err);
        } else {
          resolve({ fields, files });
        }
      });
    });

    // Check if a file was uploaded
    if (!formData.files.file || formData.files.file.length === 0) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    // Prepare the full URL of the request
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    const sppUrl = siteUrl(fullUrl) + '/wp-json/app-player-file-upload-rn/v1/player-file-upload-rn';

    // Extract the access token from the Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const accessToken = authHeader.split(' ')[1];

    // Prepare the file data and other body parameters
    const fileData = new FormData();
    fileData.append('file', fs.createReadStream(formData.files.file[0].path), { filename: formData.files.file[0].originalFilename });
    fileData.append('player_name', formData.fields.player_name[0]);
    fileData.append('player_id', formData.fields.player_id[0]);
    fileData.append('file_type', formData.fields.file_type[0]);
    fileData.append('user_id', formData.fields.user_id[0]);

    // Make a POST request to the external API endpoint
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      ...fileData.getHeaders() // Include multipart form data headers
    };

    const response = await axios.post(sppUrl, fileData, { headers });

    // Send the response data back to the client
    res.json(response.data);
  } catch (error) {
    const errorStatus = error.response ? error.response.status : 500;
    res.status(errorStatus).send(error.response ? error.response.data : 'Internal Server Error');
  }
});

// Endpoints: GET badges
app.get('/api/v1/badges', async (req, res) => {
  const badgeTypeId = req.params.id;
  try {
    // Get the full URL of the request
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    const sppUrl = siteUrl(fullUrl) + '/wp-json/app-badges/v1/badges';
    // Extract the refresh token from the Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const accessToken = authHeader.split(' ')[1];
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };
    
    const response = await axios.get(sppUrl, { headers });
    
    // Send the response data back to the client
    res.json(response.data);
  }
  catch (error) {
    const errorStatus = error.response.status;
    res.status(errorStatus).send(error.response.data);
  }
});

// Endpoints: GET badge
app.get('/api/v1/badges/:id', async (req, res) => {
  const badgeId = req.params.id;
  try {
    // Get the full URL of the request
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    const sppUrl = siteUrl(fullUrl) + '/wp-json/app-badges/v1/badges/' + badgeId;
    // Extract the refresh token from the Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const accessToken = authHeader.split(' ')[1];
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };
    
    const response = await axios.get(sppUrl, { headers });
    
    // Send the response data back to the client
    res.json(response.data);
  }
  catch (error) {
    const errorStatus = error.response.status;
    res.status(errorStatus).send(error.response.data);
  }
});

// Endpoints: GET achievement
app.get('/api/v1/achievement/:id', async (req, res) => {
  const achievementId = req.params.id;
  try {
    // Get the full URL of the request
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    const sppUrl = siteUrl(fullUrl) + '/wp-json/app-player-achievement/v1/player-achievement/' + achievementId;
    // Extract the refresh token from the Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const accessToken = authHeader.split(' ')[1];
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };
    
    const response = await axios.get(sppUrl, { headers });
    
    // Send the response data back to the client
    res.json(response.data);
  }
  catch (error) {
    const errorStatus = error.response.status;
    res.status(errorStatus).send(error.response.data);
  }
});

// Endpoints: GET eligible tag
app.post('/api/v1/eligibility', async (req, res) => {
  try {
    // Get the full URL of the request
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    const sppUrl = siteUrl(fullUrl) + '/wp-json/app-eligible-tag/v1/eligible-tag';
    const bodyData = req.body;
    // Extract the refresh token from the Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const accessToken = authHeader.split(' ')[1];
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Body': JSON.stringify(bodyData)
    };
    
    const response = await axios.post(sppUrl, bodyData, { headers });
    
    // Send the response data back to the client
    res.json(response.data);
  }
  catch (error) {
    const errorStatus = error.response.status;
    res.status(errorStatus).send(error.response.data);
  }
});

// Endpoints: GET eligible tag
app.get('/api/v1/career-highs/:id', async (req, res) => {
  const playerId = req.params.id;
  try {
    // Get the full URL of the request
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    const sppUrl = siteUrl(fullUrl) + '/wp-json/app-career-highs/v1/career-highs/' + playerId;
    // Extract the refresh token from the Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const accessToken = authHeader.split(' ')[1];
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };
    
    const response = await axios.get(sppUrl, { headers });
    
    // Send the response data back to the client
    res.json(response.data);
  }
  catch (error) {
    const errorStatus = error.response.status;
    res.status(errorStatus).send(error.response.data);
  }
});

// Endpoints: GET season avg
app.post('/api/v1/season-average/:playerId', async (req, res) => {
  const getPlayerId = req.params.playerId;
  try {
    // Get the full URL of the request
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    const sppUrl = siteUrl(fullUrl) + '/wp-json/app-season-avg/v1/season-avg/' + getPlayerId;
    const bodyData = req.body;
    // Extract the refresh token from the Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const accessToken = authHeader.split(' ')[1];
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };
    
    const response = await axios.post(sppUrl, bodyData, { headers });
    
    // Send the response data back to the client
    res.json(response.data);
  }
  catch (error) {
    const errorStatus = error.response ? error.response.status : 500;
    res.status(errorStatus).send(error.response ? error.response.data : 'Internal Server Error');
  }
});

// Endpoints: GET player subscription status
app.get('/api/v1/player-subscription/:playerId/:seasonYear', async (req, res) => {
  const getPlayerId = req.params.playerId;
  const getSeasonYear = req.params.seasonYear;
  try {
    // Get the full URL of the request
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    const sppUrl = siteUrl(fullUrl) + '/wp-json/app-subscription-validation/v1/subscription-validation/' + getPlayerId + '/' + getSeasonYear;
    // Extract the refresh token from the Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const accessToken = authHeader.split(' ')[1];
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };
    
    const response = await axios.get(sppUrl, { headers });
    
    // Send the response data back to the client
    res.json(response.data);
  }
  catch (error) {
    const errorStatus = error.response ? error.response.status : 500;
    res.status(errorStatus).send(error.response ? error.response.data : 'Internal Server Error');
  }
});

// Endpoints: GET player subscription status
app.get('/api/v1/event-average/:playerId/:eventId', async (req, res) => {
  const getPlayerId = req.params.playerId;
  const getEventId = req.params.eventId;
  try {
    // Get the full URL of the request
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    const sppUrl = siteUrl(fullUrl) + '/wp-json/app-event-average/v1/event-average/' + getPlayerId + '/' + getEventId;
    // Extract the refresh token from the Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const accessToken = authHeader.split(' ')[1];
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };
    
    const response = await axios.get(sppUrl, { headers });
    
    // Send the response data back to the client
    res.json(response.data);
  }
  catch (error) {
    const errorStatus = error.response ? error.response.status : 500;
    res.status(errorStatus).send(error.response ? error.response.data : 'Internal Server Error');
  }
});

// Endpoints: GET events stat
app.get('/api/v1/player-events/:eventType/:playerId/:seasonYear', async (req, res) => {
  const getEventType = req.params.eventType;
  const getPlayerId = req.params.playerId;
  const getSeasonYear = req.params.seasonYear;
  try {
    // Get the full URL of the request
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    const sppUrl = siteUrl(fullUrl) + '/wp-json/app-events-stat/v1/events-stat/' + getEventType + '/' + getPlayerId + '/' + getSeasonYear;
    // Extract the refresh token from the Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const accessToken = authHeader.split(' ')[1];
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };
    
    const response = await axios.get(sppUrl, { headers });
    
    // Send the response data back to the client
    res.json(response.data);
  }
  catch (error) {
    const errorStatus = error.response ? error.response.status : 500;
    res.status(errorStatus).send(error.response ? error.response.data : 'Internal Server Error');
  }
});

// Endpoints: GET game results
app.get('/api/v1/game-results/:playerId/:eventId/:seasonYear', async (req, res) => {
  const getPlayerId = req.params.playerId;
  const getEventId = req.params.eventId;
  const getSeasonYear = req.params.seasonYear;
  try {
    // Get the full URL of the request
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    const sppUrl = siteUrl(fullUrl) + '/wp-json/app-game-results/v1/game-results/' + getPlayerId + '/' + getEventId + '/' + getSeasonYear;
    // Extract the refresh token from the Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const accessToken = authHeader.split(' ')[1];
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };
    
    const response = await axios.get(sppUrl, { headers });
    
    // Send the response data back to the client
    res.json(response.data);
  }
  catch (error) {
    const errorStatus = error.response ? error.response.status : 500;
    res.status(errorStatus).send(error.response ? error.response.data : 'Internal Server Error');
  }
});

// Endpoints: GET player statistics
app.get('/api/v1/player-statistics/:playerId', async (req, res) => {
  const getPlayerId = req.params.playerId;
  try {
    // Get the full URL of the request
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    const sppUrl = siteUrl(fullUrl) + '/wp-json/app-player-statistics/v1/player-statistics/' + getPlayerId;
    // Extract the refresh token from the Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const accessToken = authHeader.split(' ')[1];
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };
    
    const response = await axios.get(sppUrl, { headers });
    
    // Send the response data back to the client
    res.json(response.data);
  }
  catch (error) {
    const errorStatus = error.response ? error.response.status : 500;
    res.status(errorStatus).send(error.response ? error.response.data : 'Internal Server Error');
  }
});

// Endpoints: GET camp profile
app.get('/api/v1/camp-profile/:playerId', async (req, res) => {
  const getPlayerId = req.params.playerId;
  try {
    // Get the full URL of the request
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    const sppUrl = siteUrl(fullUrl) + '/wp-json/app-player-camp-profile/v1/camp-profile/' + getPlayerId;
    // Extract the refresh token from the Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const accessToken = authHeader.split(' ')[1];
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };
    
    const response = await axios.get(sppUrl, { headers });
    
    // Send the response data back to the client
    res.json(response.data);
  }
  catch (error) {
    const errorStatus = error.response ? error.response.status : 500;
    res.status(errorStatus).send(error.response ? error.response.data : 'Internal Server Error');
  }
});

// Endpoints: GET organizations
app.get('/api/v1/organizations', async (req, res) => {
  try {
    // Get the full URL of the request
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    const sppUrl = siteUrl(fullUrl) + '/wp-json/app-organizations/v1/organizations';
    // Extract the refresh token from the Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const accessToken = authHeader.split(' ')[1];
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };
    
    const response = await axios.get(sppUrl, { headers });
    
    // Send the response data back to the client
    res.json(response.data);
  }
  catch (error) {
    const errorStatus = error.response ? error.response.status : 500;
    res.status(errorStatus).send(error.response ? error.response.data : 'Internal Server Error');
  }
});

// Endpoints: GET stat leaderboard
app.get('/api/v1/stat-leaderboard/:orgId/:year/:eventId?/:category?/:level?/:division?', async (req, res) => {
  const getOrgId = req.params.orgId;
  const getYear = req.params.year;
  const getEventId = req.params.eventId;
  const getCategory = req.params.category;
  const getLevel = req.params.level;
  const getDivision = req.params.division;
  try {
    // Get the full URL of the request
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    const sppUrl = siteUrl(fullUrl) + '/wp-json/app-stat-leaderboard/v1/stat-leaderboard/' + getOrgId + '/' + getYear + '/' + getEventId + '/' + getCategory + '/' + getLevel + '/' + getDivision;
    // Extract the refresh token from the Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const accessToken = authHeader.split(' ')[1];
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };
    
    const response = await axios.get(sppUrl, { headers });
    
    // Convert JSON to string
    const jsonString = JSON.stringify(response.data);
    // Compress the JSON string using gzip
    zlib.gzip(jsonString, (err, compressedData) => {
      if(err){
        // Handle error
        console.error('Error compressing data:', err);
        res.status(500).send('Internal Server Error');
        return;
      }
      // Set response headers to indicate gzip compression
      res.set({
        'Content-Type': 'application/json',
        'Content-Encoding': 'gzip'
      });
      // Send compressed data as response
      res.send(compressedData);
    });
  }
  catch (error) {
    const errorStatus = error.response.status;
    res.status(errorStatus).send(error.response.data);
  }
});

// Endpoints: GET stat leaderboard
app.get('/api/v1/stat-leaderboard-new/:orgId?/:year?/:eventId?/:category?/:level?/:division?', async (req, res) => {
  const getOrgId = req.params.orgId;
  const getYear = req.params.year;
  const getEventId = req.params.eventId;
  const getCategory = req.params.category;
  const getLevel = req.params.level;
  const getDivision = req.params.division;
  try {
    // Get the full URL of the request
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    const sppUrl = siteUrl(fullUrl) + '/wp-json/app-stat-leaderboard-new/v1/stat-leaderboard-new/' + getOrgId + '/' + getYear + '/' + getEventId + '/' + getCategory + '/' + getLevel + '/' + getDivision;
    // Extract the refresh token from the Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const accessToken = authHeader.split(' ')[1];
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };
    
    const response = await axios.get(sppUrl, { headers });
    
    // Convert JSON to string
    const jsonString = JSON.stringify(response.data);
    // Compress the JSON string using gzip
    zlib.gzip(jsonString, (err, compressedData) => {
      if(err){
        // Handle error
        console.error('Error compressing data:', err);
        res.status(500).send('Internal Server Error');
        return;
      }
      // Set response headers to indicate gzip compression
      res.set({
        'Content-Type': 'application/json',
        'Content-Encoding': 'gzip'
      });
      // Send compressed data as response
      res.send(compressedData);
    });
  }
  catch (error) {
    const errorStatus = error.response.status;
    res.status(errorStatus).send(error.response.data);
  }
});

// Endpoints: GET player spotlight
app.get('/api/v1/stat-leaderboard-spotlight', async (req, res) => {
  try {
    // Get the full URL of the request
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    const sppUrl = siteUrl(fullUrl) + '/wp-json/app-stat-leaderboard-spotlight/v1/stat-leaderboard-spotlight/';
    // Extract the refresh token from the Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const accessToken = authHeader.split(' ')[1];
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };
    
    const response = await axios.get(sppUrl, { headers });
    
    // Send the response data back to the client
    res.json(response.data);
  }
  catch (error) {
    const errorStatus = error.response.status;
    res.status(errorStatus).send(error.response.data);
  }
});

// Endpoints: Post team standings
app.post('/api/v1/team-standings', async (req, res) => {
  try {
    const bodyData = req.body;
    // Get the full URL of the request
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    const sppUrl = siteUrl(fullUrl) + '/wp-json/app-team-standings/v1/team-standings';
    // Extract the refresh token from the Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const accessToken = authHeader.split(' ')[1];
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };
    
    const response = await axios.post(sppUrl, bodyData, { headers });
    
    // Send the response data back to the client
    res.json(response.data);
  }
  catch (error) {
    const errorStatus = error.response.status;
    res.status(errorStatus).send(error.response.data);
  }
});

// Endpoints: Post team standing game results
app.post('/api/v1/team-standing-game-results', async (req, res) => {
  try {
    const bodyData = req.body;
    // Get the full URL of the request
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    const sppUrl = siteUrl(fullUrl) + '/wp-json/app-ts-game-results/v1/ts-game-results';
    // Extract the refresh token from the Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const accessToken = authHeader.split(' ')[1];
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };
    
    const response = await axios.post(sppUrl, bodyData, { headers });
    
    // Send the response data back to the client
    res.json(response.data);
  }
  catch (error) {
    const errorStatus = error.response.status;
    res.status(errorStatus).send(error.response.data);
  }
});

// Endpoints: Get full team standings
app.post('/api/v1/full-team-standings', async (req, res) => {
  try {
    const bodyData = req.body;
    // Get the full URL of the request
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    const sppUrl = siteUrl(fullUrl) + '/wp-json/app-full-team-standings/v1/full-team-standings';
    // Extract the refresh token from the Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const accessToken = authHeader.split(' ')[1];
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };
    
    const response = await axios.post(sppUrl, bodyData, { headers });
    
  // Send the response data back to the client
    res.json(response.data);
  }
  catch (error) {
    const errorStatus = error.response.status;
    res.status(errorStatus).send(error.response.data);
  }
});

// Endpoints: GET team boxscores
app.get('/api/v1/boxscores/:teamId/:gameId/:seasonYear', async (req, res) => {
  const getTeamId = req.params.teamId;
  const getGameId = req.params.gameId;
  const getSeasonYear = req.params.seasonYear;
  try {
    // Get the full URL of the request
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    const sppUrl = siteUrl(fullUrl) + '/wp-json/app-boxscores/v1/boxscores/' + getTeamId + '/' + getGameId + '/' + getSeasonYear;
    // Extract the refresh token from the Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const accessToken = authHeader.split(' ')[1];
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };
    
    const response = await axios.get(sppUrl, { headers });
    
    // Send the response data back to the client
    res.json(response.data);
  }
  catch (error) {
    const errorStatus = error.response ? error.response.status : 500;
    res.status(errorStatus).send(error.response ? error.response.data : 'Internal Server Error');
  }
});

// Endpoints: GET profile media
app.get('/api/v1/profile-media/:playerId', async (req, res) => {
  const getPlayerId = req.params.playerId;
  try {
    // Get the full URL of the request
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    const sppUrl = siteUrl(fullUrl) + '/wp-json/app-profile-media/v1/profile-media/' + getPlayerId;
    // Extract the refresh token from the Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const accessToken = authHeader.split(' ')[1];
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };
    
    const response = await axios.get(sppUrl, { headers });
    
    // Send the response data back to the client
    res.json(response.data);
  }
  catch (error) {
    const errorStatus = error.response ? error.response.status : 500;
    res.status(errorStatus).send(error.response ? error.response.data : 'Internal Server Error');
  }
});

// Endpoints: GET user orders and subscriptions
app.get('/api/v1/order-subscription/:userId', async (req, res) => {
  const getUserId = req.params.userId;
  try {
    // Get the full URL of the request
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    const sppUrl = siteUrl(fullUrl) + '/wp-json/app-order-subscription/v1/order-subscription/' + getUserId;
    // Extract the refresh token from the Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const accessToken = authHeader.split(' ')[1];
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };
    
    const response = await axios.get(sppUrl, { headers });
    
    // Send the response data back to the client
    res.json(response.data);
  }
  catch (error) {
    const errorStatus = error.response ? error.response.status : 500;
    res.status(errorStatus).send(error.response ? error.response.data : 'Internal Server Error');
  }
});

// Endpoints: GET player qr code for report card
app.get('/api/v1/player-qr-code/:playerId', async (req, res) => {
  const getPlayerId = req.params.playerId;
  try {
    // Get the full URL of the request
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    const sppUrl = siteUrl(fullUrl) + '/wp-json/app-player-qr-code/v1/player-qr-code/' + getPlayerId;
    // Extract the refresh token from the Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const accessToken = authHeader.split(' ')[1];
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };
    
    const response = await axios.get(sppUrl, { headers });
    
    // Send the response data back to the client
    res.json(response.data);
  }
  catch (error) {
    const errorStatus = error.response ? error.response.status : 500;
    res.status(errorStatus).send(error.response ? error.response.data : 'Internal Server Error');
  }
});

// Endpoints: Post team standings
app.post('/api/v1/toggle-player-media', async (req, res) => {
  try {
    const bodyData = req.body;
    // Get the full URL of the request
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    const sppUrl = siteUrl(fullUrl) + '/wp-json/app-toggle-player-media/v1/toggle-player-media';
    // Extract the refresh token from the Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const accessToken = authHeader.split(' ')[1];
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };
    
    const response = await axios.post(sppUrl, bodyData, { headers });
    
    // Send the response data back to the client
    res.json(response.data);
  }
  catch (error) {
    const errorStatus = error.response.status;
    res.status(errorStatus).send(error.response.data);
  }
});

app.use(express.json());

app.post('/api/v1/send-notification', async (req, res) => {
  try {
    // Get the Firebase access token
    const accessToken = await getAccessToken();
    const body = req.body; // Expecting the full FCM message in the request body

    // Send the FCM notification
    const response = await axios.post(
      `https://fcm.googleapis.com/v1/projects/${process.env.FIREBASE_PROJECT_ID}/messages:send`,
      body,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`, // Use the access token for authorization
          'Content-Type': 'application/json'
        }
      }
    );

    // Return the response from FCM
    res.status(200).json({ success: true, data: response.data });
  } catch (error) {
    console.error('Error sending notification:', error);

    if (error.response) {
      res.status(error.response.status).json({ success: false, error: error.response.data });
    } else if (error.request) {
      res.status(500).json({ success: false, error: 'No response received from FCM' });
    } else {
      res.status(500).json({ success: false, error: error.message });
    }
  }
});

// Endpoints: GET player profile data
app.get('/api/v1/check-player-profile-data/:userId/:playerId', async (req, res) => {
  const getUserId = req.params.userId;
  const getPlayerId = req.params.playerId;
  try {
    // Get the full URL of the request
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    const sppUrl = siteUrl(fullUrl) + '/wp-json/app-missing-profile-information/v1/missing-profile-information/' + getUserId + '/' + getPlayerId;
    // Extract the refresh token from the Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const accessToken = authHeader.split(' ')[1];
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };
    
    const response = await axios.get(sppUrl, { headers });
    
    // Send the response data back to the client
    res.json(response.data);
  }
  catch (error) {
    const errorStatus = error.response ? error.response.status : 500;
    res.status(errorStatus).send(error.response ? error.response.data : 'Internal Server Error');
  }
});

// Endpoint to receive device token from SPP App
app.post('/api/v1/device-token', async (req, res) => {
  const bodyData = req.body;
  try {
      // Get the full URL of the request
      const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
      const sppUrl = siteUrl(fullUrl) + '/wp-json/app-register-device-token-endpoint/v1/register-device-token-endpoint';
      // Extract the refresh token from the Authorization header
      const authHeader = req.headers['authorization'];
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const accessToken = authHeader.split(' ')[1];
      const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      };

      const response = await axios.post(sppUrl, bodyData, { headers });

      // Send the response data back to the client
      res.json(response.data);
    }
    catch (error) {
      const errorStatus = error.response ? error.response.status : 500;
      res.status(errorStatus).send(error.response ? error.response.data : 'Internal Server Error');
    }  
});

// Endpoint to receive device token from SPP App
app.get('/api/v1/team-spotlight', async (req, res) => {
  try {
    // Get the full URL of the request
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    const sppUrl = siteUrl(fullUrl) + '/wp-json/app-team-spotlight/v1/team-spotlight';
    // Extract the refresh token from the Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const accessToken = authHeader.split(' ')[1];
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };
    
    const response = await axios.get(sppUrl, { headers });
    
    // Send the response data back to the client
    res.json(response.data);
  }
  catch (error) {
    const errorStatus = error.response ? error.response.status : 500;
    res.status(errorStatus).send(error.response ? error.response.data : 'Internal Server Error');
  }
});

// Endpoint: GET program teams
app.get('/api/v1/program-team/:orgId?/:selectYear?', async (req, res) => {
  const getSelectYear = req.params.selectYear;
  const getOrgId = req.params.orgId;
  try {
    // Get the full URL of the request
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    const sppUrl = siteUrl(fullUrl) + '/wp-json/app-program-team/v1/program-team/' + getOrgId + '/' + getSelectYear;
    // Extract the refresh token from the Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const accessToken = authHeader.split(' ')[1];
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };
    
    const response = await axios.get(sppUrl, { headers });
    
    // Send the response data back to the client
    res.json(response.data);
  }
  catch (error) {
    const errorStatus = error.response ? error.response.status : 500;
    res.status(errorStatus).send(error.response ? error.response.data : 'Internal Server Error');
  }
});

// Endpoint: GET program info and statistics
app.get('/api/v1/program-data/:orgId', async (req, res) => {
  const getOrgId = req.params.orgId;
  try {
    // Get the full URL of the request
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    const sppUrl = siteUrl(fullUrl) + '/wp-json/app-program-header-data/v1/program-header-data/'+ getOrgId;
    // Extract the refresh token from the Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const accessToken = authHeader.split(' ')[1];
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };
    
    const response = await axios.get(sppUrl, { headers });
    
    // Send the response data back to the client
    res.json(response.data);
  }
  catch (error) {
    const errorStatus = error.response ? error.response.status : 500;
    res.status(errorStatus).send(error.response ? error.response.data : 'Internal Server Error');
  }
});

// Endpoint: GET team data for team page/screen
app.get('/api/v1/team-data/:teamId/:orgId?/:selectYear?', async (req, res) => {
  const getTeamId = req.params.teamId;
  const getOrgId = req.params.orgId;
  const getSelectYear = req.params.selectYear;
  try {
    // Get the full URL of the request
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    const sppUrl = siteUrl(fullUrl) + '/wp-json/app-team-data/v1/app-team-data/' + getTeamId + '/' + getOrgId + '/' + getSelectYear;
    // Extract the refresh token from the Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const accessToken = authHeader.split(' ')[1];
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };
    
    const response = await axios.get(sppUrl, { headers });
    
    // Send the response data back to the client
    res.json(response.data);
  }
  catch (error) {
    const errorStatus = error.response ? error.response.status : 500;
    res.status(errorStatus).send(error.response ? error.response.data : 'Internal Server Error');
  }
});

// Endpoint: GET team data for team page/screen
app.get('/api/v1/programs/:orgId?', async (req, res) => {
  const getOrgId = req.params.orgId;
  try {
    // Get the full URL of the request
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    const sppUrl = siteUrl(fullUrl) + '/wp-json/app-program-directory/v1/program-directory/' + getOrgId;
    // Extract the refresh token from the Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const accessToken = authHeader.split(' ')[1];
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };
    
    const response = await axios.get(sppUrl, { headers });
    
    // Send the response data back to the client
    res.json(response.data);
  }
  catch (error) {
    const errorStatus = error.response ? error.response.status : 500;
    res.status(errorStatus).send(error.response ? error.response.data : 'Internal Server Error');
  }
});

// Endpoint: GET program trophy case
app.get('/api/v1/trophy-case/:orgId/:selectYear?', async (req, res) => {
  const getOrgId = req.params.orgId;
  const getSelectYear = req.params.selectYear;
  try {
    // Get the full URL of the request
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    const sppUrl = siteUrl(fullUrl) + '/wp-json/app-program-trophy-case/v1/program-trophy-case/' + getOrgId + '/' + getSelectYear;
    // Extract the refresh token from the Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const accessToken = authHeader.split(' ')[1];
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };
    
    const response = await axios.get(sppUrl, { headers });
    
    // Send the response data back to the client
    res.json(response.data);
  }
  catch (error) {
    const errorStatus = error.response ? error.response.status : 500;
    res.status(errorStatus).send(error.response ? error.response.data : 'Internal Server Error');
  }
});

// Endpoint to create coach profile
app.post('/api/v1/coach-creation', async (req, res) => {
  const bodyData = req.body;
  try {
    // Get the full URL of the request
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    const sppUrl = siteUrl(fullUrl) + '/wp-json/app-coach-creation/v1/coach-creation';
    // Extract the refresh token from the Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const accessToken = authHeader.split(' ')[1];
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };

    const response = await axios.post(sppUrl, bodyData, { headers });

    // Send the response data back to the client
    res.json(response.data);
  }
  catch (error) {
    const errorStatus = error.response ? error.response.status : 500;
    res.status(errorStatus).send(error.response ? error.response.data : 'Internal Server Error');
  }  
});

// Endpoints: UPDATE coach profile
app.put('/api/v1/coach', async (req, res) => {
  try {
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    const sppUrl = siteUrl(fullUrl) + '/wp-json/app-update-coach/v1/update-coach';
    
    // Extract data from the request body
    const bodyData = req.body;
    
    // Extract the access token from the Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const accessToken = authHeader.split(' ')[1];
    
    // Set headers for the external API request
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };
    
    // Make a POST request to the external API endpoint with the data from the request body
    const response = await axios.put(sppUrl, bodyData, { headers });
    // Send the response data back to the client
    res.json(response.data);
  }
  catch (error) {
    const errorStatus = error.response.status;
    res.status(errorStatus).send(error.response.data);
  }
});

// Endpoints: Claim and update program information
app.put('/api/v1/coach-director-claim-program', async (req, res) => {
  try {
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    const sppUrl = siteUrl(fullUrl) + '/wp-json/app-coach-claim-unclaim-program/v1/coach-claim-unclaim-program';
    
    // Extract data from the request body
    const bodyData = req.body;
    
    // Extract the access token from the Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const accessToken = authHeader.split(' ')[1];
    
    // Set headers for the external API request
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };
    
    // Make a POST request to the external API endpoint with the data from the request body
    const response = await axios.put(sppUrl, bodyData, { headers });
    // Send the response data back to the client
    res.json(response.data);
  }
  catch (error) {
    const errorStatus = error.response.status;
    res.status(errorStatus).send(error.response.data);
  }
});

// Endpoint: GET coach data
app.get('/api/v1/coach-director-data/:id', async (req, res) => {
  const getId = req.params.id;
  try {
    // Get the full URL of the request
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    const sppUrl = siteUrl(fullUrl) + '/wp-json/app-get-coach-data/v1/get-coach-data/' + getId;
    // Extract the refresh token from the Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const accessToken = authHeader.split(' ')[1];
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };
    
    const response = await axios.get(sppUrl, { headers });
    
    // Send the response data back to the client
    res.json(response.data);
  }
  catch (error) {
    const errorStatus = error.response ? error.response.status : 500;
    res.status(errorStatus).send(error.response ? error.response.data : 'Internal Server Error');
  }
});

// Endpoint coach send program claim request to program director
app.post('/api/v1/coach-director-claim-request', async (req, res) => {
  const bodyData = req.body;
  try {
    // Get the full URL of the request
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    const sppUrl = siteUrl(fullUrl) + '/wp-json/app-coach-claim-request/v1/coach-claim-request';
    // Extract the refresh token from the Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const accessToken = authHeader.split(' ')[1];
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };

    const response = await axios.post(sppUrl, bodyData, { headers });

    // Send the response data back to the client
    res.json(response.data);
  }
  catch (error) {
    const errorStatus = error.response ? error.response.status : 500;
    res.status(errorStatus).send(error.response ? error.response.data : 'Internal Server Error');
  }  
});

// Endpoint get coach roster levels
app.get('/api/v1/coach-director-roster-levels/:userID', async (req, res) => {
  const getUserId = req.params.userID;
  try {
    // Get the full URL of the request
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    const sppUrl = siteUrl(fullUrl) + '/wp-json/app-coach-roster-levels/v1/coach-roster-levels/' + getUserId;
    // Extract the refresh token from the Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const accessToken = authHeader.split(' ')[1];
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };

    const response = await axios.get(sppUrl, { headers });

    // Send the response data back to the client
    res.json(response.data);
  }
  catch (error) {
    const errorStatus = error.response ? error.response.status : 500;
    res.status(errorStatus).send(error.response ? error.response.data : 'Internal Server Error');
  }  
});

// Endpoint coach create roster
app.post('/api/v1/coach-director-create-roster', async (req, res) => {
  const bodyData = req.body;
  try {
    // Get the full URL of the request
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    const sppUrl = siteUrl(fullUrl) + '/wp-json/app-coach-create-roster/v1/coach-create-roster';
    // Extract the refresh token from the Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const accessToken = authHeader.split(' ')[1];
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };

    const response = await axios.post(sppUrl, bodyData, { headers });

    // Send the response data back to the client
    res.json(response.data);
  }
  catch (error) {
    const errorStatus = error.response ? error.response.status : 500;
    res.status(errorStatus).send(error.response ? error.response.data : 'Internal Server Error');
  }  
});

// Endpoint get coach directory
app.get('/api/v1/coach-directory', async (req, res) => {
  try {
    // Get the full URL of the request
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    const sppUrl = siteUrl(fullUrl) + '/wp-json/app-coach-directory/v1/coach-directory';
    // Extract the refresh token from the Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const accessToken = authHeader.split(' ')[1];
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };

    const response = await axios.get(sppUrl, { headers });

    // Send the response data back to the client
    res.json(response.data);
  }
  catch (error) {
    const errorStatus = error.response ? error.response.status : 500;
    res.status(errorStatus).send(error.response ? error.response.data : 'Internal Server Error');
  }  
});

// Endpoint get coach directory
app.get('/api/v1/coach-director-player-search/:rosterLevel', async (req, res) => {
  const getRosterLevel = req.params.rosterLevel;
  try {
    // Get the full URL of the request
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    const sppUrl = siteUrl(fullUrl) + '/wp-json/app-coach-player-search/v1/coach-player-search/' + getRosterLevel;
    // Extract the refresh token from the Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const accessToken = authHeader.split(' ')[1];
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };

    const response = await axios.get(sppUrl, { headers });
    const jsonString = JSON.stringify(response.data);
    // Compress the JSON string using gzip
    zlib.gzip(jsonString, (err, compressedData) => {
      if(err){
        // Handle error
        console.error('Error compressing data:', err);
        res.status(500).send('Internal Server Error');
        return;
      }
      // Set response headers to indicate gzip compression
      res.set({
        'Content-Type': 'application/json',
        'Content-Encoding': 'gzip'
      });
      // Send compressed data as response
      res.send(compressedData);
    });
  }
  catch (error) {
    const errorStatus = error.response ? error.response.status : 500;
    res.status(errorStatus).send(error.response ? error.response.data : 'Internal Server Error');
  }  
});

// Endpoints: Coach edit roster
app.put('/api/v1/edit-coach-director-roster', async (req, res) => {
  try {
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    const sppUrl = siteUrl(fullUrl) + '/wp-json/app-coach-roster-editor/v1/coach-roster-editor';
    
    // Extract data from the request body
    const bodyData = req.body;
    
    // Extract the access token from the Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const accessToken = authHeader.split(' ')[1];
    
    // Set headers for the external API request
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };
    
    // Make a POST request to the external API endpoint with the data from the request body
    const response = await axios.put(sppUrl, bodyData, { headers });
    // Send the response data back to the client
    res.json(response.data);
  }
  catch (error) {
    const errorStatus = error.response.status;
    res.status(errorStatus).send(error.response.data);
  }
});

// Endpoint get all rosters under program
app.get('/api/v1/coach-director-rosters/:userId', async (req, res) => {
  const getUserId = req.params.userId;
  try {
    // Get the full URL of the request
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    const sppUrl = siteUrl(fullUrl) + '/wp-json/app-coach-rosters/v1/coach-rosters/' + getUserId;
    // Extract the refresh token from the Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const accessToken = authHeader.split(' ')[1];
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };

    const response = await axios.get(sppUrl, { headers });
    const jsonString = JSON.stringify(response.data);
    // Compress the JSON string using gzip
    zlib.gzip(jsonString, (err, compressedData) => {
      if(err){
        // Handle error
        console.error('Error compressing data:', err);
        res.status(500).send('Internal Server Error');
        return;
      }
      // Set response headers to indicate gzip compression
      res.set({
        'Content-Type': 'application/json',
        'Content-Encoding': 'gzip'
      });
      // Send compressed data as response
      res.send(compressedData);
    });
  }
  catch (error) {
    const errorStatus = error.response ? error.response.status : 500;
    res.status(errorStatus).send(error.response ? error.response.data : 'Internal Server Error');
  }  
});

// Endpoint coach/director search for event to submit their roster in
app.get('/api/v1/event-search', async (req, res) => {
  try {
    // Get the full URL of the request
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    const sppUrl = siteUrl(fullUrl) + '/wp-json/app-event-search/v1/event-search';
    // Extract the refresh token from the Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const accessToken = authHeader.split(' ')[1];
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };

    const response = await axios.get(sppUrl, { headers });
    const jsonString = JSON.stringify(response.data);
    // Compress the JSON string using gzip
    zlib.gzip(jsonString, (err, compressedData) => {
      if(err){
        // Handle error
        console.error('Error compressing data:', err);
        res.status(500).send('Internal Server Error');
        return;
      }
      // Set response headers to indicate gzip compression
      res.set({
        'Content-Type': 'application/json',
        'Content-Encoding': 'gzip'
      });
      // Send compressed data as response
      res.send(compressedData);
    });
  }
  catch (error) {
    const errorStatus = error.response ? error.response.status : 500;
    res.status(errorStatus).send(error.response ? error.response.data : 'Internal Server Error');
  }  
});

// Endpoint director create program
app.post('/api/v1/director-create-program', async (req, res) => {
  const bodyData = req.body;
  try {
    // Get the full URL of the request
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    const sppUrl = siteUrl(fullUrl) + '/wp-json/app-director-create-program/v1/director-create-program';
    // Extract the refresh token from the Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const accessToken = authHeader.split(' ')[1];
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };

    const response = await axios.post(sppUrl, bodyData, { headers });

    // Send the response data back to the client
    res.json(response.data);
  }
  catch (error) {
    const errorStatus = error.response ? error.response.status : 500;
    res.status(errorStatus).send(error.response ? error.response.data : 'Internal Server Error');
  }  
});

// Endpoints: Director update program info
app.put('/api/v1/director-program-information', async (req, res) => {
  try {
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    const sppUrl = siteUrl(fullUrl) + '/wp-json/app-director-update-program/v1/director-update-program';
    
    // Extract data from the request body
    const bodyData = req.body;
    
    // Extract the access token from the Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const accessToken = authHeader.split(' ')[1];
    
    // Set headers for the external API request
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };
    
    // Make a POST request to the external API endpoint with the data from the request body
    const response = await axios.put(sppUrl, bodyData, { headers });
    // Send the response data back to the client
    res.json(response.data);
  }
  catch (error) {
    const errorStatus = error.response.status;
    res.status(errorStatus).send(error.response.data);
  }
});

// Endpoint: Check to see if director account has any associate program
app.get('/api/v1/director-owned-program/:userId', async (req, res) => {
  const getUserId = req.params.userId;
  try {
    // Get the full URL of the request
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    const sppUrl = siteUrl(fullUrl) + '/wp-json/app-director-owned-program-data/v1/director-owned-program-data/' + getUserId;
    // Extract the refresh token from the Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const accessToken = authHeader.split(' ')[1];
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };

    const response = await axios.get(sppUrl, { headers });
    const jsonString = JSON.stringify(response.data);
    // Compress the JSON string using gzip
    zlib.gzip(jsonString, (err, compressedData) => {
      if(err){
        // Handle error
        console.error('Error compressing data:', err);
        res.status(500).send('Internal Server Error');
        return;
      }
      // Set response headers to indicate gzip compression
      res.set({
        'Content-Type': 'application/json',
        'Content-Encoding': 'gzip'
      });
      // Send compressed data as response
      res.send(compressedData);
    });
  }
  catch (error) {
    const errorStatus = error.response ? error.response.status : 500;
    res.status(errorStatus).send(error.response ? error.response.data : 'Internal Server Error');
  }  
});

// Endpoint: Get divison of an event
app.get('/api/v1/event-division/:eventId/:rosterDivision', async (req, res) => {
  const getEventId = req.params.eventId;
  const getRosterDivision = req.params.rosterDivision;
  try {
    // Get the full URL of the request
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    const sppUrl = siteUrl(fullUrl) + '/wp-json/app-event-division/v1/event-division/' + getEventId + '/' + getRosterDivision;
    // Extract the refresh token from the Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const accessToken = authHeader.split(' ')[1];
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };

    const response = await axios.get(sppUrl, { headers });
    const jsonString = JSON.stringify(response.data);
    // Compress the JSON string using gzip
    zlib.gzip(jsonString, (err, compressedData) => {
      if(err){
        // Handle error
        console.error('Error compressing data:', err);
        res.status(500).send('Internal Server Error');
        return;
      }
      // Set response headers to indicate gzip compression
      res.set({
        'Content-Type': 'application/json',
        'Content-Encoding': 'gzip'
      });
      // Send compressed data as response
      res.send(compressedData);
    });
  }
  catch (error) {
    const errorStatus = error.response ? error.response.status : 500;
    res.status(errorStatus).send(error.response ? error.response.data : 'Internal Server Error');
  }  
});

// Endpoint: Get level of an event
app.get('/api/v1/event-level/:eventId/:divisionId', async (req, res) => {
  const getDivisionId = req.params.divisionId;
  const getEventId = req.params.eventId;
  try {
    // Get the full URL of the request
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    const sppUrl = siteUrl(fullUrl) + '/wp-json/app-event-level/v1/event-level/' + getEventId + '/' + getDivisionId;
    // Extract the refresh token from the Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const accessToken = authHeader.split(' ')[1];
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };

    const response = await axios.get(sppUrl, { headers });
    const jsonString = JSON.stringify(response.data);
    // Compress the JSON string using gzip
    zlib.gzip(jsonString, (err, compressedData) => {
      if(err){
        // Handle error
        console.error('Error compressing data:', err);
        res.status(500).send('Internal Server Error');
        return;
      }
      // Set response headers to indicate gzip compression
      res.set({
        'Content-Type': 'application/json',
        'Content-Encoding': 'gzip'
      });
      // Send compressed data as response
      res.send(compressedData);
    });
  }
  catch (error) {
    const errorStatus = error.response ? error.response.status : 500;
    res.status(errorStatus).send(error.response ? error.response.data : 'Internal Server Error');
  }  
});

// Endpoint director/coach submit roster to an event
app.post('/api/v1/director-coach-roster-submission', async (req, res) => {
  const bodyData = req.body;
  try {
    // Get the full URL of the request
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    const sppUrl = siteUrl(fullUrl) + '/wp-json/app-roster-submission/v1/roster-submission';
    // Extract the refresh token from the Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const accessToken = authHeader.split(' ')[1];
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };

    const response = await axios.post(sppUrl, bodyData, { headers });

    // Send the response data back to the client
    res.json(response.data);
  }
  catch (error) {
    const errorStatus = error.response ? error.response.status : 500;
    res.status(errorStatus).send(error.response ? error.response.data : 'Internal Server Error');
  }  
});

// Endpoint: Get level of an event
app.get('/api/v1/program-information/:programId', async (req, res) => {
  const getProgramId = req.params.programId;
  try {
    // Get the full URL of the request
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    const sppUrl = siteUrl(fullUrl) + '/wp-json/app-get-program-information/v1/program-information/' + getProgramId;
    // Extract the refresh token from the Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const accessToken = authHeader.split(' ')[1];
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };

    const response = await axios.get(sppUrl, { headers });
    const jsonString = JSON.stringify(response.data);
    // Compress the JSON string using gzip
    zlib.gzip(jsonString, (err, compressedData) => {
      if(err){
        // Handle error
        console.error('Error compressing data:', err);
        res.status(500).send('Internal Server Error');
        return;
      }
      // Set response headers to indicate gzip compression
      res.set({
        'Content-Type': 'application/json',
        'Content-Encoding': 'gzip'
      });
      // Send compressed data as response
      res.send(compressedData);
    });
  }
  catch (error) {
    const errorStatus = error.response ? error.response.status : 500;
    res.status(errorStatus).send(error.response ? error.response.data : 'Internal Server Error');
  }  
});

// Endpoint: program search for program directory screen
app.get('/api/v1/program-search', async (req, res) => {
  try {
    // Get the full URL of the request
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    const sppUrl = siteUrl(fullUrl) + '/wp-json/app-search-program-data/v1/search-program';

    // Extract the refresh token from the Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const accessToken = authHeader.split(' ')[1];

    // Extract search, page, and per_page query parameters from the request
    const { search, page, per_page } = req.query;

    // Prepare the URL with query parameters
    const urlWithParams = new URL(sppUrl);
    if (search) urlWithParams.searchParams.append('search', search);
    if (page) urlWithParams.searchParams.append('page', page);
    if (per_page) urlWithParams.searchParams.append('per_page', per_page);

    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };

    // Make the request to the WordPress API
    const response = await axios.get(urlWithParams.href, { headers });
    
    // Convert JSON to string
    const jsonString = JSON.stringify(response.data);

    // Compress the JSON string using gzip
    zlib.gzip(jsonString, (err, compressedData) => {
      if (err) {
        // Handle error
        console.error('Error compressing data:', err);
        res.status(500).send('Internal Server Error');
        return;
      }
      
      // Set response headers to indicate gzip compression
      res.set({
        'Content-Type': 'application/json',
        'Content-Encoding': 'gzip'
      });

      // Send compressed data as response
      res.send(compressedData);
    });
  } catch (error) {
    const errorStatus = error.response.status;
    res.status(errorStatus).send(error.response.data);
  }
});

app.get("/debug-sentry", function mainHandler(req, res){
  throw new Error("My first Sentry error!");
});

app.use('/', router);

module.exports.handler = serverless(app);

app.get('/', (req, res) => {
  res.send('Hello 5000');
});

// The error handler must be registered before any other error middleware and after all controllers
Sentry.setupExpressErrorHandler(app);

// Optional fallthrough error handler
app.use(function onError(err, req, res, next) {
  // The error id is attached to `res.sentry` to be returned
  // and optionally displayed to the user for support.
  res.statusCode = 500;
  res.end(res.sentry + "\n");
});

app.use(errorLogger);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});