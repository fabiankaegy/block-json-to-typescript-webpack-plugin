const ts = require('typescript');

const anyTypeReference = ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
const stringTypeReference = ts.factory.createTypeReferenceNode("string");
const numberTypeReference = ts.factory.createTypeReferenceNode("number");
const booleanTypeReference = ts.factory.createTypeReferenceNode("boolean");
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

const createAttributesInterface = ( blockMetadata, InterfaceName ) => {
	const attributes = blockMetadata.attributes;

	const attributesProperties = Object.keys(attributes).map((attributeName) => {
		const attribute = attributes[attributeName];
		const { type, default: defaultValue } = attribute;
		const hasDefaultValue = defaultValue !== undefined;

		const typeReference = getTypeReference(type);

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

const createInterfaceReference = ( interfaceName ) => {
	return ts.factory.createTypeReferenceNode(interfaceName);
}

const createBlockInterface = ( blockMetadata, InterfaceName, options ) => {
	const { attributesInterfaceName, contextInterfaceName } = options;

	const clientIdPropertyDeclaration = ts.factory.createPropertySignature(
		[readonlyModifier],
		ts.factory.createIdentifier("clientId"),
		undefined,
		stringTypeReference,
	);

	const attributesPropertyDeclaration = ts.factory.createPropertySignature(
		[readonlyModifier],
		ts.factory.createIdentifier("attributes"),
		undefined,
		createInterfaceReference(attributesInterfaceName),
	);

	const contextPropertyDeclaration = ts.factory.createPropertySignature(
		[readonlyModifier],
		ts.factory.createIdentifier("context"),
		ts.factory.createToken(ts.SyntaxKind.QuestionToken),
		createInterfaceReference(contextInterfaceName),
	);
	
	const blockInterfaceDeclaration = ts.factory.createInterfaceDeclaration(
		undefined,
		ts.factory.createIdentifier(InterfaceName),
		undefined,
		undefined,
		[
			clientIdPropertyDeclaration,
			attributesPropertyDeclaration,
			contextPropertyDeclaration,
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
	createInterfaceReference,
	createBlockInterface,
};