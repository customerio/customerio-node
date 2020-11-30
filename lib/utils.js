module.exports = {
  isEmpty: (value) => {
    return !value || (typeof value === 'string' && value.trim() === '');
  },
};
