import {series, parallel, watch, src, dest} from 'gulp';
import gulpConnect from 'gulp-connect';
import gulpTemplate from 'gulp-template';
import postcss from 'gulp-postcss';
import postcssNesting from 'postcss-nesting';
import postcssNested from 'postcss-nested';
import postcssCurrentSelector from 'postcss-current-selector';
import postcssNestedAncestors from 'postcss-nested-ancestors';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import imagemin, {gifsicle, mozjpeg, optipng}  from 'gulp-imagemin';
import gulpif from 'gulp-if';
import concat from 'gulp-concat';
import plumber from 'gulp-plumber';
import del from 'delete';
import svgSprite from 'gulp-svg-sprite';

const outputDir = 'dist';

const isProduction = process.env.NODE_ENV === 'production';

const srcTmpl = 'src/**/*.html';
const srcCSS = 'src/**/*.css';
const srcSVG = 'src/assets/svg/*.svg';
const srcImages = ['src/assets/images/*.{jpg,jpeg,png,svg,gif,ico,webp}'];

export function server() {
  return gulpConnect.server({
    host: '0.0.0.0',
    port: 3000,
    root: 'dist/',
    livereload: true
  });
}

export function clean(cb) {
  del([outputDir], cb);
}

function tmpl() {
  return src(srcTmpl)
    // .pipe(data(() => {
    //   return {
    //     __dirname: __dirname,
    //     require: require
    //   };
    // }))
    .pipe(gulpTemplate())
    .pipe(dest(outputDir))
    .pipe(gulpif(!isProduction, gulpConnect.reload()));
}

function css() {
  return src(srcCSS)
    .pipe(plumber())
    .pipe(postcss([
      postcssNestedAncestors(),
      postcssNested(),
      postcssCurrentSelector(),
      postcssNesting(),
      autoprefixer(),
      cssnano()
    ]))
    .pipe(concat('style.min.css'))
    .pipe(dest(outputDir))
    .pipe(gulpif(!isProduction, gulpConnect.reload()));
}

function svg() {
  return src(srcSVG, { cwd: '' })
    .pipe(plumber())
    .pipe(svgSprite({
      shape: {
        dest: '.'
      }
    }))
    .on('error', function(error) {
      console.log(error)
    })
    .pipe(dest(outputDir));
}

function images() {
  return src(srcImages)
    .pipe(gulpif(isProduction, imagemin(
      [
      gifsicle({interlaced: true}),
      mozjpeg({quality: 75, progressive: true}),
      optipng({optimizationLevel: 5})
    ]
    )))
    .pipe(dest(outputDir))
    .pipe(gulpif(!isProduction, gulpConnect.reload()));
}

function watchAll() {
  watch(srcTmpl, series(tmpl));
  watch(srcCSS, series(css));
  watch(srcSVG, series(svg));
  watch(srcImages, series(images));
}

export default () => parallel(
  watchAll,
  series(clean, tmpl, css, svg, images, server)
);
export const build = series(clean, tmpl, css, svg, images);
export const dev = parallel(
  watchAll,
  series(clean, tmpl, css, svg, images, server)
);