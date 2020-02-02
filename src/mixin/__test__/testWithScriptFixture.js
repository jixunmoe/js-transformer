const fs = require('fs');

function testWithScriptFixture(t, name, cases, test) {
  t.plan(cases.length);

  const loadFile = f =>
    fs.readFileSync(`${__dirname}/__fixture__/${name}/${f}.js`, 'utf-8')
      .replace(/\r/g, '')
      .trim();
  const loadFixtures = f => [loadFile(f), loadFile(f + '.expect')];

  for (const {name, file} of cases) {
    const [input, expected] = loadFixtures(file);
    const code = test(input);

    t.equals(
      code.replace(/\r/g, '').trim(),
      expected,
      name
    );
  }
}

module.exports = testWithScriptFixture;
