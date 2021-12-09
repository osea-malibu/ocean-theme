const gulp = require("gulp");
const sass = require("gulp-sass")(require("sass"));
const autoprefixer = require("gulp-autoprefixer");

gulp.task("sass", () => {
  return gulp
    .src("styles/*.scss")
    .pipe(sass())
    .pipe(autoprefixer("last 4 version"))
    .pipe(gulp.dest("assets"));
});

gulp.task("watch", () => {
  gulp.watch("styles/**/*.scss", gulp.series("sass"));
});
