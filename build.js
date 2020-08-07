const fs = require("fs");
const prettier = require("prettier");

const svgDirectory = "src/svg/";
const path = __dirname + "/src/";
const contentToReplace = {
	"<svg": "<SVG",
	"svg>": "SVG>",
	"<g": "<G",
	"<path": "<Path",
	"<rect": "<Rect",
};
const warningHeader = `// --
// -- WARNING! 
// -- This is an auto-generated file. Do not edit.
// --`;

/**
 * Scan for all the files inside /svg
 */
const init = () => {
	console.log("Processing files ...");

	const files = fs.readdirSync(svgDirectory);

	files.forEach(createJSX);
	createIndex(files);
};

/**
 * Create a JSX file out of a SVG file
 *
 * @param {string} file - The name of the file to process
 */
const createJSX = (file) => {
	console.log(`Creating JSX file for : ${file}`);

	fs.readFile(svgDirectory + file, "utf-8", function (err, content) {
		if (err) {
			onError(err);
			return;
		}

		const fileName = file.replace(".svg", "");
		const componentName = toCamelCase(fileName);

		content = replaceAll(content, contentToReplace);
		content = `${warningHeader}
	
		import { SVG, Path, G, Rect } from '@wordpress/primitives';

		const ${componentName} = (
			${content}
		);

		export default ${componentName};`;

		content = prettier.format(content, {
			useTabs: true,
			tabWidth: 4,
			parser: "babel",
		});

		writeFile(`${ path }jsx/`, `${ fileName }.js`, content);
	});
};

/**
 * Create the index file that contains all the icons
 *
 * @param {array} files - An array of all the files
 */
createIndex = (files) => {
	console.log(`Creating index file`);

	let content = warningHeader + "\r\n\r\n";

	files.forEach((file) => {
		const filename = file.replace(".svg", "");

		content =
			content +
			`export { default as ${toPascalCase(filename)}Icon } from './jsx/${filename}';\r\n`;
	});

	fs.mkdirSync(path, { recursive: true });
	fs.writeFileSync(`${path}index.js`, content);
};

/**
 * Replace all occurences of 
 *
 * @param {string} str - The content
 * @param {object} mapObj - The list of items to replace
 * @return {string} The new content with items replaced
 */
const replaceAll = (str, mapObj) => {
	const regx = new RegExp(Object.keys(mapObj).join("|"), "gi");

	return str.replace(regx, (matched) => mapObj[matched]);
};

/**
 * Write the file and write the required directories if needed
 *
 * @param {string} path - The path where the new file should live
 * @param {string} filename - The name of the new file
 * @param {string} content - The content of the file
 */
const writeFile = (path, filename, content) => {
	fs.mkdirSync(path, { recursive: true });
	fs.writeFileSync(path + filename, content);
};

/**
 * Camel Case a string
 *
 * @param {string} text - The string to camel case
 * @return {string} The camel cased string
 */
const toCamelCase = (text) => text.replace(/-\w/g, clearAndUpper);

/**
 * Pascal Case a string
 *
 * @param {string} text - The string to pascal case
 * @return {string} The pascal cased string
 */
const toPascalCase = (text) => text.replace(/(^\w|-\w)/g, clearAndUpper);

/**
 * Remove dashes and uppercase next letter
 *
 * @param {string} text - The string to uppercase
 * @return {string} The upper cased string
 */
const clearAndUpper = (text) => text.replace(/-/, "").toUpperCase();

init();
