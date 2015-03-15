'use strict';
require('coffee-script/register');

var gulp = require("gulp"),
    babel = require("gulp-babel"),
    rename = require('gulp-rename'),
    mocha = require('gulp-mocha'),
    bump = require('gulp-bump');

gulp.task('build', function () {
  return gulp.src(["src/**/*.js", "src/**/*.es6"])
    .pipe(babel({
      blacklist: ['regenerator','es6.constants','es6.blockScoping']
    }))
    .pipe(rename(function (path) {
      path.extname = '.js';
    }))
    .pipe(gulp.dest("lib"));
});

gulp.task("default", ['build','test']);


gulp.task('test', function () {
  return gulp.src('test/*.coffee', {read: false})
        .pipe(mocha({reporter: 'nyan'}));
});

gulp.task('bump', function () {
  return gulp.src('./package.json')
  .pipe(bump())
  .pipe(gulp.dest('./'));
});

gulp.task('bump-minor', function () {
  return gulp.src('./package.json')
  .pipe(bump({type:'minor'}))
  .pipe(gulp.dest('./'));
});

gulp.task('watch', function () {
  gulp.watch('src/**/{*.js,*.es6}',['default']);
});
