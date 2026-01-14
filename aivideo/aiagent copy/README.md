# 🏏 Cricket Trial Video Analyzer

An AI-powered platform for analyzing cricket trial videos using OpenAI's GPT-4 Vision API. Upload cricket videos and receive comprehensive performance analysis including batting, bowling, and fielding feedback.

## Features

- 📹 **Video Upload**: Support for multiple video formats (MP4, MOV, AVI, MKV, WEBM)
- 🎬 **Frame Extraction**: Automatically extracts key frames from videos using FFmpeg
- 🤖 **AI Analysis**: Powered by OpenAI GPT-4 Vision API analyzing video frames
- 📊 **Comprehensive Feedback**: Detailed analysis of batting, bowling, and fielding techniques
- 🎨 **Modern UI**: Beautiful, responsive web interface
- ⚡ **Real-time Processing**: Fast video analysis with progress indicators

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))
- FFmpeg (automatically installed via npm package)

## Installation

1. **Clone or navigate to the project directory:**
   ```bash
   cd aiagent
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the root directory:
   ```env
   PORT=3000
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. **Start the server:**
   ```bash
   npm start
   ```
   
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to `http://localhost:3000`

## Usage

1. **Upload a Video:**
   - Click the upload area or drag and drop a cricket video
   - Supported formats: MP4, MOV, AVI, MKV, WEBM
   - Maximum file size: 100MB

2. **Preview:**
   - Review your uploaded video
   - Click "Remove" if you want to select a different video

3. **Analyze:**
   - Click the "Analyze Video" button
   - The system will extract key frames from your video (1 frame every 2 seconds)
   - Wait for the AI to analyze the frames (this may take a minute or two)

4. **Review Results:**
   - Read the comprehensive analysis
   - The analysis includes:
     - Batting technique evaluation
     - Bowling analysis
     - Fielding assessment
     - Overall performance feedback
     - Improvement recommendations

5. **New Analysis:**
   - Click "Analyze Another Video" to start over

## API Endpoints

### POST `/api/analyze`
Upload and analyze a cricket video.

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body: `video` (file)

**Response:**
```json
{
  "success": true,
  "analysis": "Detailed analysis text...",
  "filename": "video.mp4"
}
```

### GET `/api/health`
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "message": "Cricket Video Analyzer API is running"
}
```

## Project Structure

```
aiagent/
├── server.js          # Express server and API endpoints
├── package.json       # Dependencies and scripts
├── .env              # Environment variables (create this)
├── .gitignore        # Git ignore file
├── uploads/          # Temporary video storage (auto-created)
└── public/           # Frontend files
    ├── index.html    # Main HTML page
    ├── styles.css    # Styling
    └── script.js     # Frontend JavaScript
```

## System Prompt

The platform uses a specialized cricket analysis system prompt that focuses on:
- Batting technique (stance, grip, footwork, shot selection)
- Bowling analysis (run-up, action, line and length)
- Fielding assessment (positioning, catching, throwing)
- Overall performance evaluation and recommendations

## Limitations

- Maximum video file size: 100MB
- Requires active internet connection for OpenAI API
- Video processing time depends on video length and API response time
- OpenAI API usage incurs costs (check OpenAI pricing)

## Troubleshooting

**Error: "OpenAI API key not configured"**
- Make sure you've created a `.env` file with your `OPENAI_API_KEY`

**Error: "Failed to analyze video"**
- Check your OpenAI API key is valid
- Ensure you have sufficient API credits
- Verify the video file format is supported

**Upload fails:**
- Check file size is under 100MB
- Verify file format is supported (MP4, MOV, AVI, MKV, WEBM)

## How It Works

1. **Video Upload**: User uploads a cricket video file
2. **Frame Extraction**: FFmpeg extracts key frames from the video (1 frame every 2 seconds, up to 10 frames)
3. **Image Conversion**: Frames are converted to base64-encoded images
4. **AI Analysis**: OpenAI GPT-4o analyzes all frames together, understanding the sequence and movement
5. **Results**: Comprehensive analysis is returned covering batting, bowling, and fielding techniques

## Technologies Used

- **Backend:** Node.js, Express.js
- **File Upload:** Multer
- **Video Processing:** FFmpeg (via fluent-ffmpeg)
- **AI:** OpenAI GPT-4o Vision API
- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Styling:** Modern CSS with gradients and animations

## License

MIT

## Contributing

Feel free to submit issues and enhancement requests!

