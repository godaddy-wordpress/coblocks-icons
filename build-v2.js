const fs = require( 'fs' );
const prettier = require( 'prettier' );

const manifestDirectory = "src/manifest/";
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

	const manifests = fs.readdirSync(manifestDirectory)

	manifests.forEach(createJSX);

	createIndex(manifests);
	//createIconsMD(files);
};

/**
 * Create a JSX file out of a SVG file
 *
 * @param {string} file - The name of the file to process
 */
const createJSX = (file) => {
	console.log(`Creating JSX file for : ${file}`);

	fs.readFile(manifestDirectory + file, "utf-8", function (err, content) {
		if (err) {
			console.error(err);
			return;
		}

		const iconData = JSON.parse(content);

		const fileName = file.replace(".json", "");

		renderStyles(iconData.styles, fileName).then(({ svgs, primitivesUsed }) => {
			let newFileContent = `${ warningHeader }

			import { ${ Array.from(primitivesUsed).join(', ') } } from '@wordpress/primitives';

			const icon = {
				styles: { ${ Object.keys( svgs ).map((key) => `
					${ key }: ( ${ svgs[ key ]} )`) }
				},
				meta: {
					label: "${ iconData.label }",
					keywords: [ ${ iconData.keywords.map(( keyword ) => `"${ keyword }"` ) } ]
				}
			};

			const defaultIcon = icon.styles.default;
			const styles = icon.styles;
			const meta = icon.meta;

			export {
				defaultIcon as default,
				styles,
				meta
			}`;

			newFileContent = prettier.format(newFileContent, {
				singleQuote: true,
				useTabs: true,
				tabWidth: 4,
				parser: "babel",
			});

			writeFile(`${ path }library/`, `${ fileName }.js`, newFileContent);
		}).catch(err => {
			console.error(err);
		});
	});
};

async function renderStyles(styles, filename) {
	const svgs = {};
	const primitivesUsed = new Set();

	for (let style of styles) {
		const name = style === 'default' ? `${ filename }.svg` : `${ filename }-${ style }.svg`;
		let content = await fs.promises.readFile(svgDirectory + name, "utf-8");

		content = replacePrimitives(content);
		findPrimitives(content).forEach((primitive) => primitivesUsed.add(primitive));

		content = content.replace(/class\=\"/g, 'className="');

		svgs[style] = content;
	}

	return {
		svgs,
		primitivesUsed
	};
}

/**
 * Create the index file that contains all the icons
 *
 * @param {array} files - An array of all the files
 */
createIndex = ( files ) => {
	console.log( `Creating index file` );

	let content = warningHeader + "\r\n\r\n";

	files.forEach( ( file ) => {
		const filename = file.replace( '.json', '' );

		content =
			content +
			`export {
				default as ${ toPascalCase( filename ) }Icon,
				styles as ${ toPascalCase( filename ) }Styles,
				meta as ${ toPascalCase( filename ) }Meta
			} from './library/${ filename }';\r\n`;
	} );

	content = content + `
		export const IconsList = [
			${ files.map( file => `"${ file.replace( '.json', '' ) }"` ) }
		]`;

	fs.mkdirSync( path, { recursive: true } );
	fs.writeFileSync( `${ path }index.js`, content );
};

/**
 * Create the Icons markdown file
 *
 * @param {array} files - An array of all the files
 */
createIconsMD = (files) => {
	console.log( `Creating icons markdown file` );

	let content = `# CoBlocks Icons

| Icon   | Name   | Component name   |
| ------ | ------ | ---------------- |\r\n`;

	files.forEach( ( file ) => {
		const filename = file.replace( '.svg', '' );

		content =
			content +
			`| <img src="./src/svg/${ file }" width="24" height="24"> | ${ filename } | ${ toPascalCase( filename ) }Icon |\r\n`;
	});

	fs.writeFileSync( `${__dirname}/icons.md`, content );
};

/**
 * Replace primitives in SVG to match React imports
 *
 * @param {string} str - The content
 * @return {string} The new content with items replaced
 */
const replacePrimitives = ( str ) => {
	const primitivesToReplace = {
		"<svg": "<SVG",
		"svg>": "SVG>",
		"<g": "<G",
		"g>": "G>",
		"<path": "<Path",
		"<rect": "<Rect",
		"<circle": "<Circle",
		"<polygon": "<Polygon",
		"<defs": "<Defs",
		"stroke-width": "strokeWidth",
		"fill-rule": "fillRule",
		"clip-rule": "clipRule",
		"stroke-linejoin": "strokeLinejoin",
		"stroke-linecap": "strokeLinecap",
		"tabindex": "tabIndex",
		"datetime": "dateTime",
		"stroke-width": "strokeWidth",
	};
	const regx = new RegExp( Object.keys( primitivesToReplace ).join( "|" ), "gi" );

	return str.replace( regx, ( matched ) => primitivesToReplace[ matched ] );
};

/**
 * Find primitives inside content
 *
 * @param {string} str - The content
 * @return {string} Primitives used ready to used in an import statement
 */
findPrimitives = ( content ) => {
	const primitives = [ 'SVG', 'Path', 'G', 'Rect', 'Circle', 'Polygon', 'Defs' ];

	return primitives
		.filter( ( primitive ) => content.indexOf( `<${primitive}` ) != -1 );
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
