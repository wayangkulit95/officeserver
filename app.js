// app.js

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Initialize Express app
const app = express();
const port = 3000;

// Enable CORS
app.use(cors());

// Middleware to serve static files (uploaded files)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Set up file storage for uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    cb(null, dir);  // Store files in 'uploads' folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Create unique filenames
  },
});

// Create an upload instance
const upload = multer({ storage: storage });

// Middleware for parsing JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route to serve the HTML, CSS, JS for the frontend
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>File Management Panel</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          background: #f4f4f4;
        }

        h2 {
          color: #333;
        }

        .upload-area {
          margin-bottom: 20px;
        }

        .upload-area button {
          padding: 10px 15px;
          font-size: 16px;
          background: #16a085;
          color: white;
          border: none;
          cursor: pointer;
        }

        .upload-area button:hover {
          background: #1abc9c;
        }

        .file-list {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
        }

        .file-item {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
          flex: 1 1 calc(33% - 20px);
        }

        .file-item button {
          background: #e74c3c;
          color: white;
          border: none;
          padding: 8px 12px;
          font-size: 14px;
          border-radius: 4px;
          cursor: pointer;
        }

        .file-item button:hover {
          background: #c0392b;
        }

        .file-preview {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .file-preview .preview-content {
          background: white;
          padding: 30px;
          border-radius: 8px;
          width: 60%;
        }

        .file-preview textarea {
          width: 100%;
          height: 200px;
          font-size: 16px;
          border-radius: 6px;
          padding: 10px;
          border: 1px solid #ccc;
        }
      </style>
    </head>
    <body>

      <h2>Manage Your Files</h2>

      <!-- Upload Area -->
      <div class="upload-area">
        <input type="file" id="fileInput" onchange="uploadFile(event)">
        <button onclick="document.getElementById('fileInput').click();">Browse Files</button>
      </div>

      <!-- File List -->
      <div class="file-list" id="fileList"></div>

      <!-- File Preview Modal -->
      <div class="file-preview" id="filePreviewModal">
        <div class="preview-content">
          <h3 id="previewFileName">Edit File</h3>
          <textarea id="fileContent" placeholder="Edit your file content here..."></textarea>
          <button onclick="saveFileChanges()">Save Changes</button>
          <button onclick="closePreview()">Close</button>
        </div>
      </div>

      <script>
        const serverURL = 'http://localhost:3000';

        // Function to upload a file
        function uploadFile(event) {
          const file = event.target.files[0];
          const formData = new FormData();
          formData.append('file', file);

          fetch('${serverURL}/upload', {
            method: 'POST',
            body: formData,
          })
          .then(response => response.json())
          .then(data => {
            console.log('File uploaded:', data);
            loadFiles();
          })
          .catch(error => {
            console.error('Error uploading file:', error);
          });
        }

        // Function to load file list
        function loadFiles() {
          fetch('${serverURL}/files')
            .then(response => response.json())
            .then(files => {
              const fileListDiv = document.getElementById('fileList');
              fileListDiv.innerHTML = ''; // Clear previous file list
              files.forEach(file => {
                const fileItem = document.createElement('div');
                fileItem.classList.add('file-item');
                fileItem.innerHTML = `
                  <strong>${file}</strong><br>
                  <button onclick="editFile('${file}')">Edit</button>
                  <button onclick="deleteFile('${file}')">Delete</button>
                `;
                fileListDiv.appendChild(fileItem);
              });
            });
        }

        // Function to edit a file
        function editFile(filename) {
          fetch('${serverURL}/uploads/' + filename)
            .then(response => response.text())
            .then(content => {
              document.getElementById('fileContent').value = content;
              document.getElementById('previewFileName').innerText = 'Editing: ' + filename;
              document.getElementById('filePreviewModal').style.display = 'flex';
              window.currentFileName = filename; // Store the filename for saving changes
            });
        }

        // Function to save changes made to a file
        function saveFileChanges() {
          const newContent = document.getElementById('fileContent').value;
          fetch('${serverURL}/file/' + window.currentFileName, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content: newContent }),
          })
          .then(response => response.text())
          .then(() => {
            loadFiles();
            closePreview();
          });
        }

        // Function to close the preview modal
        function closePreview() {
          document.getElementById('filePreviewModal').style.display = 'none';
        }

        // Function to delete a file
        function deleteFile(filename) {
          fetch('${serverURL}/file/' + filename, {
            method: 'DELETE',
          })
          .then(() => {
            loadFiles();
          })
          .catch(error => {
            console.error('Error deleting file:', error);
          });
        }

        // Load files on page load
        loadFiles();
      </script>
    </body>
    </html>
  `);
});

// Route to upload files
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded');
  }
  res.status(200).json({
    message: 'File uploaded successfully',
    file: req.file,
  });
});

// Route to retrieve a list of uploaded files
app.get('/files', (req, res) => {
  const directoryPath = path.join(__dirname, 'uploads');
  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      return res.status(500).send('Unable to scan files');
    }
    res.status(200).json(files);
  });
});

// Route to delete a file
app.delete('/file/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', filename);
  
  fs.unlink(filePath, (err) => {
    if (err) {
      return res.status(500).send('Error deleting file');
    }
    res.status(200).send('File deleted successfully');
  });
});

// Route to edit a text file
app.put('/file/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', filename);

  // Save the new content from the request body
  fs.writeFile(filePath, req.body.content, (err) => {
    if (err) {
      return res.status(500).send('Error editing file');
    }
    res.status(200).send('File updated successfully');
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
