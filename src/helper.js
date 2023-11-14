function deepClone(obj) {
	return JSON.parse(JSON.stringify(obj));
}

const hasBlockSupport = (block, feature) => {
	if (!block.supports) {
		return false;
	}
	return !! block.supports[feature];
}

module.exports = {
	deepClone,
	hasBlockSupport,
};
