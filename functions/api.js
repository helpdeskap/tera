/**
 * Terabox Video Downloader & Player Cloudflare Worker
 * Handles video fetching, streaming, and downloading from Terabox
 */

// Configuration
const CONFIG = {
  COOKIE_NDUS: 'YybkHX8peHuiNngmL_ikuWQqo7-u65dilQzsMoLO',
  TERABOX_API: 'https://www.terabox.tech',
  TERABOX_APP: 'https://www.1024tera.com',
  USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  CACHE_TTL: 3600, // 1 hour cache
};

// CORS headers
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

/**
 * Main request handler
 */
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    // Route handling
    switch (url.pathname) {
      case '/':
        return handleHomePage();
      
      case '/info':
        return handleVideoInfo(url);
      
      case '/download':
        return handleDownload(url);
      
      case '/stream':
        return handleStream(url);
      
      case '/proxy':
        return handleProxy(url);
      
      case '/stream.m3u8':
        return handleHLSStream(url);
      
      default:
        // Default: try to extract ID and get info
        const pathId = url.pathname.slice(1);
        if (pathId && pathId.length > 0) {
          return handleVideoInfo(url, pathId);
        }
        return jsonResponse({ error: 'Invalid endpoint' }, 404);
    }
  } catch (error) {
    return jsonResponse({ 
      error: error.message,
      stack: error.stack 
    }, 500);
  }
}

/**
 * Home page with API documentation
 */
function handleHomePage() {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Terabox Worker API</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #fff;
            padding: 20px;
            line-height: 1.6;
        }
        .container {
            max-width: 1000px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        h1 { font-size: 3em; margin-bottom: 10px; text-align: center; }
        h2 { font-size: 1.8em; margin: 30px 0 15px; border-bottom: 2px solid rgba(255,255,255,0.3); padding-bottom: 10px; }
        .endpoint {
            background: rgba(255, 255, 255, 0.15);
            padding: 20px;
            border-radius: 10px;
            margin: 15px 0;
            border-left: 4px solid #ffd700;
        }
        .endpoint h3 { color: #ffd700; margin-bottom: 10px; }
        code {
            background: rgba(0, 0, 0, 0.3);
            padding: 3px 8px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
        }
        .example {
            background: rgba(0, 0, 0, 0.2);
            padding: 15px;
            border-radius: 8px;
            margin: 10px 0;
            overflow-x: auto;
        }
        .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 0.85em;
            font-weight: bold;
            margin-right: 10px;
        }
        .badge.get { background: #28a745; }
        .badge.post { background: #007bff; }
        ul { margin-left: 20px; margin-top: 10px; }
        li { margin: 8px 0; }
        a { color: #ffd700; text-decoration: none; font-weight: bold; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎬 Terabox Worker API</h1>
        <p style="text-align: center; font-size: 1.2em; margin-bottom: 40px;">
            Download and stream Terabox videos with ease
        </p>

        <h2>📡 API Endpoints</h2>

        <div class="endpoint">
            <h3><span class="badge get">GET</span> /info</h3>
            <p>Get video information and download links</p>
            <strong>Parameters:</strong>
            <ul>
                <li><code>id</code> - Terabox share ID (required)</li>
                <li><code>url</code> - Full Terabox URL (alternative)</li>
            </ul>
            <div class="example">
                <code>GET /info?id=1ABC123...</code><br>
                <code>GET /info?url=https://teraboxapp.com/s/1ABC123...</code>
            </div>
        </div>

        <div class="endpoint">
            <h3><span class="badge get">GET</span> /download</h3>
            <p>Download video file directly</p>
            <strong>Parameters:</strong>
            <ul>
                <li><code>id</code> - Terabox share ID (required)</li>
                <li><code>quality</code> - Video quality: hd, sd, or fast (default: hd)</li>
            </ul>
            <div class="example">
                <code>GET /download?id=1ABC123...&quality=hd</code>
            </div>
        </div>

        <div class="endpoint">
            <h3><span class="badge get">GET</span> /stream</h3>
            <p>Stream video with range support</p>
            <strong>Parameters:</strong>
            <ul>
                <li><code>id</code> - Terabox share ID (required)</li>
                <li><code>quality</code> - Video quality (default: hd)</li>
            </ul>
            <div class="example">
                <code>GET /stream?id=1ABC123...</code>
            </div>
        </div>

        <div class="endpoint">
            <h3><span class="badge get">GET</span> /stream.m3u8</h3>
            <p>Get HLS streaming playlist</p>
            <strong>Parameters:</strong>
            <ul>
                <li><code>id</code> - Terabox share ID (required)</li>
            </ul>
            <div class="example">
                <code>GET /stream.m3u8?id=1ABC123...</code>
            </div>
        </div>

        <div class="endpoint">
            <h3><span class="badge get">GET</span> /proxy</h3>
            <p>Proxy any Terabox URL with authentication</p>
            <strong>Parameters:</strong>
            <ul>
                <li><code>url</code> - Full video URL (required)</li>
            </ul>
            <div class="example">
                <code>GET /proxy?url=https://d.terabox.app/...</code>
            </div>
        </div>

        <h2>📝 Example Usage</h2>
        <div class="example">
            <strong>JavaScript Fetch:</strong><br><br>
            <code style="display: block; white-space: pre;">
fetch('/info?id=1ABC123...')
  .then(res => res.json())
  .then(data => {
    console.log(data.title);
    console.log(data.download_urls);
  });
            </code>
        </div>

        <h2>🔧 Features</h2>
        <ul>
            <li>✅ No login required</li>
            <li>✅ Multiple quality options (HD, SD, Fast)</li>
            <li>✅ Range request support for streaming</li>
            <li>✅ HLS streaming support</li>
            <li>✅ CORS enabled</li>
            <li>✅ Caching for better performance</li>
            <li>✅ Direct download & embed support</li>
        </ul>

        <h2>🧪 Test API</h2>
        <div class="test-container">
            <div class="test-input-group">
                <input type="text" id="testInput" placeholder="Enter Terabox ID or URL (e.g., 1ABC123... or https://teraboxapp.com/s/...)" 
                       style="width: 100%; padding: 12px; border-radius: 8px; border: none; background: rgba(255,255,255,0.2); color: #fff; font-size: 1em; margin-bottom: 15px;">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin-bottom: 15px;">
                    <button onclick="testEndpoint('/info')" class="test-btn">Get Info</button>
                    <button onclick="testEndpoint('/download')" class="test-btn">Download</button>
                    <button onclick="testEndpoint('/stream')" class="test-btn">Stream</button>
                    <button onclick="testEndpoint('/stream.m3u8')" class="test-btn">HLS</button>
                    <button onclick="clearResults()" class="test-btn" style="background: #dc3545;">Clear</button>
                </div>
            </div>
            <div id="testResults" style="display: none;">
                <h3 style="margin-top: 20px; margin-bottom: 10px;">📊 Results:</h3>
                <pre id="jsonOutput" style="background: rgba(0,0,0,0.4); padding: 20px; border-radius: 8px; overflow-x: auto; max-height: 400px; white-space: pre-wrap; word-wrap: break-word;"></pre>
                <div id="videoPlayer" style="display: none; margin-top: 20px;">
                    <h3 style="margin-bottom: 10px;">🎬 Video Preview:</h3>
                    <video id="testVideo" controls style="width: 100%; max-width: 800px; border-radius: 10px; background: #000;">
                        <source id="videoSource" src="" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>
                </div>
            </div>
            <div id="testError" style="display: none; background: rgba(220,53,69,0.3); padding: 15px; border-radius: 8px; margin-top: 15px; border-left: 4px solid #dc3545;">
                <strong>❌ Error:</strong>
                <p id="errorMessage" style="margin-top: 5px;"></p>
            </div>
            <div id="testLoading" style="display: none; text-align: center; padding: 30px;">
                <div style="border: 4px solid rgba(255,255,255,0.3); border-top: 4px solid #ffd700; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin: 0 auto;"></div>
                <p style="margin-top: 15px;">Loading...</p>
            </div>
        </div>

        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            .test-btn {
                padding: 12px 20px;
                border: none;
                border-radius: 8px;
                background: rgba(255,215,0,0.8);
                color: #000;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s;
                font-size: 0.95em;
            }
            .test-btn:hover {
                background: #ffd700;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(255,215,0,0.4);
            }
            .test-container {
                background: rgba(0,0,0,0.2);
                padding: 25px;
                border-radius: 10px;
                margin-top: 20px;
            }
            #testInput::placeholder {
                color: rgba(255,255,255,0.6);
            }
            #testInput:focus {
                outline: none;
                background: rgba(255,255,255,0.25);
                box-shadow: 0 0 0 2px rgba(255,215,0,0.5);
            }
        </style>

        <script>
            async function testEndpoint(endpoint) {
                const input = document.getElementById('testInput').value.trim();
                if (!input) {
                    showError('Please enter a Terabox ID or URL');
                    return;
                }

                // Hide previous results
                document.getElementById('testResults').style.display = 'none';
                document.getElementById('testError').style.display = 'none';
                document.getElementById('videoPlayer').style.display = 'none';
                document.getElementById('testLoading').style.display = 'block';

                try {
                    // Extract ID if URL provided
                    let id = input;
                    if (input.includes('terabox') || input.includes('1024tera')) {
                        const patterns = [
                            /teraboxapp\\.com\\/s\\/([^\\/\\?]+)/,
                            /1024tera\\.com\\/sharing\\/link\\?surl=([^&]+)/,
                            /terabox\\.tech\\/s\\/([^\\/\\?]+)/,
                            /terabox\\.app\\/s\\/([^\\/\\?]+)/
                        ];
                        for (const pattern of patterns) {
                            const match = input.match(pattern);
                            if (match) {
                                id = match[1];
                                break;
                            }
                        }
                    }

                    const url = endpoint + '?id=' + encodeURIComponent(id);
                    
                    if (endpoint === '/stream' || endpoint === '/download') {
                        // For stream/download, show video player
                        document.getElementById('testLoading').style.display = 'none';
                        document.getElementById('testResults').style.display = 'block';
                        document.getElementById('videoPlayer').style.display = 'block';
                        document.getElementById('jsonOutput').textContent = JSON.stringify({
                            message: 'Video loaded in player below',
                            endpoint: url,
                            note: endpoint === '/download' ? 'This will download when opened directly' : 'Streaming with range support'
                        }, null, 2);
                        
                        const video = document.getElementById('testVideo');
                        const source = document.getElementById('videoSource');
                        source.src = url;
                        video.load();
                    } else {
                        // For info/hls endpoints, fetch and display JSON
                        const response = await fetch(url);
                        let data;
                        const contentType = response.headers.get('content-type');
                        
                        if (contentType && contentType.includes('application/json')) {
                            data = await response.json();
                        } else {
                            const text = await response.text();
                            data = {
                                error: 'Non-JSON response received',
                                status: response.status,
                                contentType: contentType,
                                response: text.substring(0, 500) + (text.length > 500 ? '...' : '')
                            };
                        }
                        
                        document.getElementById('testLoading').style.display = 'none';
                        document.getElementById('testResults').style.display = 'block';
                        document.getElementById('jsonOutput').textContent = JSON.stringify(data, null, 2);

                        // If it's info endpoint, also show video player option
                        if (endpoint === '/info' && data.stream_url) {
                            document.getElementById('videoPlayer').style.display = 'block';
                            const video = document.getElementById('testVideo');
                            const source = document.getElementById('videoSource');
                            source.src = data.stream_url;
                            video.load();
                        }

                        // Scroll to results
                        document.getElementById('testResults').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                } catch (error) {
                    document.getElementById('testLoading').style.display = 'none';
                    showError(error.message || 'Failed to fetch data. Check console for details.');
                    console.error('Test error:', error);
                }
            }

            function showError(message) {
                document.getElementById('testError').style.display = 'block';
                document.getElementById('errorMessage').textContent = message;
                document.getElementById('testError').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }

            function clearResults() {
                document.getElementById('testInput').value = '';
                document.getElementById('testResults').style.display = 'none';
                document.getElementById('testError').style.display = 'none';
                document.getElementById('videoPlayer').style.display = 'none';
                document.getElementById('testLoading').style.display = 'none';
            }

            // Allow Enter key to trigger test
            document.addEventListener('DOMContentLoaded', function() {
                document.getElementById('testInput').addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        testEndpoint('/info');
                    }
                });
            });
        </script>

        <p style="text-align: center; margin-top: 40px; opacity: 0.8;">
            Built with ❤️ using Cloudflare Workers
        </p>
    </div>
</body>
</html>
  `;
  
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html;charset=UTF-8',
      ...CORS_HEADERS,
    },
  });
}

/**
 * Get video information
 */
async function handleVideoInfo(url, pathId = null) {
  let videoId = pathId || url.searchParams.get('id');
  const videoUrl = url.searchParams.get('url');
  
  // Extract ID from URL if provided
  if (videoUrl) {
    videoId = extractVideoId(videoUrl);
  }
  
  if (!videoId) {
    return jsonResponse({ error: 'Missing video ID or URL' }, 400);
  }

  // Try cache first
  const cacheKey = `video_info_${videoId}`;
  const cached = await getCache(cacheKey);
  if (cached) {
    return jsonResponse({ ...cached, cached: true });
  }

  // Fetch video info from Terabox API
  let videoInfo;
  try {
    videoInfo = await fetchTeraboxInfo(videoId);
  } catch (error) {
    return jsonResponse({ 
      error: 'Failed to fetch video info from API',
      message: error.message,
      video_id: videoId,
      hint: 'Check if the video ID is correct and the video is publicly accessible'
    }, 500);
  }
  
  if (!videoInfo || videoInfo.errno !== 0) {
    return jsonResponse({ 
      error: 'Failed to fetch video info',
      details: videoInfo,
      errno: videoInfo?.errno,
      message: videoInfo?.errmsg || 'Unknown error'
    }, 404);
  }

  const fileInfo = videoInfo.list?.[0];
  if (!fileInfo) {
    return jsonResponse({ error: 'No file found' }, 404);
  }

  // Parse video data
  const response = {
    success: true,
    video_id: videoId,
    file_id: fileInfo.fs_id,
    title: fileInfo.server_filename || 'Untitled',
    size: fileInfo.size,
    size_formatted: formatBytes(fileInfo.size),
    thumbnail: fileInfo.thumbs?.url3 || fileInfo.thumbs?.url2 || fileInfo.thumbs?.url1,
    duration: fileInfo.duration,
    category: fileInfo.category,
    created_at: fileInfo.server_ctime,
    modified_at: fileInfo.server_mtime,
    share_id: videoInfo.shareid,
    uk: videoInfo.uk,
    sign: videoInfo.sign,
    timestamp: videoInfo.timestamp,
    download_urls: {
      hd: fileInfo.dlink ? `${url.origin}/download?id=${videoId}&quality=hd` : null,
      sd: fileInfo.dlink ? `${url.origin}/download?id=${videoId}&quality=sd` : null,
      fast: fileInfo.dlink ? `${url.origin}/download?id=${videoId}&quality=fast` : null,
    },
    stream_url: `${url.origin}/stream?id=${videoId}`,
    hls_url: `${url.origin}/stream.m3u8?id=${videoId}`,
    embed_url: `${url.origin}/player.html?id=${videoId}`,
    dlink: fileInfo.dlink,
  };

  // Cache for 1 hour
  await setCache(cacheKey, response, CONFIG.CACHE_TTL);

  return jsonResponse(response);
}

/**
 * Handle video download
 */
async function handleDownload(url) {
  const videoId = url.searchParams.get('id');
  const quality = url.searchParams.get('quality') || 'hd';
  
  if (!videoId) {
    return jsonResponse({ error: 'Missing video ID' }, 400);
  }

  // Get video info
  const videoInfo = await fetchTeraboxInfo(videoId);
  const fileInfo = videoInfo.list?.[0];
  
  if (!fileInfo?.dlink) {
    return jsonResponse({ error: 'Download link not available' }, 404);
  }

  // Get download URL with authentication
  const downloadUrl = await getAuthenticatedDownloadUrl(
    fileInfo.dlink,
    videoInfo.sign,
    videoInfo.timestamp,
    quality
  );

  // Fetch and proxy the video
  const videoResponse = await fetch(downloadUrl, {
    headers: {
      'User-Agent': CONFIG.USER_AGENT,
      'Cookie': `ndus=${CONFIG.COOKIE_NDUS}`,
      'Referer': 'https://www.terabox.tech/',
    },
  });

  if (!videoResponse.ok) {
    return jsonResponse({ 
      error: 'Failed to fetch video',
      status: videoResponse.status 
    }, videoResponse.status);
  }

  // Return video with download headers
  const headers = new Headers(videoResponse.headers);
  headers.set('Content-Disposition', `attachment; filename="${fileInfo.server_filename || 'video.mp4'}"`);
  headers.set('Access-Control-Allow-Origin', '*');
  headers.delete('Content-Security-Policy');
  headers.delete('X-Frame-Options');

  return new Response(videoResponse.body, {
    status: videoResponse.status,
    headers,
  });
}

/**
 * Handle video streaming with range support
 */
async function handleStream(url) {
  const videoId = url.searchParams.get('id');
  const quality = url.searchParams.get('quality') || 'hd';
  
  if (!videoId) {
    return jsonResponse({ error: 'Missing video ID' }, 400);
  }

  // Get video info
  const videoInfo = await fetchTeraboxInfo(videoId);
  const fileInfo = videoInfo.list?.[0];
  
  if (!fileInfo?.dlink) {
    return jsonResponse({ error: 'Stream not available' }, 404);
  }

  // Get download URL
  const downloadUrl = await getAuthenticatedDownloadUrl(
    fileInfo.dlink,
    videoInfo.sign,
    videoInfo.timestamp,
    quality
  );

  // Proxy with range support
  const headers = {
    'User-Agent': CONFIG.USER_AGENT,
    'Cookie': `ndus=${CONFIG.COOKIE_NDUS}`,
    'Referer': 'https://www.terabox.tech/',
  };

  // Forward range header if present
  const range = url.searchParams.get('range') || request.headers.get('Range');
  if (range) {
    headers['Range'] = range;
  }

  const videoResponse = await fetch(downloadUrl, { headers });

  if (!videoResponse.ok) {
    return jsonResponse({ 
      error: 'Failed to stream video',
      status: videoResponse.status 
    }, videoResponse.status);
  }

  // Return with streaming headers
  const responseHeaders = new Headers(videoResponse.headers);
  responseHeaders.set('Access-Control-Allow-Origin', '*');
  responseHeaders.set('Accept-Ranges', 'bytes');
  responseHeaders.delete('Content-Security-Policy');
  responseHeaders.delete('X-Frame-Options');

  return new Response(videoResponse.body, {
    status: videoResponse.status,
    headers: responseHeaders,
  });
}

/**
 * Handle HLS streaming
 */
async function handleHLSStream(url) {
  const videoId = url.searchParams.get('id');
  
  if (!videoId) {
    return jsonResponse({ error: 'Missing video ID' }, 400);
  }

  // Get video info
  const videoInfo = await fetchTeraboxInfo(videoId);
  const fileInfo = videoInfo.list?.[0];
  
  if (!fileInfo) {
    return jsonResponse({ error: 'Video not found' }, 404);
  }

  // Generate HLS playlist
  const streamUrl = `${url.origin}/stream?id=${videoId}`;
  const m3u8Content = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:10
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-PLAYLIST-TYPE:VOD
#EXTINF:${fileInfo.duration || 600},
${streamUrl}
#EXT-X-ENDLIST`;

  return new Response(m3u8Content, {
    headers: {
      'Content-Type': 'application/vnd.apple.mpegurl',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

/**
 * Proxy any URL with authentication
 */
async function handleProxy(url) {
  const targetUrl = url.searchParams.get('url');
  
  if (!targetUrl) {
    return jsonResponse({ error: 'Missing URL parameter' }, 400);
  }

  const response = await fetch(targetUrl, {
    headers: {
      'User-Agent': CONFIG.USER_AGENT,
      'Cookie': `ndus=${CONFIG.COOKIE_NDUS}`,
      'Referer': 'https://www.terabox.tech/',
    },
  });

  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', '*');
  headers.delete('Content-Security-Policy');
  headers.delete('X-Frame-Options');

  return new Response(response.body, {
    status: response.status,
    headers,
  });
}

/**
 * Fetch video info from Terabox API
 */
async function fetchTeraboxInfo(shortUrl) {
  const apiUrl = `https://terabox.hnn.workers.dev/api/get-info?shorturl=${shortUrl}`;
  
  try {
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': CONFIG.USER_AGENT,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`API request failed: ${response.status} - ${text.substring(0, 200)}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error(`Invalid response format (expected JSON, got ${contentType}): ${text.substring(0, 200)}`);
    }

    return await response.json();
  } catch (error) {
    throw new Error(`Failed to fetch Terabox info: ${error.message}`);
  }
}

/**
 * Get authenticated download URL
 */
async function getAuthenticatedDownloadUrl(dlink, sign, timestamp, quality = 'hd') {
  // Parse and modify the download link
  const url = new URL(dlink);
  
  // Add authentication parameters
  url.searchParams.set('sign', sign);
  url.searchParams.set('timestamp', timestamp);
  
  // Quality parameters (optional - Terabox might handle this server-side)
  if (quality === 'sd') {
    url.searchParams.set('quality', 'sd');
  } else if (quality === 'fast') {
    url.searchParams.set('quality', 'low');
  }

  return url.toString();
}

/**
 * Extract video ID from various URL formats
 */
function extractVideoId(url) {
  // Handle different URL formats
  const patterns = [
    /teraboxapp\.com\/s\/([^\/\?]+)/,
    /1024tera\.com\/sharing\/link\?surl=([^&]+)/,
    /terabox\.tech\/s\/([^\/\?]+)/,
    /terabox\.app\/s\/([^\/\?]+)/,
    /\/s\/([^\/\?]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  // If no pattern matches, assume the input is already an ID
  return url.split('/').pop().split('?')[0];
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * JSON response helper
 */
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    },
  });
}

/**
 * Simple cache using Cache API
 */
async function getCache(key) {
  try {
    const cache = caches.default;
    const cacheUrl = new URL(`https://cache.internal/${key}`);
    const response = await cache.match(cacheUrl);
    
    if (response) {
      return await response.json();
    }
  } catch (error) {
    console.error('Cache get error:', error);
  }
  return null;
}

async function setCache(key, data, ttl = 3600) {
  try {
    const cache = caches.default;
    const cacheUrl = new URL(`https://cache.internal/${key}`);
    const response = new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': `public, max-age=${ttl}`,
      },
    });
    await cache.put(cacheUrl, response);
  } catch (error) {
    console.error('Cache set error:', error);
  }
}
