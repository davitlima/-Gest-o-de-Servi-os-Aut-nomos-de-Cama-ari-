(() => {
  function summarize(reviews) {
    const ratings = (Array.isArray(reviews) ? reviews : [])
      .map((review) => Number(review?.rating))
      .filter((rating) => Number.isFinite(rating) && rating >= 1 && rating <= 5);
    const count = ratings.length;
    const average = count ? ratings.reduce((sum, rating) => sum + rating, 0) / count : 5;
    return { average, count, stars: Math.round(average) };
  }

  const api = { summarize };
  if (typeof window !== 'undefined') window.NexlarReviews = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
