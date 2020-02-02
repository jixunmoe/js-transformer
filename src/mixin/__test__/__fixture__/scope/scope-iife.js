a = 1;
b = 2;

(function () {
  var b = 3;
  v1 = a;
  v2 = b;
});

z = b;

(function () {
  var b = 3;
  a = 9;
})();

c = a;
d = b;
