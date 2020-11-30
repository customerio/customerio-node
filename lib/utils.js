module.exports = {
  isEmpty: (value) => {
    return value === null || value === undefined || (typeof value === 'string' && value.trim() === '');
  },
};
