const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const camelCase = require('camelcase');

const anyTypeReference = ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
const stringTypeReference = ts.factory.createTypeReferenceNode("string");
const numberTypeReference = ts.factory.createTypeReferenceNode("number");
const booleanTypeReference = ts.factory.createTypeReferenceNode("boolean");
const arrayTypeReference = ts.factory.createTypeReferenceNode("Array", [anyTypeReference]);

const objectTypeReference = ts.factory.createTypeReferenceNode("Record", [stringTypeReference, anyTypeReference]);

const readonlyModifier = ts.factory.createModifier(ts.SyntaxKind.ReadonlyKeyword);
const declareModifier = ts.factory.createModifier(ts.SyntaxKind.DeclareKeyword);

function hasBlockSupport(block, feature) {
	return !! block.supports[feature];
}


class JsonToDtsPlugin {
	constructor(options) {
		this.options = options || {};
	}

	apply(compiler) {
		compiler.hooks.afterEmit.tapAsync('JsonToDtsPlugin', (compilation, callback) => {
			const { source, target } = this.options;

			// Check if both source and target options are provided
			if (!source || !target) {
				console.error('JsonToDtsPlugin: Both source and target options are required.');
				callback();
				return;
			}

			// Check if the TypeScript declaration file exists, create it if not
			if (!fs.existsSync(target)) {
				this.createDeclarationFile(target);
			}

			// Read the JSON file
			const jsonContent = fs.readFileSync(source, 'utf8');

			// Transform JSON to TypeScript declaration
			const tsDeclaration = this.generateTypeDeclaration(jsonContent);

			// Write the TypeScript declaration to the specified target file
			fs.writeFileSync(target, tsDeclaration, 'utf8');

			// Log a message to the console
			console.log(`JsonToDtsPlugin: Successfully transformed ${source} to ${target}`);

			// Continue with the webpack build process
			callback();
		});
	}

	createDeclarationFile(target) {
		const directory = path.dirname(target);

		// Create the directory if it doesn't exist
		if (!fs.existsSync(directory)) {
			fs.mkdirSync(directory, { recursive: true });
		}

		// Create an initial TypeScript declaration with an empty object
		const initialDeclaration = `declare const jsonData: {};`;

		// Write the initial TypeScript declaration to the specified target file
		fs.writeFileSync(target, initialDeclaration, 'utf8');

		console.log(`JsonToDtsPlugin: Created ${target}`);
	}

	getTypeReference(type) {
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

	generateTypeDeclaration(jsonContent) {

		const json = JSON.parse(jsonContent);
		const attributes = json.attributes;
		const name = json.name;

		const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
		const file = ts.createSourceFile("source.ts", "", ts.ScriptTarget.ESNext, false, ts.ScriptKind.TS);

		const attributesProperties = Object.keys(attributes).map((attributeName) => {
			const attribute = attributes[attributeName];
			const { type, default: defaultValue } = attribute;
			const hasDefaultValue = defaultValue !== undefined;

			const typeReference = this.getTypeReference(type);

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

		if (hasBlockSupport(json, 'align')) {
			const alignAttribute = ts.factory.createPropertySignature(
				[readonlyModifier],
				ts.factory.createIdentifier("align"),
				ts.factory.createToken(ts.SyntaxKind.QuestionToken),
				stringTypeReference,
			);

			attributesProperties.push(alignAttribute);
		}

		const namespaceName = camelCase(name.replace('/', '-'), { pascalCase: true });

		const blockAttributesDeclaration = ts.factory.createInterfaceDeclaration(
			undefined,
			namespaceName + "BlockAttributes",
			undefined,
			undefined,
			attributesProperties
		);

		let result = printer.printNode(ts.EmitHint.Unspecified, blockAttributesDeclaration, file);
		result += '\n\n' + printer.printNode(ts.EmitHint.Unspecified, blockAttributesDeclaration, file);

		return result;
	}
}

module.exports = JsonToDtsPlugin;


