// Imports
const { src, dest, series, parallel, watch } = require('gulp');
const tailwindcss = require('tailwindcss');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const sass = require('gulp-sass')(require('sass'));
const plumber = require('gulp-plumber');
// const autoprefixer = require('gulp-autoprefixer');
const jsUglify = require('gulp-uglify');
const htmlMinify = require('gulp-minify-html');
//const babel = require( 'gulp-babel' );
const gulpif = require('gulp-if');
const data = require('gulp-data');
const concat = require('gulp-concat');
const gulpIf = require('gulp-if');
const nunjucks = require('gulp-nunjucks-render');
// const del = require('del');
const fs = require('fs');
const browserSync = require('browser-sync').create();

var outputDir = "";
var sassState = "";

var env = process.env.NODE_ENV === "production" || "development";

if (env == "development") {
	outputDir = "./public";
	sassState = "expanded";
} else if (env == "production") {
	outputDir = "./production";
	sassState = "compressed";
}
// Paths
//const scssPages = [ "scss/index.scss", "scss/pageOne.scss", "scss/pageTwo.scss" ];
//const htmlPages = [ "./pages/index.html", "./pages/common/pageOne.html", "./pages/common/pageTwo.html" ];
//const templates = "./templates/*.njk";
//const scripts = "./js/**/*.js";

const scssPages = ["./scss/main.scss"];
const templates = ["./templates/*.njk"];
const scripts = "./scripts/**/*.js";


// Remove  files
// async function remove() {
// 	await del(["./production", "./public"]);
// }

// Nunjucks and HTML 
function Nunjucks(cb) {
	src(templates)
		.pipe(plumber())
		.pipe(data(function () {
			//return require('./data/user.json')
			return JSON.parse(fs.readFileSync('./data/pages.json'))
		}))
		.pipe(nunjucks({
			ext: '.html',
			path: './templates/'
		}))
		.pipe(gulpif(env === "production", htmlMinify()))
		.pipe(dest(`${outputDir}`))

	cb()
}

// Sass
function styles(cb) {
	var plugins = [
		tailwindcss('./tailwind.config.js'),
		autoprefixer()
	];
	src(scssPages)
		.pipe(sass({ outputStyle: sassState }).on('error', sass.logError))
		.pipe(postcss(plugins))
		// .pipe(autoprefixer())
		.pipe(dest(`${outputDir}/styles`))
		.pipe(browserSync.stream())

	cb()
}

// Javascript
function js(cb) {
	src(scripts)
		//.pipe( babel( { presets: [ '@babel/preset-env' ] } ) )
		// .pipe(concat('main.js'))
		.pipe(gulpif(env === "production", jsUglify()))
		.pipe(dest(`${outputDir}/scripts`))

	cb()
}

function assets(cb) {
	src('./assets/**/*.*')
		.pipe(dest(`${outputDir}/assets`))

	src('./manifest.json')
		.pipe(dest(`${outputDir}`))

	cb()
}

// Liver Server
function server(cb) {
	browserSync.init({
		notify: false,
		open: false,
		server: {
			baseDir: `${outputDir}`,
			//directory: true,
			serveStaticOptions: {
				extensions: ["html"]
			},
		}
	})

	cb();
}

function reload(cb) {
	browserSync.reload()

	cb()
}

function watcher(cb) {
	watch('./scss/**/**/*.scss', styles)
	watch('./assets/*').on('change', reload)
	watch(scripts).on('change', parallel(js, reload))
	watch(['./templates/**/*.+(njk)', './data/*.json']).on('change', series(Nunjucks, reload))

	cb();
}

exports.default = series(parallel(Nunjucks, styles, js, assets), server, watcher)
