import gulp from 'gulp';
import sourcemaps from 'gulp-sourcemaps';
import gutil from 'gulp-util';
import minify from 'gulp-babel-minify';
import filter from 'gulp-filter';
import buffer from 'vinyl-buffer';
import source from 'vinyl-source-stream';
import browserify from 'browserify';
import babelify from 'babelify';


gulp.task('build_js_min', () => {
    const opts = {
        debug: true,
        // standalone: 'WebMIDIAPIShim',
    };
    const b = browserify(opts);
    b.add('./src/index.js');
    b.transform(babelify.configure({
        compact: true,
    }));

    return b.bundle()
        .on('error', e => gutil.log(gutil.colors.red(e.message)))
        .pipe(source('WebMIDIAPI.min.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init({
            loadMaps: false,
        }))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('./browser'))
        .pipe(filter('**/*.js'))
        .pipe(minify({
            mangle: {
                keepClassName: true,
            },
        }))
        .pipe(gulp.dest('./browser'));
});

gulp.task('build_js', () => {
    const opts = {
        debug: true,
        // standalone: 'vmv',
    };
    const b = browserify(opts);
    b.add('./src/index.js');
    b.transform(babelify.configure({
        compact: true,
    }));

    return b.bundle()
        .on('error', e => gutil.log(gutil.colors.red(e.message)))
        .pipe(source('WebMIDIAPI.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init({
            loadMaps: false,
        }))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('./browser'))
        .pipe(filter('**/*.js'))
        .pipe(gulp.dest('./browser'));
});


gulp.task('build', gulp.series(
    'build_js',
    'build_js_min',
));
