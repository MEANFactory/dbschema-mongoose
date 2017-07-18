var DELIMETER = '_';
var DIGITS = '0123456789';
var LOWER = 'abcdefghijklmnopqrstuvwxyz';
var UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

module.exports = {
  parse : parse,
  toModel : toModel
};

function parse(value) {
  var words = toWords(value);
  return words.join(DELIMETER).toLowerCase();
}
function toModel(value){
  var words = toWords(value);
  for (var i = 0; i < words.length; i += 1) {
    if (words[i].length > 1) {
      words[i] = words[i].substr(0, 1).toUpperCase() + words[i].substr(1).toLowerCase();
    }
  }
  return words.join('');
}

function isLower(value, strict) {
  if (typeof value !== 'string') { return false; }
  if (typeof strict === 'undefined') { strict = true; }
  if (strict) {
    return (value === value.split('').filter(function(ch){
      return (LOWER.indexOf(ch) >= 0);
    }).join(''));
  } else {
    return (value === value.toLowerCase());
  }
}
function isUpper(value, strict) {
  if (typeof value !== 'string') { return false; }
  if (typeof strict === 'undefined') { strict = true; }
  if (strict) {
    return (value === value.split('').filter(function(ch){
      return (UPPER.indexOf(ch) >= 0);
    }).join(''));
  } else {
    return (value === value.toUpperCase());
  }
}
function isDigit(value) {
  if (typeof value !== 'string') { return false; }
  return (value === value.split('').filter(function(ch){
    return (DIGITS.indexOf(ch) >= 0);
  }).join(''));
}
function isChar(value){
  return (isLower(value) || isUpper(value) || isDigit(value));
}
function isSameCase(source, target) {
  if (!source || !target) { return false; }
  return ((isUpper(source) && isUpper(target)) ||
          (isLower(source) && isLower(target)) ||
          (isDigit(source) && isDigit(target)));
}
function isSameClass(source, target){
  if (!source || !target) { return false; }
  return ((isDigit(source) && isDigit(target)) ||
          ((isLower(source) || isUpper(source)) && (isLower(target) || isUpper(target))));
}

function toWords(value) {
  var words = [];
  var cur;
  var nnext;
  var last;
  var word = '';
  var chars = value.split('');
  for (var i = 0; i < chars.length; i += 1) {

    cur = value.charAt(i);
    next = value.charAt(i + 1);
    nnext = value.charAt(1 + 2);

    // Delimeter or Invalid
    if (!isChar(cur)) {
      if (word) { words.push(word); }
      last  = '';
      word  = '';
      continue;
    }

    if (!isSameClass(last, cur) ||            // Digits vs Letters
        (isLower(last) && isUpper(cur))) {    // Camel Case separation
      if (word) { words.push(word); }
      last = cur;
      word = cur;
      continue;
    }

    if ((isLower(last) && isLower(cur)) ||
        (isDigit(last) && isDigit(cur)) ||
        (isUpper(last) && isUpper(cur) && (!next || isUpper(next)) && (!nnext || isUpper(nnext)))) {
          last = cur;
          word += cur;
          continue;
        }
  }
  if (word){ words.push(word); }

  return words;
}
