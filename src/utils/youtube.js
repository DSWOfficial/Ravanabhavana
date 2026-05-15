export function extractYouTubeId(url = '') {
  const patterns = [
    /youtu\.be\/([^?&/]+)/,
    /youtube\.com\/watch\?v=([^?&/]+)/,
    /youtube\.com\/embed\/([^?&/]+)/,
    /youtube\.com\/shorts\/([^?&/]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return url.length === 11 ? url : '';
}

export function getYouTubeThumbnail(videoId) {
  return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : '';
}
