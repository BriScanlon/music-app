const fs = require('fs');
const { execSync } = require('child_process');

const directories = [
  'helpers',
  'routes',
  'middleware',
  'models'
];

const files = {
  '.env': '',
  'index.js': '',
  'helpers/logger.js': '',
  'helpers/database.js': '',
  'routes/express.js': '',
  'routes/AuthController.js': '',
  'routes/UserController.js': '',
  'routes/RoleController.js': '',
  'routes/APIKeyController.js': '',
  'routes/TenantController.js': '',
  'middleware/auth.js': '',
  'models/user.js': '',
  'models/roles.js': '',
  'models/apikeys.js': '',
  'models/tenants.js': ''
};

// Function to create directories
const createDirectories = () => {
  directories.forEach(dir => {
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Directory created: ${dir}`);
    }
  });
};

// Function to create files
const createFiles = () => {
  Object.keys(files).forEach(filePath => {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, files[filePath]);
      console.log(`File created: ${filePath}`);
    }
  });
};

// Initialize npm and install dependencies
const initializeNpm = () => {
  if (!fs.existsSync('package.json')) {
    execSync('npm init -y');
    console.log('Initialized npm project.');
  }

  const dependencies = [
    'express@^4.17.1',
    'mongoose@^6.0.0',
    'dotenv@^16.0.0',
    'bcrypt@^5.0.1',
    'jsonwebtoken@^9.0.0',
    'cors@^2.8.5',
    'body-parser@^1.19.0',
    'node-cron@^3.0.0'
  ];

  execSync(`npm install ${dependencies.join(' ')}`);
  console.log('Installed dependencies:', dependencies.join(', '));
};

// Create directories and files
initializeNpm();
createDirectories();
createFiles();

console.log('Project structure created successfully.');

