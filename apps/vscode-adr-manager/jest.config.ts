// Sync object
module.exports = {
	preset: "ts-jest",
	testEnvironment: "jsdom",
	transform: {
		// transform js/ts with ts-jest; tsconfig moved out of `globals` in ts-jest 29
		"^.+\\.(js|ts)$": ["ts-jest", { tsconfig: { allowJs: true } }]
	},
	testPathIgnorePatterns: ["dist"],
	transformIgnorePatterns: ["node_modules/(?!(antlr4|@adr-manager)/)"]
};
