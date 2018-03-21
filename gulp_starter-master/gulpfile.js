var gulp = require('gulp');
var browserify = require('browserify');
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
var babel = require('gulp-babel');//转义js
var runSequence = require('run-sequence');
var watch = require('gulp-watch');

//*********转义sass为css**************
gulp.task('sass', function () {
  return gulp.src('app/sass/**/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('app/css'))//先存在开发目录下，用于页面引用和压缩
    .pipe(browserSync.stream());
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

//*********拷贝css文件到目录**************
gulp.task('copyCss',function (cb) {
  pump([
        gulp.src('app/css/**/*.css'),
        gulp.dest('dist/css')
    ],
    cb
  );
});

//*********css压缩**************
gulp.task('minCss', ['copyCss'],function (cb) {
  pump([
        gulp.src(['dist/css/**/*.css','!dist/css/lib/**']),//排除lib库文件进行babel和压缩。防止对库文件压缩变名后产生错误
        cssnano(),
        gulp.dest('dist/css')
    ],
    cb
  );
});

//*********拷贝js文件到目录**************
gulp.task('copyJs',function (cb) {
  pump([
        gulp.src('app/js/**/*.js'),
        gulp.dest('dist/js')
    ],
    cb
  );
});

//*********js压缩**************
gulp.task('minJs',['copyJs'],function (cb) {
  pump([
        gulp.src(['dist/js/**/*.js','!dist/js/lib/**']),//排除lib库文件进行babel和压缩。防止对库文件压缩变名后产生错误
		babel({ presets: ['es2015']}),
        uglify({
			mangle: {reserved: ['require' ,'exports' ,'module' ,'$']},//直接mangle: true表示是否修改变量名（默认true），reserved指排除这些关键字不被修改
			compress: true,//类型：Boolean 默认：true 是否完全压缩
            //preserveComments: 'all' //保留所有注释
			ie8: true//打开ie8兼容模式，不然压缩后有可能在ie8及以下浏览器报错
		}),
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
    .pipe(htmlmin({
        removeComments: true,//清除HTML注释
        //collapseWhitespace: true,//压缩HTML
        //collapseBooleanAttributes: true,//省略布尔属性的值 <input checked="true"/> ==> <input />
        //removeEmptyAttributes: true,//删除所有空格作属性值 <input id="" /> ==> <input />
        //removeScriptTypeAttributes: true,//删除<script>的type="text/javascript"
        //removeStyleLinkTypeAttributes: true,//删除<style>和<link>的type="text/css"
        minifyJS: true,//压缩页面JS
        minifyCSS: true//压缩页面CSS
    }))
    .pipe(gulp.dest('dist'));
});

//*********同步服务并指定服务器地址根目录**************
gulp.task('browserSync',function(){
    browserSync.init({server:'app'});
});

//*********动态监测watch*********用于开发阶段的效果查看*****建议参考：http://www.gulpjs.com.cn/docs/api/
gulp.task('watch', function() {
  gulp.watch('app/sass/**/*.scss',['sass']).on("change",browserSync.reload);//一旦变动就进行编译并自动刷新页面
  gulp.watch('app/css/**/*.css').on("change",browserSync.reload);
  gulp.watch('app/**/*.html').on("change",browserSync.reload);
  gulp.watch('app/js/**/*.js').on("change",browserSync.reload);
});

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
  runSequence(
	'sass', 
	'browserSync',
	'watch',
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
