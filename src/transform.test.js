const { printTypeDeclaration, createAttributesInterface, createContextInterface, createBlockInterface } = require('./transform');

describe('transform', () => {
	test('it works', () => {
		expect(1).toBe(1);
	});

	test('prints attribute type declaration', () => {
		const typeDeclaration = createAttributesInterface({
			attributes: {
				stringAttribute: {
					type: 'string',
				},
				numberAttribute: {
					type: 'number',
				},
				booleanAttribute: {
					type: 'boolean',
				},
				arrayAttribute: {
					type: 'array',
				},
				objectAttribute: {
					type: 'object',
				},
				randomAttribute: {
					type: 'random',
				},
				objectAttributeWithDefault: {
					type: 'object',
					default: {
						foo: 'bar',
					},
				},
				integerAttribute: {
					type: 'integer'
				},
				nullAttribute: {
					type: 'null'
				},
				unionTypeAttribute: {
					type: ['string', 'number']
				},
				enumTypeAttribute: {
					type: 'string',
					enum: ['foo', 'bar']
				},
				nullableAttribute: {
					type: ['string', 'null']
				},
				enumTypeAttributeWithoutType: {
					enum: ['foo', 'bar', false, 1000, []]
				},
			},
		}, 'TestAttributes');

		const typeDeclarationString = printTypeDeclaration(typeDeclaration);

		expect(typeDeclarationString).toMatchSnapshot();
	});

	test('handles empty attributes', () => {
		const typeDeclaration = createAttributesInterface({}, 'TestAttributes');

		const typeDeclarationString = printTypeDeclaration(typeDeclaration);

		expect(typeDeclarationString).toMatchSnapshot();
	})

	test('prints block context type declaration', () => {
		const contextPropertyDeclaration = createContextInterface({}, 'TestContext');
		const typeDeclarationString = printTypeDeclaration(contextPropertyDeclaration);
		expect(typeDeclarationString).toMatchSnapshot();
	});

	test( 'prints block type declaration', () => {
		const blockDeclaration = createBlockInterface({}, 'TestBlock', {
			attributesInterfaceName: 'TestBlockAttributes',
			contextInterfaceName: 'TestBlockContext',
		});

		const typeDeclarationString = printTypeDeclaration(blockDeclaration);

		expect(typeDeclarationString).toMatchSnapshot();
	} );
});