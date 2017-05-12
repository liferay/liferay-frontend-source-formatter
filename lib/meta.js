var _ = require('lodash');
var falafel = require('falafel');
var path = require('path');
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var argv = require('./argv');
var base = require('./base');
var colors = require('cli-color-keywords')();

var INDENT = base.INDENT;

var VERBOSE = argv.v;

var extractRequires = node => {
	var requires = [];

	if (node && node.type == 'Property' && node.key.name == 'requires' && node.value && node.value.elements) {
		node.value.elements.forEach(
			(item, index) => {
				requires.push(item.value);
			}
		);
	}

	return requires;
};

var extractModuleMetaData = (node, metaDataObj) => {
	if (node.type == 'Property' && node.key.name == 'modules'
		&& node.parent.parent.type == 'Property' && node.parent.parent.key.name == 'liferay'
		&& node.value.type == 'ObjectExpression'
	) {
		var objSource = node.value.source();

		node.value.properties.forEach(
			(item, index) => {
				var val = item.value;
				var metaDataItem = {};

				if (val.type == 'ObjectExpression') {
					val.properties.forEach(
						(valItem, valIndex) => {
							var propName = valItem.key.name;
							var propValue = valItem.value;

							var metaDataItemValue = null;

							if (propName == 'path') {
								metaDataItemValue = propValue.value;

								metaDataObj.files.push(metaDataItemValue);
							}
							else if (propName == 'requires' && propValue.type == 'ArrayExpression') {
								// console.log(propName, propValue.elements);

								metaDataItemValue = extractRequires(valItem);
							}

							if (metaDataItemValue) {
								metaDataItem[propName] = metaDataItemValue;
							}
						}
					);
				}

				metaDataObj.meta[item.key.value] = metaDataItem;
			}
		);
	}

	return metaDataObj;
};

var extractFileMetaData = (node, moduleInfo, fileName) => {
	if (node.type == 'Property' && node.key.name == 'requires') {
		if (node.parent.parent.type == 'CallExpression') {
			var moduleDef = node.parent.parent;
			var moduleDefArgs = moduleDef.arguments;

			if (moduleDefArgs && moduleDefArgs.length && moduleDefArgs[0].type == 'Literal') {
				var moduleName = moduleDefArgs[0].value;

				if (moduleName && !moduleInfo.fileMeta.hasOwnProperty(moduleName)) {
					var fileModuleMetaData = extractRequires(node);

					moduleInfo.fileMeta[moduleName] = {
						path: fileName,
						requires: fileModuleMetaData
					};
				}
			}
		}
	}

	return moduleInfo;
};

var readFile = (filePath, fileName, moduleInfo) => fs.readFileAsync(filePath).then(
	contents => {
		contents = falafel(
			contents.toString(),
			node => {
				moduleInfo = extractFileMetaData(node, moduleInfo, fileName);
			}
		);
	}
).catch(_.noop);

var checkMissingModuleInfo = (files, metaDataObj) => {
	var missingModules = metaDataObj.missing;
	var moduleFiles = metaDataObj.files;

	if (files.length != moduleFiles.length) {
		var largest = files;
		var smallest = moduleFiles;

		if (moduleFiles.length > files.length) {
			largest = moduleFiles;
			smallest = files;
		}

		missingModules = largest.reduce(
			(prev, item, index) => {
				if (smallest.indexOf(item) === -1) {
					prev.push(item);
				}

				return prev;
			},
			missingModules
		);
	}

	return metaDataObj;
};

var diffArray = (array, values) => array.filter(
	(item, index) => values.indexOf(item) == -1
);

var checkMetaData = config => {
	var done = config.done;

	var liferayModuleDir = config.liferayModuleDir;

	var moduleContents = fs.readFileSync(path.join(liferayModuleDir, 'modules.js'));

	var moduleInfo = {
		fileMeta: {},
		files: [],
		meta: {},
		missing: []
	};

	var moduleMetaData = {};
	var moduleFiles = [];

	moduleContents = falafel(
		moduleContents.toString(),
		{
			loc: true,
			tolerant: true
		},
		node => {
			moduleInfo = extractModuleMetaData(node, moduleInfo);
		}
	);

	var fileSeries = [];

	fs.readdirAsync(liferayModuleDir).then(
		files => {
			files = files.filter(
				(item, index) => path.extname(item) == '.js' && item !== 'modules.js'
			);

			checkMissingModuleInfo(files, moduleInfo);

			var updateModules = [];

			files.forEach(
				(item, index) => {
					fileSeries.push(readFile(path.join(liferayModuleDir, item), item, moduleInfo));
				}
			);

			return Promsie.all(fileSeries).then(
				results => {
					var moduleKeys = Object.keys(moduleInfo.meta);
					var fileModuleKeys = Object.keys(moduleInfo.fileMeta);

					var largest = moduleInfo.meta;
					var smallest = moduleInfo.fileMeta;

					if (moduleKeys.length < fileModuleKeys.length) {
						largest = moduleInfo.fileMeta;
						smallest = moduleInfo.meta;
					}

					var combined = _.uniq(moduleKeys.concat(fileModuleKeys));

					var needsMetaSync = [];
					var needsModuleData = [];
					var needsFileData = [];

					combined.forEach(
						(item, index) => {
							var moduleMeta = moduleInfo.meta[item];
							var fileMeta = moduleInfo.fileMeta[item];

							var hasModuleMeta = !!moduleMeta;
							var hasFileMeta = !!fileMeta;

							var modFileIdentifier = `${item}: ${hasFileMeta ? fileMeta.path : moduleMeta.path}`;

							if (!hasModuleMeta && hasFileMeta) {
								needsModuleData.push(modFileIdentifier);
							}
							else if (hasModuleMeta && !hasFileMeta) {
								needsFileData.push(modFileIdentifier);
							}
							else {
								if (!moduleMeta.requires && fileMeta.requires) {
									needsMetaSync.push(modFileIdentifier);

									if (VERBOSE) {
										needsMetaSync.push(`${INDENT}modules.js: ${moduleMeta.requires}`);
										needsMetaSync.push(`${INDENT + fileMeta.path}: ${fileMeta.requires.join(', ')}`);
									}
								}
								else if (moduleMeta.requires && !fileMeta.requires) {
									needsMetaSync.push(modFileIdentifier);

									if (VERBOSE) {
										needsMetaSync.push(`${INDENT}modules.js: ${moduleMeta.requires.join(', ')}`);
										needsMetaSync.push(`${INDENT + fileMeta.path}: ${fileMeta.requires}`);
									}
								}
								else {
									var largeReq = moduleMeta.requires;
									var smallReq = fileMeta.requires;

									if (moduleMeta.requires.length < fileMeta.requires.length) {
										largeReq = fileMeta.requires;
										smallReq = moduleMeta.requires;
									}

									largeReq.sort();
									smallReq.sort();

									if (largeReq.join() !== smallReq.join()) {
										needsMetaSync.push(modFileIdentifier);

										if (VERBOSE) {
											needsMetaSync.push(`${INDENT}modules.js: ${moduleMeta.requires.join(', ')}`);
											needsMetaSync.push(`${INDENT + fileMeta.path}: ${fileMeta.requires.join(', ')}`);

											var merged = fileMeta.requires.concat(moduleMeta.requires);

											merged = _.uniq(merged).sort();

											needsMetaSync.push(`${INDENT}merged: '${merged.join('\', \'')}'`);
											needsMetaSync.push('---');
										}
									}
								}
							}
						}
					);

					if (needsMetaSync.length) {
						console.log('The following modules/files need their requires arrays synced with modules.js:');

						console.log(colors.warn(INDENT + needsMetaSync.join('\n' + INDENT)));

						console.log(colors.subtle('----'));
					}

					if (needsModuleData.length) {
						console.log('The following modules/files need their metadata added to modules.js:');

						console.log(colors.warn(INDENT + needsModuleData.join('\n' + INDENT)));

						console.log(colors.subtle('----'));
					}

					if (needsFileData.length) {
						console.log('The following modules/files need their meta data added to their files:');

						console.log(colors.warn(INDENT + needsFileData.join('\n' + INDENT)));

						console.log(colors.subtle('----'));
					}

					if (VERBOSE && moduleInfo.missing.length) {
						console.log('The following files are missing any metadata:');

						console.log(colors.warn(INDENT + moduleInfo.missing.join('\n' + INDENT)));

						console.log(colors.subtle('----'));
					}
				}
			);
		}
	);
};

module.exports = {
	check(config) {
		return checkMetaData(config);
	}
};