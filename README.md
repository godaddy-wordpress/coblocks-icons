# CoBlocks Icons

Repository of icons used inside of CoBlocks, ready to use either as a React Component or plain SVG file.

## Usage

### Standalone

```js
import { SettingsIcon } from 'coblocks-icons';

return (
	<div>{ SettingsIcon }</div>
)
```

### Using WordPress Icon for width/height control

```js
import { Icon } from '@wordpress/icons';
import { SettingsIcon } from 'coblocks-icons';

return (
	<Icon icon={ SettingsIcon } width={ 32 } height={ 32 } />
)
```

## Available icons

See the [complete list](icons.md).
