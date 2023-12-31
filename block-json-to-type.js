const fs = require('fs');
const path = require('path');
const camelCase = require('camelcase');
const { sync: glob } = require('fast-glob');

const { printTypeDeclaration, createAttributesInterface, createBlockInterface, createContextInterface } = require('./src/transform');

class BlockJsonToTypescriptWebpackPlugin {
	constructor(options) {
		this.options = options || {};
	}

	apply(compiler) {
		compiler.hooks.afterEmit.tapAsync('BlockJsonToTypescriptWebpackPlugin', (compilation, callback) => {
			const { sourceDirectory, distDirectory } = this.options;


			// get all block.json files in the blocks directory
			const blockMetadataFiles = glob(
				// glob only accepts forward-slashes this is required to make things work on Windows
				`${sourceDirectory.replace(/\\/g, '/')}/**/block.json`,
				{
					absolute: true,
				},
			);

			blockMetadataFiles.forEach((blockMetadataFile) => {
				const source = blockMetadataFile;
				const blockName = path.basename(path.dirname(blockMetadataFile));
				const target = path.resolve(distDirectory, `${blockName}/types.d.ts`);
				// Check if both source and target options are provided
				if (!source || !target) {
					console.error('BlockJsonToTypescriptWebpackPlugin: Both source and target options are required.');
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
			});

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

		console.log(`BlockJsonToTypescriptWebpackPlugin: Created ${target}`);
	}

	generateTypeDeclaration(jsonContent) {

		const blockMetadata = JSON.parse(jsonContent);
		const name = blockMetadata.name;

		const namespaceName = camelCase(name.replace('/', '-'), { pascalCase: true });
		const attributesInterfaceName = `${namespaceName}Attributes`;
		const contextInterfaceName = `${namespaceName}Context`;
		const propsInterfaceName = `${namespaceName}Props`;

		const attributesInterface = createAttributesInterface(blockMetadata, attributesInterfaceName);

		const blockDeclaration = createBlockInterface(blockMetadata, propsInterfaceName, {
			attributesInterfaceName,
			contextInterfaceName,
		});

		const contextInterface = createContextInterface(blockMetadata, contextInterfaceName);

		let result = printTypeDeclaration(attributesInterface);
		result += '\n\n';
		result += printTypeDeclaration(contextInterface);
		result += '\n\n';
		result += printTypeDeclaration(blockDeclaration);

		return result;
	}
}

module.exports = BlockJsonToTypescriptWebpackPlugin;


