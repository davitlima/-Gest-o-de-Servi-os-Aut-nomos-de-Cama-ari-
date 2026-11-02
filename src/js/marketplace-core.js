(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.NexlarMarketplace = api;
})(typeof globalThis !== 'undefined' ? globalThis : window, function () {
  const normalize = value => {
    const key = String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
    return ({ phoc1: 'phoci', phoc2: 'phocii', phoc3: 'phociii' })[key] || key;
  };

  function matches(profile, filters) {
    const query = normalize(filters.search);
    const service = normalize(filters.service);
    const neighborhood = normalize(filters.neighborhood);
    const text = [profile.name, profile.service, profile.neighborhood, profile.bio].map(normalize).join(' ');
    return (!query || text.includes(query))
      && (!service || normalize(profile.service) === service)
      && (!neighborhood || normalize(profile.neighborhood) === neighborhood);
  }

  return { normalize, matches };
});
