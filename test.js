
var run = require('tape-run');
var browserify = require('browserify');

browserify(__dirname + '/test/index.js')
  .bundle()
  .pipe(run({run: 5000}))
  .on('results', console.log)
  .pipe(process.stdout);