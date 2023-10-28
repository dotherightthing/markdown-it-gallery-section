const assign = require('object-assign');
const p = require('path');
const path = require('path');
const testgen = require('markdown-it-testgen');

// copied from markdown-it-testgen
// and added stripTrailingLineBreakFromFixtureHtml option
function generate(path, options, md) {
  if (!md) {
    md = options;
    options = {};
  }

  options = assign({}, options);
  options.assert = options.assert || require('chai').assert;
  options.stripTrailingLineBreakFromFixtureHtml = options.stripTrailingLineBreakFromFixtureHtml || false;

  testgen.load(path, options, function (data) {
    data.meta = data.meta || {};

    var desc = data.meta.desc || p.relative(path, data.file);

    (data.meta.skip ? describe.skip : describe)(desc, function () {
      data.fixtures.forEach(function (fixture) {
        it(fixture.header && options.header ? fixture.header : 'line ' + (fixture.first.range[0] - 1), function () {

          if (options.stripTrailingLineBreakFromFixtureHtml) {
            options.assert.strictEqual(md.render(fixture.first.text), fixture.second.text.replace(/\n$/g, ''));
          } else {
            options.assert.strictEqual(md.render(fixture.first.text), fixture.second.text);
          }
        });
      });
    });
  });
}

describe('Tests', (assert) => {
  const md = require('markdown-it')()
    .use(require('../'), 'name');

    generate(
      path.join(__dirname, 'fixtures/tests.txt'),
      {
        header: true,
        stripTrailingLineBreakFromFixtureHtml: true
      },
      md
    );
});
