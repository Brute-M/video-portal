const uploadArea = document.getElementById('uploadArea');
const videoInput = document.getElementById('videoInput');
const videoPreview = document.getElementById('videoPreview');
const previewVideo = document.getElementById('previewVideo');
const fileName = document.getElementById('fileName');
const removeVideo = document.getElementById('removeVideo');
const analyzeBtn = document.getElementById('analyzeBtn');
const resultsSection = document.getElementById('resultsSection');
const resultsContent = document.getElementById('resultsContent');
const newAnalysisBtn = document.getElementById('newAnalysisBtn');
const errorMessage = document.getElementById('errorMessage');
const roleChips = document.querySelectorAll('.role-chip');
const systemPromptInput = document.getElementById('systemPrompt');

let selectedFile = null;
let selectedRole = null; // 'batsman', 'bowler', or 'wicket-keeper'

// Click to upload
uploadArea.addEventListener('click', () => {
    videoInput.click();
});

// File input change
videoInput.addEventListener('change', (e) => {
    handleFile(e.target.files[0]);
});

// Drag and drop
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('video/')) {
        handleFile(file);
    } else {
        showError('Please upload a valid video file');
    }
});

// Handle file selection
function handleFile(file) {
    if (!file) return;

    // Validate file size (100MB)
    if (file.size > 100 * 1024 * 1024) {
        showError('File size exceeds 100MB limit');
        return;
    }

    selectedFile = file;
    const fileURL = URL.createObjectURL(file);
    
    previewVideo.src = fileURL;
    fileName.textContent = file.name;
    
    uploadArea.style.display = 'none';
    videoPreview.style.display = 'block';
    analyzeBtn.disabled = false;
    hideError();
}

// Remove video
removeVideo.addEventListener('click', () => {
    selectedFile = null;
    previewVideo.src = '';
    uploadArea.style.display = 'block';
    videoPreview.style.display = 'none';
    analyzeBtn.disabled = true;
    videoInput.value = '';
    hideError();
});

// Role selection handling
roleChips.forEach(chip => {
    chip.addEventListener('click', () => {
        // Remove active class from all chips
        roleChips.forEach(c => c.classList.remove('active'));
        // Add active class to clicked chip
        chip.classList.add('active');
        selectedRole = chip.dataset.role;
        console.log('Selected role:', selectedRole);
    });
});

// Check server connection on page load
window.addEventListener('load', async () => {
    try {
        const response = await fetch('/api/health');
        if (!response.ok) {
            console.warn('Server health check failed');
        }
    } catch (error) {
        console.error('Cannot connect to server:', error);
        showError('Cannot connect to server. Please make sure the server is running on http://localhost:3000');
    }
});

// Analyze video
analyzeBtn.addEventListener('click', async () => {
    if (!selectedFile) return;

    // Validate role selection
    if (!selectedRole) {
        showError('Please select a player role (Batsman, Bowler, or Wicket-Keeper)');
        return;
    }
    
    console.log('Selected role before sending:', selectedRole);

    // Show loading state
    analyzeBtn.disabled = true;
    analyzeBtn.querySelector('.btn-text').textContent = 'Analyzing...';
    analyzeBtn.querySelector('.btn-loader').style.display = 'block';
    hideError();
    resultsSection.style.display = 'none';

    const formData = new FormData();
    formData.append('video', selectedFile);
    formData.append('role', selectedRole);
    
    // Add custom system prompt if provided
    const customPrompt = systemPromptInput.value.trim();
    if (customPrompt) {
        formData.append('systemPrompt', customPrompt);
    }

    try {
        console.log('Sending video for analysis...');
        console.log('Role:', selectedRole);
        console.log('Custom prompt:', customPrompt || 'Using default');
        
        const response = await fetch('/api/analyze', {
            method: 'POST',
            body: formData
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error occurred' }));
            throw new Error(errorData.error || errorData.message || `Server error: ${response.status}`);
        }

        const data = await response.json();
        console.log('Analysis received', data);

        // Display results as formatted JSON
        if (data.data) {
          // Format and display JSON response
          const formattedJson = JSON.stringify(data.data, null, 2);
          resultsContent.innerHTML = `<pre class="json-display">${escapeHtml(formattedJson)}</pre>`;
        } else if (data.analysis) {
          // Fallback for old format
          resultsContent.textContent = data.analysis;
        } else {
          resultsContent.textContent = JSON.stringify(data, null, 2);
        }
        
        resultsSection.style.display = 'block';
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    } catch (error) {
        console.error('Error:', error);
        if (error.name === 'TypeError' && (error.message.includes('fetch') || error.message.includes('Failed to fetch'))) {
            showError('Failed to connect to server. Please make sure:\n1. The server is running (npm start)\n2. The server is accessible at http://localhost:3000\n3. Check the browser console for more details');
        } else {
            showError(error.message || 'Failed to analyze video. Please try again.');
        }
    } finally {
        // Reset button state
        analyzeBtn.disabled = false;
        analyzeBtn.querySelector('.btn-text').textContent = 'Analyze Video';
        analyzeBtn.querySelector('.btn-loader').style.display = 'none';
    }
});

// New analysis
newAnalysisBtn.addEventListener('click', () => {
    selectedFile = null;
    previewVideo.src = '';
    uploadArea.style.display = 'block';
    videoPreview.style.display = 'none';
    resultsSection.style.display = 'none';
    analyzeBtn.disabled = true;
    videoInput.value = '';
    hideError();
    // Don't reset role and prompt - allow user to keep their settings
});

// Error handling
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function hideError() {
    errorMessage.style.display = 'none';
}

// Helper function to escape HTML for safe display
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

