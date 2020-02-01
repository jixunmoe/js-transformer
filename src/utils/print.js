const dumpBlock = require('./dumpBlock');

function print(...args) {
  console.info(...args.map(dumpBlock));
}

module.exports = print;
