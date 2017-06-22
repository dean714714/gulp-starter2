var gulp = require('gulp');
var	gutil = require('gulp-util');
var	concat = require('gulp-concat');//合并文件
var	pump = require('pump');//用pump代替pipe

var sass = require('gulp-sass');//转义sass为css
var autoprefixer = require('gulp-autoprefixer');//给 CSS 增加前缀
var sourcemaps = require('gulp-sourcemaps');
var browserSync = require('browser-sync').create();//同步更新
var useref = require('gulp-useref');//合并文件
var gulpIf = require('gulp-if');
var	uglify = require('gulp-uglify');//压缩js
var cssnano = require('gulp-cssnano');//压缩css
var imagemin = require('gulp-imagemin');//压缩图片
var htmlmin = require('gulp-htmlmin');//压缩html
var cache = require('gulp-cache');
var del = require('del');//清除文件
var runSequence = require('run-sequence');

//*********转义sass为css**************
gulp.task('sass', function () {
  return gulp.src('app/sass/**/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('app/css'))//先存在开发目录下，用于页面引用和压缩
    .pipe(browserSync.reload({stream:true}));
});

//*********为css添加前缀**************
gulp.task('autoprefixer',function(){
	return gulp.src('app/css/*.css')
        .pipe(autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
        .pipe(gulp.dest('dist'))
});

//*********css压缩**************
gulp.task('minCss', function (cb) {
  pump([
        gulp.src('app/css/**/*.css'),
        cssnano(),
        gulp.dest('dist/css')
    ],
    cb
  );
});
//*********js压缩**************
gulp.task('minJs', function (cb) {
  pump([
        gulp.src('app/js/**/*.js'),
        uglify(),
        gulp.dest('dist/js')
    ],
    cb
  );
});

//*********图片压缩**************
gulp.task('minImg', function() {
  return gulp.src('app/img/**/*.+(png|jpg|jpeg|gif|svg)')
    .pipe(cache(imagemin({
      interlaced: true,
    })))
    .pipe(gulp.dest('dist/img'))
});

//*********html压缩**************
gulp.task('minHtml', function() {
  return gulp.src('app/**/*.html')
    .pipe(htmlmin({collapseWhitespace: true}))
    .pipe(gulp.dest('dist'));
});

//*********同步服务并指定服务器地址根目录**************
gulp.task('browserSync',function(){
	 browserSync.init({server:'app'});
})

//*********动态监测watch*********用于开发阶段的效果查看*****
gulp.task('watch', function() {
  gulp.watch('app/sass/**/*.scss', ['sass']);
  gulp.watch('app/**/*.html', on('change',browserSync.reload({stream:true})));
  gulp.watch('app/js/**/*.js', on('change',browserSync.reload({stream:true})));
})

//*********根据html中的引用，如link和script，合并为一个文件但不压缩（以下采用了js和css的压缩插件）**************
gulp.task('useref', function() {
  return gulp.src('app/*.html')
    .pipe(useref())
    .pipe(gulpIf('*.js', uglify()))
    .pipe(gulpIf('*.css', cssnano()))
    .pipe(gulp.dest('dist'));
});

//*********拷贝字体**************
gulp.task('fonts', function() {
  return gulp.src('app/fonts/**/*')
    .pipe(gulp.dest('dist/fonts'))
})


// 清空dist目录
gulp.task('clean', function() {
  return del.sync('dist').then(function(cb) {
    return cache.clearAll(cb);
  });
})
gulp.task('clean:dist', function() {
  return del.sync(['dist/**/*', '!dist/img', '!dist/img/**/*']);
});

//*********执行gulp任务_开发阶段**************
gulp.task('default', function(callback) {
  runSequence(['sass'], 'browserSync','watch',
    callback
  )
})
//*********执行gulp任务_正式文件**************
gulp.task('build', function(callback) {
  runSequence(
    'clean:dist',
    'sass',
    'autoprefixer',
    ['minCss','minJs','minImg', 'fonts'],
    'minHtml',
    callback
  )
})
