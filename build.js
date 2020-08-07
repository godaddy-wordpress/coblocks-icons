const fs = require("fs");
const prettier = require("prettier");

const svgDirectory = "src/svg/";
const path = __dirname + "/src/";
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
	createIconsMD(files);
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

		content = replacePrimitives(content);

		const primitivesUsed = findPrimitives(content);
		
		content = `${warningHeader}
	
		import { ${primitivesUsed} } from '@wordpress/primitives';

		const ${componentName} = (
			${content}
		);

		export default ${componentName};`;

		content = prettier.format(content, {
			singleQuote: true,
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
 * Create the Icons markdown file
 *
 * @param {array} files - An array of all the files
 */
createIconsMD = (files) => {
	console.log(`Creating icons markdown file`);

	let content = `# CoBlocks Icons
	
| Icon   | Name   | Component name   |
| ------ | ------ | ---------------- |\r\n`;

	files.forEach((file) => {
		const filename = file.replace(".svg", "");

		content =
			content +
			`| <img src="./src/svg/${file}" width=32> | ${filename} | ${toPascalCase(filename)}Icon |\r\n`;
	});

	fs.writeFileSync(`${__dirname}/icons.md`, content);
};

/**
 * Replace primitives in SVG to match React imports
 *
 * @param {string} str - The content
 * @return {string} The new content with items replaced
 */
const replacePrimitives = (str) => {
	const primitivesToReplace = {
		"<svg": "<SVG",
		"svg>": "SVG>",
		"<g": "<G",
		"g>": "G>",
		"<path": "<Path",
		"<rect": "<Rect",
		"<circle": "<Circle",
		"<polygon": "<Polygon",
		"<defs": "<Defs"
	};
	const regx = new RegExp(Object.keys(primitivesToReplace).join("|"), "gi");

	return str.replace(regx, (matched) => primitivesToReplace[matched]);
};

/**
 * Find primitives inside content 
 *
 * @param {string} str - The content
 * @return {string} Primitives used ready to used in an import statement
 */
findPrimitives = (content) => {
	const primitives = ['SVG', 'Path', 'G', 'Rect', 'Circle', 'Polygon', 'Defs'];

	return primitives
		.filter((primitive) => content.indexOf(`<${primitive}`) != -1)
		.join(', ');
}

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
