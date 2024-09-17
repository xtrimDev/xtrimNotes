const isEmail = (str) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);

module.exports = isEmail;