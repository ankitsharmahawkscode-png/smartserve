exports.paging = (q, defaultLimit = 10) => {
  const page = Math.max(1, parseInt(q.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(q.limit, 10) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
};
exports.pageOf = (items, total, { page, limit }) => ({ items, total, page, limit, pages: Math.ceil(total / limit) });