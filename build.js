const fs = require( 'fs' ).promises;
const prettier = require( 'prettier' );

const manifestDirectory = 'src/manifest/';
const svgDirectory = 'src/svg/';
const path = __dirname + '/src/';
const warningHeader = `// --
// -- WARNING!
// -- This is an auto-generated file. Do not edit.
// --`;

/**
 * Scan for all the files inside /svg
 */
const init = async () => {
	console.log( 'Processing files ...' );

	const manifests = await fs.readdir( manifestDirectory );

	manifests.forEach( createJSX );

	createIndex( manifests );
	createIconsMD( manifests );
};

/**
 * Create a JSX file out of a SVG file
 *
 * @param {string} file - The name of the file to process
 */
const createJSX = async ( file ) => {
	console.log( `Creating JSX file for : ${ file }` );

	const content = await fs.readFile( manifestDirectory + file, 'utf-8' );
	const iconData = JSON.parse( content );
	const fileName = file.replace( '.json', '' );

	renderStyles( iconData.styles, fileName ).then( async ( { svgs, primitivesUsed } ) => {
		let newFileContent = `${ warningHeader }

		import { ${ Array.from( primitivesUsed ).join( ', ' ) } } from '@wordpress/primitives';

		const icon = {
			styles: { ${ Object.keys( svgs ).map( ( key ) => `
				${ key }: ( ${ svgs[ key ]} )`) }
			},
			meta: {
				label: "${ iconData.label }",
				keywords: [ ${ iconData.keywords.map( ( keyword ) => `"${ keyword }"` ) } ]
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

		newFileContent = prettier.format( newFileContent, {
			singleQuote: true,
			useTabs: true,
			tabWidth: 4,
			parser: 'babel',
		}) ;

		await writeFile( `${ path }library/`, `${ fileName }.js`, newFileContent );
	});
};

async function renderStyles( styles, filename ) {
	const svgs = {};
	const primitivesUsed = new Set();

	for ( let style of styles ) {
		const name = style === 'default' ? `${ filename }.svg` : `${ filename }-${ style }.svg`;
		let content = await fs.readFile( svgDirectory + name, 'utf-8' );

		content = replacePrimitives( content );
		findPrimitives( content ).forEach( ( primitive ) => primitivesUsed.add( primitive ) );

		content = content.replace( /class\=\"/g, 'className="' );

		svgs[ style ] = content;
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
createIndex = async ( files ) => {
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

	await fs.mkdir( path, { recursive: true } );
	await fs.writeFile( `${ path }index.js`, content );
};

/**
 * Create the Icons markdown file
 *
 * @param {array} files - An array of all the files
 */
createIconsMD = async ( files ) => {
	console.log( `Creating icons markdown file` );

	let content = `# CoBlocks Icons

| Name (slug)   | Icon   | Style   | Component name   | Keywords   |
| ------------- | ------ | ------- | ---------------- | ---------- |\r\n`;

	for( const file of files ) {
		let data = await fs.readFile( manifestDirectory + file, 'utf-8' );
		data = JSON.parse( data );
		const filename = file.replace( '.json', '' );

		data.styles.forEach( ( style ) => {
			content = style === 'default'
				? content +
				`| ${ data.label } ( ${ filename } ) | <img src="./src/svg/${ filename }.svg" width="24" height="24"> | ${ style } | ${ toPascalCase( filename ) }Icon | ${ data.keywords.map( ( keyword ) => ` ${ keyword }` ) } |\r\n`
				: content +
				`| | <img src="./src/svg/${ filename }-${ style }.svg" width="24" height="24"> | ${ style } | ${ toPascalCase( filename ) }Styles.${ style } | |\r\n`
		} );
	};

	await fs.writeFile( `${ __dirname }/icons.md`, content );
};

/**
 * Replace primitives in SVG to match React imports
 *
 * @param {string} str - The content
 * @return {string} The new content with items replaced
 */
const replacePrimitives = ( str ) => {
	const primitivesToReplace = {
		'<svg': '<SVG',
		'svg>': 'SVG>',
		'<g': '<G',
		'g>': 'G>',
		'<path': '<Path',
		'<rect': '<Rect',
		'<circle': '<Circle',
		'<polygon': '<Polygon',
		'<defs': '<Defs',
		'stroke-width': 'strokeWidth',
		'fill-rule': 'fillRule',
		'clip-rule': 'clipRule',
		'stroke-linejoin': 'strokeLinejoin',
		'stroke-linecap': 'strokeLinecap',
		'tabindex': 'tabIndex',
		'datetime': 'dateTime',
		'stroke-width': 'strokeWidth',
	};
	const regx = new RegExp( Object.keys( primitivesToReplace ).join( '|' ), 'gi' );

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
const writeFile = async ( path, filename, content ) => {
	await fs.mkdir( path, { recursive: true } );
	await fs.writeFile( path + filename, content );
};

/**
 * Pascal Case a string
 *
 * @param {string} text - The string to pascal case
 * @return {string} The pascal cased string
 */
const toPascalCase = ( text ) => text.replace( /(^\w|-\w)/g, clearAndUpper );

/**
 * Remove dashes and uppercase next letter
 *
 * @param {string} text - The string to uppercase
 * @return {string} The upper cased string
 */
const clearAndUpper = ( text ) => text.replace( /-/, '' ).toUpperCase();

init();
