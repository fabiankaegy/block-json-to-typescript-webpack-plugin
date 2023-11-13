const ts = require('typescript');

const anyTypeReference = ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
const undefinedTypeReference = ts.factory.createKeywordTypeNode(ts.SyntaxKind.UndefinedKeyword);
const voidTypeReference = ts.factory.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword);
const stringTypeReference = ts.factory.createTypeReferenceNode("string");
const numberTypeReference = ts.factory.createTypeReferenceNode("number");
const booleanTypeReference = ts.factory.createTypeReferenceNode("boolean");
const nullTypeReference = ts.factory.createTypeReferenceNode("null");
const arrayTypeReference = ts.factory.createTypeReferenceNode("Array", [anyTypeReference]);
const objectTypeReference = ts.factory.createTypeReferenceNode("Record", [stringTypeReference, anyTypeReference]);
const readonlyModifier = ts.factory.createModifier(ts.SyntaxKind.ReadonlyKeyword);

const getTypeReference = (type) => {
	switch (type) {
		case "string":
			return stringTypeReference;
		case "number":
		case "integer":
			return numberTypeReference;
		case "boolean":
			return booleanTypeReference;
		case "array":
			return arrayTypeReference;
		case "object":
			return objectTypeReference;
		case "null":
			return nullTypeReference;
		default:
			return anyTypeReference;
	}
}

const hasBlockSupport = (block, feature) => {
	if (!block.supports) {
		return false;
	}
	return !! block.supports[feature];
}

const getTypeReferenceOfAttribute = (attribute) => {
	const { type, default: defaultValue, enum: typeEnum } = attribute;

	if (typeEnum) {
		return ts.factory.createUnionTypeNode(
			typeEnum.map((enumValue) => {
				const enumValueType = typeof enumValue;

				if (enumValueType === 'string') {
					return ts.factory.createLiteralTypeNode(ts.factory.createStringLiteral(enumValue));
				}

				if (enumValueType === 'number') {
					return ts.factory.createLiteralTypeNode(ts.factory.createNumericLiteral(enumValue));
				}

				if (enumValueType === 'boolean') {
					return ts.factory.createLiteralTypeNode(enumValue ? ts.factory.createTrue() : ts.factory.createFalse());
				}

				return getTypeReference(enumValueType);
			})
		);
	}

	if (Array.isArray(type)) {
		return ts.factory.createUnionTypeNode(
			type.map((type) => {
				return getTypeReference(type);
			})
		);
	}

	return getTypeReference(type);
};


const createAttributesInterface = ( blockMetadata, InterfaceName ) => {
	const attributes = blockMetadata.attributes;

	const attributesProperties = Object.keys(attributes).map((attributeName) => {
		const attribute = attributes[attributeName];
		const { type, default: defaultValue, enum: typeEnum } = attribute;
		const hasDefaultValue = defaultValue !== undefined;

		const typeReference = getTypeReferenceOfAttribute(attribute);

		return ts.factory.createPropertySignature(
			[readonlyModifier],
			ts.factory.createIdentifier(attributeName),
			hasDefaultValue ? undefined : ts.factory.createToken(ts.SyntaxKind.QuestionToken),
			typeReference,
		);
	});

	const styleAttribute = ts.factory.createPropertySignature(
		[readonlyModifier],
		ts.factory.createIdentifier("style"),
		ts.factory.createToken(ts.SyntaxKind.QuestionToken),
		objectTypeReference,
	);

	attributesProperties.push(styleAttribute);

	if (hasBlockSupport(blockMetadata, 'align')) {
		const alignAttribute = ts.factory.createPropertySignature(
			[readonlyModifier],
			ts.factory.createIdentifier("align"),
			ts.factory.createToken(ts.SyntaxKind.QuestionToken),
			stringTypeReference,
		);

		attributesProperties.push(alignAttribute);
	}

	const blockAttributesDeclaration = ts.factory.createInterfaceDeclaration(
		undefined,
		ts.factory.createIdentifier(InterfaceName),
		undefined,
		undefined,
		attributesProperties
	);

	return blockAttributesDeclaration;
};

const createContextInterface = ( blockMetadata, InterfaceName ) => {
	const usesContext = blockMetadata.usesContext;

	const contextProperties = [];

	if ( usesContext && usesContext.length ) {
		usesContext.forEach((contextKey) => {

			let contextTypeReference = anyTypeReference;
			let isOptional = false;

			if ( contextKey === 'postType' ) {
				contextTypeReference = stringTypeReference;
			}

			if ( contextKey === 'postId' ) {
				contextTypeReference = numberTypeReference;
			}

			if ( contextKey === 'queryId' ) {
				contextTypeReference = numberTypeReference;
				isOptional = true;
			}

			if ( contextKey === 'query' ) {
				contextTypeReference = objectTypeReference;
				isOptional = true;
			}
			
			contextProperties.push(
				ts.factory.createPropertySignature(
					[readonlyModifier],
					ts.factory.createIdentifier(contextKey),
					isOptional ? ts.factory.createToken(ts.SyntaxKind.QuestionToken): undefined, 
					contextTypeReference,
				)
			);
		});
	}

	const contextInterfaceDeclaration = ts.factory.createInterfaceDeclaration(
		undefined,
		ts.factory.createIdentifier(InterfaceName),
		undefined,
		undefined,
		contextProperties
	);

	return contextInterfaceDeclaration;
};

const createInterfaceReference = ( interfaceName ) => {
	return ts.factory.createTypeReferenceNode(interfaceName);
}

const createPartialInterfaceReference = ( interfaceName ) => {
	return ts.factory.createTypeReferenceNode("Partial", [ts.factory.createTypeReferenceNode(interfaceName)]);
}

const createBlockInterface = ( blockMetadata, InterfaceName, options ) => {
	const { attributesInterfaceName, contextInterfaceName } = options;

	const clientIdPropertyDeclaration = ts.factory.createPropertySignature(
		[readonlyModifier],
		ts.factory.createIdentifier("clientId"),
		undefined,
		stringTypeReference,
	);

	const isSelectedPropertyDeclaration = ts.factory.createPropertySignature(
		[readonlyModifier],
		ts.factory.createIdentifier("isSelected"),
		undefined,
		booleanTypeReference,
	);

	const isSelectionEnabledPropertyDeclaration = ts.factory.createPropertySignature(
		[readonlyModifier],
		ts.factory.createIdentifier("isSelectionEnabled"),
		undefined,
		booleanTypeReference,
	);

	const namePropertyDeclaration = ts.factory.createPropertySignature(
		[readonlyModifier],
		ts.factory.createIdentifier("name"),
		undefined,
		stringTypeReference,
	);

	const setAttributesMethodDeclaration = ts.factory.createMethodSignature(
		undefined, // modifiers
		ts.factory.createIdentifier("setAttributes"), // name
		undefined, // questionToken
		undefined, // typeParameters
		[ // parameters
			ts.factory.createParameterDeclaration(
				undefined, // decorators
				undefined, // dotDotDotToken
				undefined, // name
				ts.factory.createIdentifier("attributes"),
				attributesInterfaceName ? createPartialInterfaceReference(attributesInterfaceName) : anyTypeReference,
				undefined, // initializer
			),
		],
		voidTypeReference,
	);

	const insertBlocksAfterMethodDeclaration = ts.factory.createMethodSignature(
		undefined, // modifiers
		ts.factory.createIdentifier("insertBlocksAfter"), // name
		undefined, // questionToken
		undefined, // typeParameters
		[ // parameters
			ts.factory.createParameterDeclaration(
				undefined, // decorators
				undefined, // dotDotDotToken
				undefined, // name
				ts.factory.createIdentifier("block"),
				anyTypeReference,
				undefined, // initializer
			),
		],
		voidTypeReference,
	);

	const mergeBlocksMethodDeclaration = ts.factory.createMethodSignature(
		undefined, // modifiers
		ts.factory.createIdentifier("mergeBlocks"), // name
		undefined, // questionToken
		undefined, // typeParameters
		[ // parameters
			ts.factory.createParameterDeclaration(
				undefined, // decorators
				undefined, // dotDotDotToken
				undefined, // name
				ts.factory.createIdentifier("blocks"),
				arrayTypeReference,
				undefined, // initializer
			),
		],
		voidTypeReference,
	);

	const onRemoveMethodDeclaration = ts.factory.createMethodSignature(
		undefined, // modifiers
		ts.factory.createIdentifier("onRemove"), // name
		undefined, // questionToken
		undefined, // typeParameters
		[ // parameters
			ts.factory.createParameterDeclaration(
				undefined, // decorators
				undefined, // dotDotDotToken
				undefined, // name
				ts.factory.createIdentifier("callback"),
				anyTypeReference,
				undefined, // initializer
			),
		],
		voidTypeReference,
	);

	const onReplaceMethodDeclaration = ts.factory.createMethodSignature(
		undefined, // modifiers
		ts.factory.createIdentifier("onReplace"), // name
		undefined, // questionToken
		undefined, // typeParameters
		[ // parameters
			ts.factory.createParameterDeclaration(
				undefined, // decorators
				undefined, // dotDotDotToken
				undefined, // name
				ts.factory.createIdentifier("callback"),
				anyTypeReference,
				undefined, // initializer
			),
		],
		voidTypeReference,
	);

	const toggleSelectionMethodDeclaration = ts.factory.createMethodSignature(
		undefined, // modifiers
		ts.factory.createIdentifier("toggleSelection"), // name
		undefined, // questionToken
		undefined, // typeParameters
		[], // parameters
		voidTypeReference,
	);

	const attributesPropertyDeclaration = ts.factory.createPropertySignature(
		[readonlyModifier],
		ts.factory.createIdentifier("attributes"),
		undefined,
		createInterfaceReference(attributesInterfaceName),
	);

	const hasContexts = blockMetadata.usesContext && blockMetadata.usesContext.length;

	const contextPropertyDeclaration = ts.factory.createPropertySignature(
		[readonlyModifier],
		ts.factory.createIdentifier("context"),
		undefined,
		createInterfaceReference(hasContexts ? contextInterfaceName : undefinedTypeReference),
	);

	const additionalFreeformProperties = ts.factory.createIndexSignature(
		undefined, // modifiers
		[ // parameters
			ts.factory.createParameterDeclaration(
				undefined,
				undefined,
				undefined,
				ts.factory.createIdentifier("key"),
				stringTypeReference,
			),
		],
		anyTypeReference,
	);
	
	const blockInterfaceDeclaration = ts.factory.createInterfaceDeclaration(
		undefined,
		ts.factory.createIdentifier(InterfaceName),
		undefined,
		undefined,
		[
			namePropertyDeclaration,
			isSelectedPropertyDeclaration,
			isSelectionEnabledPropertyDeclaration,
			clientIdPropertyDeclaration,
			attributesPropertyDeclaration,
			contextPropertyDeclaration,
			setAttributesMethodDeclaration,
			insertBlocksAfterMethodDeclaration,
			mergeBlocksMethodDeclaration,
			onRemoveMethodDeclaration,
			onReplaceMethodDeclaration,
			toggleSelectionMethodDeclaration,
			additionalFreeformProperties
		],
	);

	return blockInterfaceDeclaration;
};

const printTypeDeclaration = ( typeDeclaration ) => {
	const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
	const file = ts.createSourceFile("source.ts", "", ts.ScriptTarget.ESNext, false, ts.ScriptKind.TS);

	return printer.printNode(ts.EmitHint.Unspecified, typeDeclaration, file);
}



module.exports = {
	printTypeDeclaration,
	createAttributesInterface,
	createContextInterface,
	createInterfaceReference,
	createBlockInterface,
};