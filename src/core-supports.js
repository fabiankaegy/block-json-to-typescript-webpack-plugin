const { hasBlockSupport, deepClone } = require('./helper');

const addDefaultCoreAttributes = (blockMetadata) => {
	const attributes = deepClone(blockMetadata.attributes || {});

	if ( ! attributes.style ) {
		attributes.style = {
			type: 'object',
		};
	}

	if ( ! attributes.lock ) {
		attributes.lock = {
			type: 'object',
			default: {
				move: false,
				remove: false,
			},
		};
	}

	if ( ! attributes.className ) {
		attributes.className = {
			type: 'string',
		};
	}

	return attributes;
}

const addAttributesGeneratedFromSupports = (blockMetadata) => {
	const supports = blockMetadata.supports;
	const coreAttributes = addDefaultCoreAttributes(blockMetadata);
	const attributes = deepClone(coreAttributes);

	if (!supports) {
		return attributes;
	}

	const hasAlignSupport = hasBlockSupport(blockMetadata, 'align') || hasBlockSupport(blockMetadata, 'alignWide');
	if (hasAlignSupport && !attributes.align) {
		const alignSupport = supports.align;
		const alignWideSupport = supports.alignWide;

		const alignSupportType = typeof alignSupport;

		let allowedAligns = [];
		if (alignSupportType === 'boolean') {
			allowedAligns = ['left', 'center', 'right', 'wide', 'full'];
		} else if (Array.isArray(alignSupport)) {
			allowedAligns = alignSupport;
		} else if (alignWideSupport) {
			allowedAligns = ['wide', 'full'];
		}

		allowedAligns.push('');

		attributes.align = {
			type: 'string',
			enum: allowedAligns,
		};
	}

	if (hasBlockSupport(blockMetadata, 'anchor') && !attributes.anchor) {
		attributes.anchor = {
			type: 'string',
		};
	}

	if (hasBlockSupport(blockMetadata, 'ariaLabel') && !attributes.ariaLabel) {
		attributes.ariaLabel = {
			type: 'string',
		};
	}

	if (hasBlockSupport(blockMetadata, 'color')) {
		const colorSupport = supports.color;
		const textColorSupport = colorSupport.textColor;
		const backgroundColorSupport = colorSupport.backgroundColor;
		const gradientSupport = colorSupport.gradient;

		if (backgroundColorSupport && !attributes.backgroundColor) {
			attributes.backgroundColor =  {
				type: 'string',
			};
		}
		if ( textColorSupport && !attributes.textColor) {
			attributes.textColor = {
				type: 'string',
			};
		}
		if (gradientSupport && !attributes.gradient) {
			attributes.gradient = {
				type: 'string',
			};
		}
	}

	if ( false === supports.customClassName ) {
		delete attributes.className;
	}

	if (false === supports.lock) {
		delete attributes.lock;
	}

	return attributes;
}

module.exports = {
	addAttributesGeneratedFromSupports,
};
