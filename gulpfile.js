var gulp        = require('gulp');
var browserSync = require('browser-sync');
var sass        = require('gulp-sass');
var prefix      = require('gulp-autoprefixer');
var cp          = require('child_process');
var minifyCSS = require('gulp-minify-css');
var bower = require('gulp-bower');
var wiredep = require('wiredep').stream;
var mainBowerFiles = require('main-bower-files');

//TO minify and concat
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var gulpFilter = require('gulp-filter');

var messages = {
    jekyllBuild: '<span style="color: grey">Running:</span> $ jekyll build'
};

var config = {   
    bowerDir: './bower_components'
}

//Build the Jekyll Site
gulp.task('jekyll-build', function (done) {
    browserSync.notify(messages.jekyllBuild);   
    return cp.spawn('jekyll.bat', ['build'], {stdio: 'inherit'})
        .on('close', done);
});

//Rebuild Jekyll & do page reload
gulp.task('jekyll-rebuild', ['jekyll-build'], function () {
    browserSync.reload();
});

//Wait for jekyll-build, then launch the Server 
gulp.task('browser-sync', ['fonts'], function() {
    browserSync({
        server: {
            baseDir: '_site'
        }
    });
});

//Compile files from _scss into both _site/css (for live injecting) and site (for future jekyll builds)
gulp.task('sass', function () {
    return gulp.src('_scss/main.scss')
        .pipe(sass({
            outputStyle: 'compressed',
            includePaths: ['scss', config.bowerDir + '/bootstrap-sass/assets/stylesheets', config.bowerDir + '/font-awesome/scss'],
            onError: browserSync.notify
        }))
        .pipe(prefix(['last 15 versions', '> 1%', 'ie 8', 'ie 7'], { cascade: true }))
        .pipe(minifyCSS())
        .pipe(gulp.dest('_site/css'))
        .pipe(browserSync.reload({ stream: true }))        
        .pipe(gulp.dest('css'));
});

gulp.task('bower', function() {
    return bower()
        .pipe(gulp.dest(config.bowerDir))
});

gulp.task('fonts', ['sass', 'jekyll-build'], function() {
    return gulp.src([config.bowerDir + '/font-awesome/fonts/**.*', config.bowerDir + '/bootstrap-sass/assets/fonts/bootstrap/**.*'])
        .pipe(gulp.dest('_site/fonts'))
        .pipe(gulp.dest('fonts'));
});

gulp.task('build-js', ['fonts'], function() {
    var filterJS = gulpFilter('**/*.js', { restore: true });
    return gulp.src(mainBowerFiles({}))
        .pipe(filterJS)
        .pipe(concat('vendor.js'))
        .pipe(uglify())
        .pipe(gulp.dest('./scripts'))
        .pipe(gulp.dest('./_site/scripts'));
});

gulp.task('minify-customjs', ['build-js'], function() {   
    return gulp.src('./_assets/scripts/*.js')       
        .pipe(uglify())
        .pipe(gulp.dest('./scripts'))
        .pipe(gulp.dest('./_site/scripts'));
});

//Watch scss files for changes & recompile , watch html/md files, run jekyll & reload BrowserSync
gulp.task('watch', function () {
    gulp.watch('_scss/*.scss', ['sass']);
    gulp.watch(['*.html', '_layouts/*.html', '*/*.html', '_includes/*.html', '_posts/*'], ['jekyll-rebuild']);
});

//Default task, running just `gulp` will compile the sass, compile the jekyll site, launch BrowserSync & watch files.
gulp.task('default', ['minify-customjs', 'build-js', 'fonts', 'browser-sync', 'watch']);