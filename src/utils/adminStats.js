export function calculateTotalVideos(videos = []) {
  return videos.length;
}

export function calculateActiveVideos(videos = []) {
  return videos.filter((video) => video.is_active).length;
}

export function calculateUserProgressStats(progress = []) {
  return {
    watched: progress.filter((item) => item.watched).length,
    completed: progress.filter((item) => item.completed).length,
    saved: progress.filter((item) => item.saved).length,
  };
}

export function calculateActiveBanners(banners = []) {
  const now = new Date();
  return banners.filter((banner) => {
    const start = banner.start_date ? new Date(banner.start_date) : new Date(0);
    const end = banner.end_date ? new Date(banner.end_date) : new Date(8640000000000000);
    return banner.is_active && start <= now && now <= end;
  }).length;
}
