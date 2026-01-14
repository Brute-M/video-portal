const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const cors = require('cors');
const OpenAI = require('openai');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const ffprobeInstaller = require('@ffprobe-installer/ffprobe');
require('dotenv').config();

// Set ffmpeg and ffprobe paths
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Ensure uploads and frames directories exist
const uploadsDir = path.join(__dirname, 'uploads');
const framesDir = path.join(__dirname, 'frames');
fs.ensureDirSync(uploadsDir);
fs.ensureDirSync(framesDir);

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'video-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /mp4|mov|avi|mkv|webm/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed (mp4, mov, avi, mkv, webm)'));
    }
  }
});

// Default system prompts for different roles
const DEFAULT_PROMPTS = {
  batsman: `You are an expert cricket coach and analyst specializing in batting technique and performance evaluation. Your task is to analyze cricket trial videos focusing EXCLUSIVELY on batting performance and provide comprehensive, constructive feedback.

IMPORTANT: You must ONLY analyze batting skills and techniques. IGNORE and DO NOT mention:
- Bowling techniques or bowling performance
- Fielding skills or fielding performance
- Any aspects related to bowling or fielding

When analyzing a batsman's performance, focus ONLY on:

1. **Stance and Setup:**
   - Initial stance and balance
   - Grip on the bat
   - Head position and eye level
   - Body alignment and posture

2. **Footwork and Movement:**
   - Forward and backward movement
   - Foot positioning for different shots
   - Balance during shot execution
   - Quickness and agility

3. **Shot Selection and Execution:**
   - Shot selection based on ball line and length
   - Timing of shots
   - Power and placement
   - Defensive techniques
   - Attacking shots (drives, cuts, pulls, sweeps)
   - Ability to rotate strike

4. **Technical Aspects:**
   - Bat swing path
   - Follow-through
   - Weight transfer
   - Hand-eye coordination
   - Ability to play spin and pace

5. **Overall Assessment:**
   - Strengths and weaknesses in batting
   - Potential and development areas for batting
   - Recommendations for batting improvement
   - Suitability for different formats (Test, ODI, T20) as a batsman
   - Areas requiring immediate attention in batting

Provide detailed, specific, and actionable feedback ONLY about batting. Be constructive and encouraging while being honest about areas that need work.

IMPORTANT: You must respond with a valid JSON object only. Do not include any markdown formatting or code blocks. Return pure JSON that can be parsed directly.

When analyzing multiple frames from a video, consider the sequence and movement between frames to provide insights about batting technique, timing, and flow. Remember: ONLY analyze batting - ignore any bowling or fielding aspects completely.`,

  bowler: `You are an expert cricket coach and analyst specializing in bowling technique and performance evaluation. Your task is to analyze cricket trial videos focusing EXCLUSIVELY on bowling performance and provide comprehensive, constructive feedback.

IMPORTANT: You must ONLY analyze bowling skills and techniques. IGNORE and DO NOT mention:
- Batting techniques or batting performance
- Fielding skills or fielding performance
- Any aspects related to batting or fielding

When analyzing a bowler's performance, focus ONLY on:

1. **Run-up and Approach:**
   - Consistency of run-up
   - Speed and rhythm
   - Approach to the crease
   - Body position during approach

2. **Bowling Action:**
   - Delivery stride and jump
   - Arm action and rotation
   - Release point and follow-through
   - Body alignment and balance
   - Use of non-bowling arm

3. **Line and Length:**
   - Consistency of line
   - Accuracy of length
   - Ability to hit specific areas
   - Variation in line and length

4. **Pace and Variations:**
   - Pace and speed
   - Seam position
   - Swing (if applicable)
   - Variations (slower balls, cutters, etc.)
   - Control and accuracy

5. **Technical Aspects:**
   - Wrist position
   - Finger position on the ball
   - Body mechanics
   - Energy transfer
   - Repeatability of action

6. **Overall Assessment:**
   - Strengths and weaknesses in bowling
   - Potential and development areas for bowling
   - Recommendations for bowling improvement
   - Suitability for different formats (Test, ODI, T20) as a bowler
   - Areas requiring immediate attention in bowling

Provide detailed, specific, and actionable feedback ONLY about bowling. Be constructive and encouraging while being honest about areas that need work.

IMPORTANT: You must respond with a valid JSON object only. Do not include any markdown formatting or code blocks. Return pure JSON that can be parsed directly.

When analyzing multiple frames from a video, consider the sequence and movement between frames to provide insights about bowling action, rhythm, and consistency. Remember: ONLY analyze bowling - ignore any batting or fielding aspects completely.`,

  'wicket-keeper': `You are an expert cricket coach and analyst specializing in wicket-keeping technique and performance evaluation. Your task is to analyze cricket trial videos focusing EXCLUSIVELY on wicket-keeping performance and provide comprehensive, constructive feedback.

IMPORTANT: You must ONLY analyze wicket-keeping skills and techniques. IGNORE and DO NOT mention:
- Batting techniques or batting performance
- Bowling techniques or bowling performance
- Any aspects related to batting or bowling

When analyzing a wicket-keeper's performance, focus ONLY on:

1. **Stance and Positioning:**
   - Initial stance and balance
   - Distance from the stumps
   - Body position and posture
   - Readiness and alertness
   - Hand positioning

2. **Movement and Agility:**
   - Lateral movement (left and right)
   - Forward and backward movement
   - Quickness and reaction time
   - Balance during movement
   - Footwork and positioning

3. **Catching Technique:**
   - Hand positioning for catches
   - Soft hands technique
   - High catches and low catches
   - One-handed vs two-handed catches
   - Body position during catches
   - Follow-through after catches

4. **Stumping Technique:**
   - Quickness in removing bails
   - Hand-eye coordination
   - Timing and anticipation
   - Body position during stumping
   - Ability to read the batsman

5. **Technical Aspects:**
   - Glove work and hand positioning
   - Body alignment and balance
   - Communication with fielders
   - Ability to stand up to spinners vs pacers
   - Reading the ball and batsman
   - Diving and acrobatic saves

6. **Overall Assessment:**
   - Strengths and weaknesses in wicket-keeping
   - Potential and development areas for wicket-keeping
   - Recommendations for wicket-keeping improvement
   - Suitability for different formats (Test, ODI, T20) as a wicket-keeper
   - Areas requiring immediate attention in wicket-keeping

Provide detailed, specific, and actionable feedback ONLY about wicket-keeping. Be constructive and encouraging while being honest about areas that need work.

IMPORTANT: You must respond with a valid JSON object only. Do not include any markdown formatting or code blocks. Return pure JSON that can be parsed directly.

When analyzing multiple frames from a video, consider the sequence and movement between frames to provide insights about wicket-keeping technique, agility, and consistency. Remember: ONLY analyze wicket-keeping - ignore any batting or bowling aspects completely.`
};

// Function to get system prompt based on role and custom prompt
function getSystemPrompt(role, customPrompt) {
  if (customPrompt && customPrompt.trim()) {
    return customPrompt.trim();
  }
  
  // Role is already normalized when passed to this function
  // But handle edge cases
  const normalizedRole = role ? role.toLowerCase().replace(/\s+/g, '-') : '';
  
  // Handle wicket-keeper variations first
  if (normalizedRole === 'wicketkeeper' || normalizedRole === 'wicket-keeper') {
    console.log('Selecting wicket-keeper system prompt');
    return DEFAULT_PROMPTS['wicket-keeper'];
  }
  
  // Use role-specific default prompt
  if (normalizedRole && DEFAULT_PROMPTS[normalizedRole]) {
    console.log('Selecting system prompt for role:', normalizedRole);
    return DEFAULT_PROMPTS[normalizedRole];
  }
  
  // Fallback to batsman prompt if role not recognized
  console.log('WARNING: Role not found in DEFAULT_PROMPTS, using batsman prompt. Role was:', normalizedRole);
  return DEFAULT_PROMPTS.batsman;
}

// Function to get video duration using ffprobe
function getVideoDuration(videoPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        console.warn('Could not get video duration, using default:', err.message);
        resolve(30); // Default to 30 seconds if duration cannot be determined
      } else {
        const duration = metadata.format.duration || 30;
        resolve(duration);
      }
    });
  });
}

// Function to extract frames from video
function extractFrames(videoPath, outputDir, frameInterval = 2) {
  return new Promise(async (resolve, reject) => {
    try {
      // First, get video duration
      const duration = await getVideoDuration(videoPath);
      console.log(`Video duration: ${duration} seconds`);
      
      // Calculate timestamps for frame extraction (every N seconds, max 10 frames)
      const maxFrames = 10;
      const timestamps = [];
      for (let i = 0; i < duration && timestamps.length < maxFrames; i += frameInterval) {
        timestamps.push(i);
      }
      
      // If no frames calculated, extract at least one frame at the start
      if (timestamps.length === 0) {
        timestamps.push(0);
      }
      
      console.log(`Extracting frames at timestamps: ${timestamps.join(', ')}`);
      
      ffmpeg(videoPath)
        .on('end', () => {
          // Read all frame files after extraction
          try {
            const frameFiles = fs.readdirSync(outputDir)
              .filter(file => file.startsWith('frame-') && file.endsWith('.png'))
              .sort()
              .map(file => path.join(outputDir, file));
            
            console.log(`Extracted ${frameFiles.length} frames`);
            resolve(frameFiles);
          } catch (err) {
            reject(new Error(`Failed to read extracted frames: ${err.message}`));
          }
        })
        .on('error', (err) => {
          console.error('FFmpeg error:', err);
          reject(new Error(`Frame extraction failed: ${err.message}`));
        })
        .screenshots({
          timestamps: timestamps,
          filename: 'frame-%03d.png',
          folder: outputDir,
          size: '1280x720' // Resize to reduce file size and processing time
        });
    } catch (error) {
      reject(error);
    }
  });
}

// Function to convert image to base64
function imageToBase64(imagePath) {
  const imageBuffer = fs.readFileSync(imagePath);
  return imageBuffer.toString('base64');
}

// Error handling middleware for multer
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 100MB' });
    }
    return res.status(400).json({ error: error.message });
  }
  if (error) {
    return res.status(400).json({ error: error.message });
  }
  next();
});

// Upload and analyze endpoint
app.post('/api/analyze', upload.single('video'), async (req, res) => {
  const frameDir = path.join(framesDir, `frames-${Date.now()}`);
  let frameFiles = [];
  
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
      return res.status(500).json({ error: 'OpenAI API key not configured. Please set OPENAI_API_KEY in your .env file' });
    }

    console.log('Processing video:', req.file.originalname, 'Size:', req.file.size);
    
    // Get role and custom system prompt from request
    let role = req.body.role || 'batsman';
    console.log('Raw role from request:', role);
    
    // Normalize role name
    role = role.toLowerCase().replace(/\s+/g, '-');
    // Handle wicket-keeper variations
    if (role === 'wicketkeeper') {
      role = 'wicket-keeper';
    }
    
    const customPrompt = req.body.systemPrompt || '';
    
    console.log('Normalized role:', role);
    console.log('Custom prompt provided:', !!customPrompt);
    
    // Get the appropriate system prompt
    const systemPrompt = getSystemPrompt(role, customPrompt);
    console.log('System prompt selected for role:', role);
    
    const videoPath = req.file.path;

    // Create temporary directory for frames
    fs.ensureDirSync(frameDir);

    // Extract frames from video (1 frame every 2 seconds)
    console.log('Extracting frames from video...');
    frameFiles = await extractFrames(videoPath, frameDir, 2);

    if (frameFiles.length === 0) {
      throw new Error('Failed to extract frames from video');
    }

    // Limit to maximum 10 frames to avoid token limits
    const maxFrames = 10;
    const selectedFrames = frameFiles.slice(0, maxFrames);
    if (frameFiles.length > maxFrames) {
      console.log(`Video has ${frameFiles.length} frames, analyzing first ${maxFrames} frames`);
    }

    console.log(`Analyzing ${selectedFrames.length} frames with OpenAI...`);

    // Convert frames to base64
    const frameImages = selectedFrames.map(framePath => {
      const base64Image = imageToBase64(framePath);
      return {
        type: "image_url",
        image_url: {
          url: `data:image/png;base64,${base64Image}`,
          detail: "high"
        }
      };
    });

    // Prepare role-specific user prompt
    // Note: role is already normalized to lowercase with hyphens
    let userPromptText = '';
    console.log('Preparing user prompt for role:', role);
    if (role === 'batsman') {
      userPromptText = `Please analyze this cricket trial video by examining ${selectedFrames.length} key frames extracted from the video. These frames represent different moments in the player's batting performance. 

IMPORTANT: Focus EXCLUSIVELY on batting skills and techniques. IGNORE any bowling or fielding aspects completely. 

Provide comprehensive feedback ONLY on:
- Batting stance, grip, and setup
- Footwork and movement
- Shot selection and execution
- Batting technique and timing
- Batting strengths and weaknesses

Be specific about batting strengths, weaknesses, and areas for improvement. Consider the sequence and flow between frames when analyzing batting movement and technique. Do NOT mention bowling or fielding at all.

IMPORTANT: You must respond with a valid JSON object only. The JSON should have the following structure:
{
  "role": "batsman",
  "analysis": {
    "stance_and_setup": "detailed analysis here",
    "footwork_and_movement": "detailed analysis here",
    "shot_selection_and_execution": "detailed analysis here",
    "technical_aspects": "detailed analysis here",
    "overall_assessment": {
      "strengths": ["strength1", "strength2"],
      "weaknesses": ["weakness1", "weakness2"],
      "recommendations": ["recommendation1", "recommendation2"],
      "suitability": {
        "test": "assessment",
        "odi": "assessment",
        "t20": "assessment"
      }
    }
  }
}`;
    } else if (role === 'bowler') {
      userPromptText = `Please analyze this cricket trial video by examining ${selectedFrames.length} key frames extracted from the video. These frames represent different moments in the player's bowling performance.

IMPORTANT: Focus EXCLUSIVELY on bowling skills and techniques. IGNORE any batting or fielding aspects completely.

Provide comprehensive feedback ONLY on:
- Bowling run-up and approach
- Bowling action and delivery
- Line and length consistency
- Pace and variations
- Bowling technique and control

Be specific about bowling strengths, weaknesses, and areas for improvement. Consider the sequence and flow between frames when analyzing bowling action and rhythm. Do NOT mention batting or fielding at all.

IMPORTANT: You must respond with a valid JSON object only. The JSON should have the following structure:
{
  "role": "bowler",
  "analysis": {
    "run_up_and_approach": "detailed analysis here",
    "bowling_action": "detailed analysis here",
    "line_and_length": "detailed analysis here",
    "pace_and_variations": "detailed analysis here",
    "technical_aspects": "detailed analysis here",
    "overall_assessment": {
      "strengths": ["strength1", "strength2"],
      "weaknesses": ["weakness1", "weakness2"],
      "recommendations": ["recommendation1", "recommendation2"],
      "suitability": {
        "test": "assessment",
        "odi": "assessment",
        "t20": "assessment"
      }
    }
  }
}`;
    } else if (role === 'wicket-keeper') {
      console.log('Using wicket-keeper user prompt');
      userPromptText = `Please analyze this cricket trial video by examining ${selectedFrames.length} key frames extracted from the video. These frames represent different moments in the player's wicket-keeping performance.

IMPORTANT: Focus EXCLUSIVELY on wicket-keeping skills and techniques. IGNORE any batting or bowling aspects completely.

Provide comprehensive feedback ONLY on:
- Wicket-keeping stance and positioning
- Movement and agility
- Catching technique
- Stumping technique
- Wicket-keeping technical aspects

Be specific about wicket-keeping strengths, weaknesses, and areas for improvement. Consider the sequence and flow between frames when analyzing wicket-keeping movement and technique. Do NOT mention batting or bowling at all.

IMPORTANT: You must respond with a valid JSON object only. The JSON should have the following structure:
{
  "role": "wicket-keeper",
  "analysis": {
    "stance_and_positioning": "detailed analysis here",
    "movement_and_agility": "detailed analysis here",
    "catching_technique": "detailed analysis here",
    "stumping_technique": "detailed analysis here",
    "technical_aspects": "detailed analysis here",
    "overall_assessment": {
      "strengths": ["strength1", "strength2"],
      "weaknesses": ["weakness1", "weakness2"],
      "recommendations": ["recommendation1", "recommendation2"],
      "suitability": {
        "test": "assessment",
        "odi": "assessment",
        "t20": "assessment"
      }
    }
  }
}`;
    } else {
      console.log('WARNING: Role not recognized, using default prompt. Role was:', role);
      userPromptText = `Please analyze this cricket trial video by examining ${selectedFrames.length} key frames extracted from the video. These frames represent different moments in the player's performance. Provide comprehensive feedback on the player's performance. Be specific about strengths, weaknesses, and areas for improvement. Consider the sequence and flow between frames when analyzing movement and technique.

IMPORTANT: You must respond with a valid JSON object only. The JSON should have the following structure:
{
  "role": "player",
  "analysis": {
    "performance_summary": "detailed analysis here",
    "overall_assessment": {
      "strengths": ["strength1", "strength2"],
      "weaknesses": ["weakness1", "weakness2"],
      "recommendations": ["recommendation1", "recommendation2"]
    }
  }
}`;
    }

    // Prepare content array with text and all frames
    const content = [
      {
        type: "text",
        text: userPromptText
      },
      ...frameImages
    ];

    // Analyze frames using OpenAI Vision API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: content
        }
      ],
      max_tokens: 3000
    });

    console.log('Analysis complete');

    // Clean up files
    fs.remove(videoPath).catch(err => console.error('Error removing video file:', err));
    fs.remove(frameDir).catch(err => console.error('Error removing frames directory:', err));

    const analysisText = completion.choices[0].message.content;
    
    // Try to parse the response as JSON
    let analysisData;
    try {
      // Remove markdown code blocks if present
      let cleanedText = analysisText.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      analysisData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.warn('Failed to parse analysis as JSON, returning as text:', parseError.message);
      // If parsing fails, wrap the text response in a JSON structure
      analysisData = {
        role: role.toLowerCase(),
        analysis: {
          raw_analysis: analysisText,
          note: "Analysis could not be parsed as structured JSON"
        }
      };
    }

    res.json({
      success: true,
      data: analysisData,
      filename: req.file.originalname,
      framesAnalyzed: selectedFrames.length,
      role: role.toLowerCase()
    });

  } catch (error) {
    console.error('Analysis error:', error);
    console.error('Error stack:', error.stack);
    
    // Clean up files on error
    if (req.file && req.file.path) {
      fs.remove(req.file.path).catch(err => console.error('Error removing video file:', err));
    }
    
    if (fs.pathExistsSync(frameDir)) {
      fs.remove(frameDir).catch(err => console.error('Error removing frames directory:', err));
    }

    // Provide more detailed error messages
    let errorMessage = 'Failed to analyze video';
    if (error.message) {
      errorMessage = error.message;
    } else if (error.response) {
      errorMessage = `OpenAI API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`;
    }

    res.status(500).json({
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Cricket Video Analyzer API is running' });
});

// Error handling for unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

// Error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Make sure to set OPENAI_API_KEY in your .env file');
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
    console.warn('⚠️  WARNING: OPENAI_API_KEY is not set or is using placeholder value!');
  }
});

