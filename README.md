# CoBlocks Icons

Repository of icons used inside of CoBlocks, ready to use either as a React Component or plain SVG file.

See the [complete list](icons.md).

## Install 

```bash
npm install @godaddy-wordpress/coblocks-icons
```

## Usage

### Standalone

```js
import { SettingsIcon } from '@godaddy-wordpress/coblocks-icons

return (
	<div>{ SettingsIcon }</div>
)
```

### Using WordPress Icon for width/height control

```js
import { Icon } from '@wordpress/icons';
import { SettingsIcon } from '@godaddy-wordpress/coblocks-icons';

return (
	<Icon icon={ SettingsIcon } size={ 32 } />
)
```

## How to deploy

```bash
npm version minor
git push
git push --tags
npm publish
```
