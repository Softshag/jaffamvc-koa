'use strict';
require('coffee-script/register');

var gulp = require("gulp"),
    babel = require("gulp-babel"),
    rename = require('gulp-rename'),
    mocha = require('gulp-mocha');

gulp.task("default", function () {
  return gulp.src(["src/**/*.js", "src/**/*.es6"])
    .pipe(babel({
      blacklist: ['regenerator','es6.constants','es6.blockScoping']
    }))
    .pipe(rename(function (path) {
      path.extname = '.js';
    }))
    .pipe(gulp.dest("lib"));
});


gulp.task('test', function () {
  return gulp.src('test/*.coffee', {read: false})
        .pipe(mocha({reporter: 'nyan'}));
})

gulp.task('watch', function () {
  gulp.watch('src/**/{*.js,*.es6}',['default']);
});
