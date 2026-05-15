export function calculateProgress(completedCount, totalVideos) {
  if (!totalVideos) return 0;
  return Math.round((completedCount / totalVideos) * 100);
}

export function sortVideosByOrder(videos = []) {
  return [...videos].sort((a, b) => {
    if (a.isLatest !== b.isLatest) return a.isLatest ? -1 : 1;
    return (a.order ?? a.videoNumber ?? 999) - (b.order ?? b.videoNumber ?? 999);
  });
}

export function getContinueWatchingVideos(videos = [], progress = []) {
  const completed = new Set(progress.filter((item) => item.completed).map((item) => item.videoDocId));
  return sortVideosByOrder(videos).filter((video) => !completed.has(video.id)).slice(0, 4);
}
